// Background Service Worker (Manifest V3)
// Privileged network & native downloads proxy

function normalizeBilibiliImageUrl(rawUrl) {
  const url = new URL(rawUrl);
  const transformIndex = url.pathname.indexOf("@");
  if (transformIndex !== -1) url.pathname = url.pathname.slice(0, transformIndex);
  url.hash = "";

  if (url.protocol !== "https:" || !/(^|\.)hdslb\.com$/i.test(url.hostname) ||
      !/^\/bfs\/(new_dyn|opus|album|article)\//i.test(url.pathname)) {
    throw new Error("不是支援的 Bilibili 圖片網址");
  }
  return url;
}

function downloadOriginalBilibiliImage(rawUrl) {
  const imageUrl = normalizeBilibiliImageUrl(rawUrl);
  const encodedName = imageUrl.pathname.split("/").filter(Boolean).pop() || `bilibili_image_${Date.now()}`;
  let filename = encodedName;
  try {
    filename = decodeURIComponent(encodedName);
  } catch {
    // Keep the original path segment when it contains malformed escaping.
  }
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, "_");

  chrome.downloads.download({ url: imageUrl.href, filename: safeFilename, saveAs: false }, (downloadId) => {
    const error = chrome.runtime.lastError;
    if (error || !downloadId) {
      console.error("BiliWhale image download failed:", error?.message || "無法啟動圖片下載");
    }
  });
}

// ---------------------------------------------------------------------------
// Trust model
// Page scripts (MAIN world) can post any message, so nothing sent from the page
// is trusted. This worker only accepts messages from the extension's own
// content script (sender.id + bilibili top frame), re-validates every field,
// and takes the RPC endpoint / secret / directory from chrome.storage.local.
// ---------------------------------------------------------------------------

const RPC_URL_KEY = "bili_motrix_rpc_url";
const RPC_TOKEN_KEY = "bili_motrix_rpc_token";
const RPC_DIR_KEY = "bili_motrix_rpc_dir";
const PENDING_KEY = "bili_legacy_pending";
const DEFAULT_RPC_URL = "http://localhost:16800/jsonrpc";

const BILI_MEDIA_HOST_RE = /(^|\.)(bilibili\.com|bilivideo\.com|bilivideo\.cn|hdslb\.com|akamaized\.net)$/i;
const IMAGE_HOST_RE = /(^|\.)hdslb\.com$/i;
const RPC_FILE_EXT_RE = /\.(mp4|m4a|png|jpe?g|webp)$/i;
const IMAGE_FILE_EXT_RE = /\.(png|jpe?g|webp)$/i;
const MAX_URIS_PER_TASK = 32;
const MAX_URL_LENGTH = 4096;

function isValidSender(sender) {
  if (!sender || sender.id !== chrome.runtime.id || !sender.tab || sender.frameId !== 0 || !sender.url) return false;
  try {
    const u = new URL(sender.url);
    return (u.protocol === "https:" || u.protocol === "http:") && /(^|\.)bilibili\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function parseRpcEndpoint(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    u.hash = "";
    return u;
  } catch {
    return null;
  }
}

function sanitizeOutName(name, extRe) {
  if (typeof name !== "string") return "";
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 200);
  return extRe.test(cleaned) ? cleaned : "";
}

function filterMediaUris(urls) {
  if (!Array.isArray(urls)) return [];
  const out = [];
  for (const raw of urls.slice(0, MAX_URIS_PER_TASK)) {
    if (typeof raw !== "string" || raw.length > MAX_URL_LENGTH) continue;
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      if (u.username || u.password) continue;
      if (!BILI_MEDIA_HOST_RE.test(u.hostname)) continue;
      out.push(u.href);
    } catch {}
  }
  return out;
}

function isAllowedCoverUrl(raw) {
  if (typeof raw !== "string" || raw.length > MAX_URL_LENGTH) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.username || u.password) return false;
    return IMAGE_HOST_RE.test(u.hostname) && u.pathname.startsWith("/bfs/");
  } catch {
    return false;
  }
}

function normalizePending(raw) {
  const out = { url: [], dir: [], token: [] };
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(out)) {
      if (Array.isArray(raw[k])) out[k] = raw[k].filter((v) => typeof v === "string");
    }
  }
  return out;
}

