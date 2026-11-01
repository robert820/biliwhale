const HOST_ID = "bili-motrix-host";
const SCRIPT_ID = "bili-motrix-ext-content-script";

(function (window) {
  const getOriginalBilibiliImageUrl = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      if (!/(^|\.)hdslb\.com$/i.test(url.hostname) ||
          !/^\/bfs\/(new_dyn|opus|album|article)\//i.test(url.pathname)) return "";

      const transformIndex = url.pathname.indexOf("@");
      if (transformIndex === -1) return "";
      url.pathname = url.pathname.slice(0, transformIndex);
      url.hash = "";
      return url.href;
    } catch {
      return "";
    }
  };

  const restoreImageUrlBeforeNativeContextMenu = (event) => {
    if (event.type === "mousedown" && event.button !== 2) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const image = target?.closest("img");
    if (!image) return;

    const candidates = [image.currentSrc, image.getAttribute("src"), image.getAttribute("data-src")];
    const originalUrl = candidates.map(getOriginalBilibiliImageUrl).find(Boolean);
    if (!originalUrl) return;

    image.removeAttribute("srcset");
    image.closest("picture")?.querySelectorAll("source[srcset]").forEach((source) => {
      source.removeAttribute("srcset");
    });
    image.setAttribute("src", originalUrl);
    ["data-src", "data-original"].forEach((name) => {
      const value = image.getAttribute(name);
      const normalized = getOriginalBilibiliImageUrl(value);
      if (normalized) image.setAttribute(name, normalized);
    });
  };

  document.addEventListener("mousedown", restoreImageUrlBeforeNativeContextMenu, true);
  document.addEventListener("contextmenu", restoreImageUrlBeforeNativeContextMenu, true);

  if (window.location.href.indexOf("bilibili.com/s/video/") !== -1) {
    return window.location.replace(window.location.href.replace("/s/", "/"));
  }

  const root = document.head || document.documentElement;

  // Insert style to keep floating host on top even during fullscreen
  const style = document.createElement("style");
  style.textContent = `
    [class*="fullscreen"] #${HOST_ID},
    [class*="webscreen-fix"] #${HOST_ID} {
      z-index: 2147483647 !important;
    }
  `;
  root.appendChild(style);

  // Inject content script module
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.type = "module";

  const manifest = chrome.runtime.getManifest();

  script.dataset.internals = JSON.stringify({
    baseUrl: chrome.runtime.getURL("/").replace(/\/$/, ""),
    characterUrl: chrome.runtime.getURL("assets/deepseek_maid.png"),
    iconUrl: chrome.runtime.getURL("assets/icon128.png"),
    manifest: {
      name: manifest.name,
      version: manifest.version
    }
  });

  script.src = chrome.runtime.getURL("content.js") + `?v=${manifest.version}`;
  root.appendChild(script);

  // ---------------------------------------------------------------------------
  // Legacy settings (page-origin localStorage) are UNTRUSTED: any page script can
  // write them. They are never applied here. The background parks them as
  // "pending" in chrome.storage.local; only the extension Popup can apply them.
  // The page copy is removed only after the background confirms it is stored.
  // ---------------------------------------------------------------------------
  try {
    const LEGACY_KEYS = ["bili_motrix_rpc_token", "bili_motrix_rpc_url", "bili_motrix_rpc_dir"];
    const legacy = {};
    for (const key of LEGACY_KEYS) {
      const value = window.localStorage.getItem(key);
      if (typeof value === "string" && value.trim()) legacy[key] = value.trim().slice(0, 2048);
    }
    if (Object.keys(legacy).length > 0) {
      chrome.runtime.sendMessage({ type: "LEGACY_MIGRATE", legacy }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok || !Array.isArray(response.handled)) return;
        for (const key of response.handled) {
          if (!LEGACY_KEYS.includes(key)) continue;
          // Remove only if the value is still the one that was stored.
          try {
            const current = window.localStorage.getItem(key);
            if (typeof current === "string" && current.trim().slice(0, 2048) === legacy[key]) {
              window.localStorage.removeItem(key);
            }
          } catch {}
        }
      });
    }
  } catch {}

  // ---------------------------------------------------------------------------
  // Page <-> extension bridge.
  //
  // The MAIN world (content.js and the website's own scripts share it) cannot be
  // trusted: any website script can post any message. So this bridge:
  //   * carries no secret, token or credential in either direction;
  //   * forwards only a few fixed request types with strictly checked fields;
  //   * lets the background decide the RPC endpoint, secret and save directory;
  //   * requires a recent *trusted user click* (event.isTrusted, which page
  //     scripts cannot forge) on a BiliWhale control before any sensitive action.
  //
  // A trusted click is NOT full identity proof: a page could overlay a fake
  // control or reuse a live grant inside its short window. That is why grants
  // are short-lived and single/dual use, why they are created only here (never
  // from page-controlled data), and why the background still restricts every
  // action to Bilibili CDN URLs and known file types.
  // ---------------------------------------------------------------------------
  const GRANT_RULES = {
    // "push to RPC" (dual mode = video + audio). The 2nd request is only sent after the 1st
    // returns, and the background aborts an RPC call after 10 s, so the window must exceed 10 s.
    rpc: { ttl: 15000, uses: 2 },
    download: { ttl: 30000, uses: 1 },  // cover download via extension
    settings: { ttl: 5000, uses: 1 }    // open RPC settings
  };
  const CLICK_TARGETS = new Map([
    ["btn-rpc-action", { kind: "rpc", inShadow: true }],
    ["btn-browser-action", { kind: "download", inShadow: true }],
    ["btn-center-cover", { kind: "download", inShadow: true }],
    ["btn-open-rpc-settings", { kind: "settings", inShadow: true }],
    ["bili-article-cover-btn", { kind: "download", inShadow: false }]
  ]);
  const grants = Object.create(null);

  window.addEventListener("click", (event) => {
    if (!event.isTrusted) return;
    for (const node of event.composedPath()) {
      if (!(node instanceof Element) || !node.id) continue;
      const rule = CLICK_TARGETS.get(node.id);
      if (!rule) continue;
      if (rule.inShadow) {
        const root = node.getRootNode();
        if (!(root instanceof ShadowRoot) || !root.host || root.host.id !== HOST_ID) continue;
      }
      const spec = GRANT_RULES[rule.kind];
      grants[rule.kind] = { uses: spec.uses, expires: Date.now() + spec.ttl };
      return;
    }
  }, true);

  const consumeGrant = (kind) => {
    const grant = grants[kind];
    if (!grant || grant.uses <= 0 || Date.now() > grant.expires) return false;
    grant.uses -= 1;
    return true;
  };

  const reply = (requestId, response) => {
    window.postMessage({ type: "BILI_EXT_RESPONSE", requestId, response }, window.location.origin);
  };

  const forward = (requestId, message) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime.lastError;
        reply(requestId, response || { ok: false, error: err?.message || "無法與後台通訊" });
      });
    } catch (err) {
      reply(requestId, { ok: false, error: err?.message || "無法與後台通訊" });
    }
  };

  const isShortString = (value, max) => typeof value === "string" && value.length <= max;

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || typeof data !== "object" || !isShortString(data.type, 64) || !data.type.startsWith("BILI_EXT_")) return;
    if (!isShortString(data.requestId, 80) || !data.requestId) return;
    const requestId = data.requestId;

    switch (data.type) {
      case "BILI_EXT_GET_RPC_STATUS":
        forward(requestId, { type: "RPC_STATUS" });
        return;

      case "BILI_EXT_RPC_CALL": {
        if (data.method === "getVersion") {
          forward(requestId, { type: "RPC_CALL", method: "getVersion" });
        } else if (data.method === "tellActive") {
          forward(requestId, {
            type: "RPC_CALL",
            method: "tellActive",
            title: isShortString(data.title, 300) ? data.title : ""
          });
        } else if (data.method === "addUri") {
          const urls = Array.isArray(data.urls) && data.urls.length <= 32 &&
            data.urls.every((u) => isShortString(u, 4096)) ? data.urls.slice() : null;
          if (!urls || !isShortString(data.filename, 300)) {
            reply(requestId, { ok: false, error: "無效的推送參數" });
          } else if (!consumeGrant("rpc")) {
            reply(requestId, { ok: false, error: "需要先在 BiliWhale 面板上點擊操作按鈕" });
          } else {
            forward(requestId, { type: "RPC_CALL", method: "addUri", urls, filename: data.filename });
          }
        } else {
          reply(requestId, { ok: false, error: "不允許的 RPC 呼叫方法" });
        }
        return;
      }

      case "BILI_EXT_DOWNLOAD_URL":
        if (!isShortString(data.url, 4096) || !isShortString(data.filename, 300)) {
          reply(requestId, { ok: false, error: "無效的下載參數" });
        } else if (!consumeGrant("download")) {
          reply(requestId, { ok: false, error: "需要先在 BiliWhale 面板上點擊下載按鈕" });
        } else {
          forward(requestId, { type: "DOWNLOAD_URL", url: data.url, filename: data.filename });
        }
        return;

      case "BILI_EXT_OPEN_SETTINGS":
        if (!consumeGrant("settings")) {
          reply(requestId, { ok: false, error: "需要由使用者點擊「開啟 RPC 設定」" });
        } else {
          forward(requestId, { type: "OPEN_SETTINGS" });
        }
        return;

      default:
        return;
    }
  });

})(window);