async function getRpcConfig() {
  const items = await chrome.storage.local.get([RPC_URL_KEY, RPC_TOKEN_KEY, RPC_DIR_KEY, PENDING_KEY]);
  const endpoint = parseRpcEndpoint(items[RPC_URL_KEY] || DEFAULT_RPC_URL);
  const pending = normalizePending(items[PENDING_KEY]);
  return {
    endpoint,
    token: typeof items[RPC_TOKEN_KEY] === "string" ? items[RPC_TOKEN_KEY] : "",
    dir: typeof items[RPC_DIR_KEY] === "string" ? items[RPC_DIR_KEY].trim() : "",
    hasPending: pending.url.length + pending.dir.length + pending.token.length > 0
  };
}

async function aria2Call(cfg, method, params) {
  if (!cfg.endpoint) throw new Error("RPC 位址設定無效，請在擴充功能 Popup 重新設定");
  const rpcParams = cfg.token ? [`token:${cfg.token}`, ...params] : params;
  const res = await fetch(cfg.endpoint.href, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `bili_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      method,
      params: rpcParams
    }),
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000)
  });
  let data = null;
  try {
    data = JSON.parse(await res.text());
  } catch {}
  if (data && data.error) throw new Error(data.error.message || "RPC 回傳錯誤");
  if (!res.ok) throw new Error(`HTTP ${res.status} 連線失敗`);
  if (!data) throw new Error("無效的 RPC 回應");
  return data.result;
}

// Only the three Aria2 operations the extension actually uses.
async function handleRpcCall(message) {
  const cfg = await getRpcConfig();

  if (message.method === "getVersion") {
    const result = await aria2Call(cfg, "aria2.getVersion", []);
    return { ok: true, version: result?.version || "" };
  }

  if (message.method === "tellActive") {
    const title = typeof message.title === "string" ? message.title.slice(0, 300) : "";
    const tasks = await aria2Call(cfg, "aria2.tellActive", [["gid", "files"]]);
    const downloading = Array.isArray(tasks) && tasks.some((task) =>
      Array.isArray(task?.files) && task.files.some((f) => f && f.path && String(f.path).includes(title)));
    return { ok: true, downloading };
  }

  if (message.method === "addUri") {
    const uris = filterMediaUris(message.urls);
    if (uris.length === 0) return { ok: false, error: "不允許的下載網址" };
    const out = sanitizeOutName(message.filename, RPC_FILE_EXT_RE);
    if (!out) return { ok: false, error: "不允許的檔案名稱或副檔名" };

    const options = {
      header: [
        "Referer: https://www.bilibili.com/",
        `User-Agent: ${navigator.userAgent}`
      ],
      out,
      "remote-time": "false",
      "split": "8",
      "max-connection-per-server": "8",
      "min-split-size": "1M"
    };
    // Save directory comes only from the trusted stored setting.
    // Relative / empty values are not sent so Aria2/Motrix uses its own default.
    if (cfg.dir && /^[a-zA-Z]:\\|^\\\\|^\//.test(cfg.dir)) options.dir = cfg.dir;

    const result = await aria2Call(cfg, "aria2.addUri", [uris, options]);
    return { ok: true, result };
  }

  return { ok: false, error: "不允許的 RPC 呼叫方法" };
}

async function handleRpcStatus() {
  const cfg = await getRpcConfig();
  return {
    ok: true,
    rpcUrl: cfg.endpoint ? cfg.endpoint.href : "",
    rpcDir: cfg.dir,
    hasToken: Boolean(cfg.token),
    hasPending: cfg.hasPending
  };
}

// Cover images only: the sole legitimate page-triggered download.
async function handleDownloadUrl(message) {
  if (!isAllowedCoverUrl(message.url)) return { ok: false, error: "不允許的下載網址" };
  const filename = sanitizeOutName(message.filename, IMAGE_FILE_EXT_RE);
  if (!filename) return { ok: false, error: "不允許的檔案名稱或副檔名" };
  const downloadId = await new Promise((resolve, reject) => {
    chrome.downloads.download({ url: new URL(message.url).href, filename, saveAs: false }, (id) => {
      const err = chrome.runtime.lastError;
      if (err || !id) reject(new Error(err?.message || "無法啟動下載"));
      else resolve(id);
    });
  });
  return { ok: true, downloadId };
}

// The Popup opens a long-lived port while it is visible; this is how the worker knows it is open.
let popupPortCount = 0;
let popupClosedAt = 0;
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "biliwhale-popup" || port.sender?.id !== chrome.runtime.id) return;
  popupPortCount++;
  port.onDisconnect.addListener(() => {
    popupPortCount = Math.max(0, popupPortCount - 1);
    popupClosedAt = Date.now();
  });
});

async function handleOpenSettings() {
  // No tab fallback: if the popup cannot be opened, the page shows a short hint instead.
  if (typeof chrome.action?.openPopup !== "function") return { ok: false, error: "openPopup unavailable" };
  // Clicking anywhere on the page closes an already-open popup. Track whether it was open
  // (the popup holds a port while open) so the page can show an accurate message, and keep
  // retrying for longer while the popup is still closing before giving up.
  const wasOpen = popupPortCount > 0 || Date.now() - popupClosedAt < 2000;
  const attempts = wasOpen ? 6 : 2;
  let lastError = "openPopup failed";
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      await chrome.action.openPopup();
      return { ok: true };
    } catch (err) {
      lastError = err?.message || lastError;
    }
  }
  return { ok: false, wasOpen, error: lastError };
}

// Legacy page-origin (bilibili.com localStorage) settings are untrusted: they are
// never applied automatically. They are parked in chrome.storage.local as
// "pending" and only a user click in the extension Popup can apply them.
let migrateQueue = Promise.resolve();
function handleLegacyMigrate(message) {
  const run = async () => {
    const legacy = message.legacy;
    if (!legacy || typeof legacy !== "object") return { ok: false, error: "invalid" };
    const map = { [RPC_TOKEN_KEY]: "token", [RPC_URL_KEY]: "url", [RPC_DIR_KEY]: "dir" };
    const items = await chrome.storage.local.get([...Object.keys(map), PENDING_KEY]);
    const pending = normalizePending(items[PENDING_KEY]);
    const candidates = [];
    let changed = false;
    for (const [key, short] of Object.entries(map)) {
      const raw = legacy[key];
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (!value || value.length > 2048) continue;
      if (items[key] === value || pending[short].includes(value)) {
        candidates.push({ key, short, value });
      } else if (pending[short].length < 5) {
        pending[short].push(value);
        changed = true;
        candidates.push({ key, short, value });
      }
    }
    if (changed) await chrome.storage.local.set({ [PENDING_KEY]: pending });
    // Re-read and report a key as handled only if it is confirmed to be stored.
    const verify = await chrome.storage.local.get([...Object.keys(map), PENDING_KEY]);
    const stored = normalizePending(verify[PENDING_KEY]);
    const handled = candidates
      .filter((c) => verify[c.key] === c.value || stored[c.short].includes(c.value))
      .map((c) => c.key);
    return { ok: true, handled };
  };
  const result = migrateQueue.then(run, run);
  migrateQueue = result.catch(() => {});
  return result;
}

const MESSAGE_HANDLERS = {
  RPC_STATUS: handleRpcStatus,
  RPC_CALL: handleRpcCall,
  DOWNLOAD_URL: handleDownloadUrl,
  OPEN_SETTINGS: handleOpenSettings,
  LEGACY_MIGRATE: handleLegacyMigrate
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = message && typeof message.type === "string" &&
    Object.prototype.hasOwnProperty.call(MESSAGE_HANDLERS, message.type)
    ? MESSAGE_HANDLERS[message.type]
    : null;
  if (!handler) return false;
  if (!isValidSender(sender)) {
    sendResponse({ ok: false, error: "未授權的訊息發送端" });
    return false;
  }
  handler(message).then(sendResponse, (err) => {
    sendResponse({ ok: false, error: err?.message || String(err) });
  });
  return true; // async response
});

const BILIBILI_IMAGE_MENU_ID = "biliwhale-download-original-image";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: BILIBILI_IMAGE_MENU_ID,
      title: "下載原圖片",
      contexts: ["image"],
      documentUrlPatterns: ["*://*.bilibili.com/*"],
      targetUrlPatterns: ["*://*.hdslb.com/bfs/*"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== BILIBILI_IMAGE_MENU_ID || !info.srcUrl) return;
  try {
    const pageUrl = new URL(info.pageUrl || tab?.url || "");
    if (!/(^|\.)bilibili\.com$/i.test(pageUrl.hostname)) return;
    downloadOriginalBilibiliImage(info.srcUrl);
  } catch (error) {
    console.error("BiliWhale image download failed:", error.message);
  }
});
