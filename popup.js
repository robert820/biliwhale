// Lets the background know the popup is open (the port closes automatically when it closes).
try { chrome.runtime.connect({ name: "biliwhale-popup" }); } catch {}

const rpcHostInput = document.getElementById("rpc-host");
const rpcPortInput = document.getElementById("rpc-port");
const rpcTokenInput = document.getElementById("rpc-token");
const rpcDirInput = document.getElementById("rpc-dir");
const rpcStatus = document.getElementById("rpc-status");
const statusText = document.getElementById("status-text");
const btnTest = document.getElementById("btn-test");

const txtEndpoint = document.getElementById("txt-endpoint");
const txtDir = document.getElementById("txt-dir");
const txtToken = document.getElementById("txt-token");

const I18N = {
  "zh-TW": {
    connected: (ver) => `Aria2 已連線 (v${ver})`,
    disconnected: "RPC 尚未啟動 (仍可使用瀏覽器下載)",
    checking: "檢測中...",
    endpoint: "RPC 介面 (獨立通訊埠輸入)",
    dir: "儲存目錄",
    dirPlaceholder: "預設 C:\\Downloads\\Video",
    token: "RPC 密鑰",
    tokenPlaceholder: "選填 (無密碼留空)",
    invalidUrl: "RPC 位址無效 (需為 http:// 或 https://，且不可含帳密)",
    pendingTitle: "網頁舊設定待確認 (來源不可信，不會自動套用)",
    pendingUrl: "RPC 位址",
    pendingDir: "儲存目錄",
    pendingToken: "RPC 密鑰",
    apply: "套用",
    ignore: "忽略"
  },
  "zh-CN": {
    connected: (ver) => `Aria2 已连接 (v${ver})`,
    disconnected: "RPC 尚未启动 (仍可使用浏览器下载)",
    checking: "检测中...",
    endpoint: "RPC 接口 (独立端口输入)",
    dir: "保存目录",
    dirPlaceholder: "默认 C:\\Downloads\\Video",
    token: "RPC 密钥",
    tokenPlaceholder: "选填 (无密码留空)",
    invalidUrl: "RPC 地址无效 (需为 http:// 或 https://，且不可含账密)",
    pendingTitle: "网页旧设置待确认 (来源不可信，不会自动应用)",
    pendingUrl: "RPC 地址",
    pendingDir: "保存目录",
    pendingToken: "RPC 密钥",
    apply: "应用",
    ignore: "忽略"
  },
  "en": {
    connected: (ver) => `Aria2 Connected (v${ver})`,
    disconnected: "RPC not started (Browser download available)",
    checking: "Checking...",
    endpoint: "RPC Endpoint (Separate port input)",
    dir: "Save Directory",
    dirPlaceholder: "Default C:\\Downloads\\Video",
    token: "RPC Secret",
    tokenPlaceholder: "Optional (token)",
    invalidUrl: "Invalid RPC address (http:// or https://, no credentials)",
    pendingTitle: "Legacy web-page settings pending (untrusted, not applied automatically)",
    pendingUrl: "RPC address",
    pendingDir: "Save directory",
    pendingToken: "RPC secret",
    apply: "Apply",
    ignore: "Ignore"
  }
};

function getActiveLanguage() {
  const saved = localStorage.getItem("bili_downloader_lang");
  if (saved && I18N[saved]) return saved;

  const browserLang = (navigator.language || navigator.userLanguage || "zh-TW").toLowerCase();
  if (browserLang.includes("tw") || browserLang.includes("hk") || browserLang.includes("mo") || browserLang.includes("hant")) {
    return "zh-TW";
  }
  if (browserLang.includes("cn") || browserLang.includes("sg") || browserLang.includes("hans")) {
    return "zh-CN";
  }
  if (browserLang.startsWith("en")) {
    return "en";
  }
  return "zh-TW";
}

const T = I18N[getActiveLanguage()];

function parseRpcParts(fullUrl) {
  try {
    const u = new URL(fullUrl);
    return {
      host: `${u.protocol}//${u.hostname}`,
      port: u.port || "16800",
      path: u.pathname || "/jsonrpc"
    };
  } catch (e) {
    return { host: "http://localhost", port: "16800", path: "/jsonrpc" };
  }
}

const getFullRpcUrl = () => {
  const h = rpcHostInput.value.trim() || "http://localhost";
  const p = rpcPortInput.value.trim() || "16800";
  return `${h}:${p}/jsonrpc`;
};

const STORAGE_KEYS = ["bili_motrix_rpc_url", "bili_motrix_rpc_token", "bili_motrix_rpc_dir"];
const PENDING_KEY = "bili_legacy_pending";
const DEFAULT_RPC_URL = "http://localhost:16800/jsonrpc";

const isValidRpcUrl = (value) => {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && !u.username && !u.password;
  } catch {
    return false;
  }
};

// The Popup's own localStorage belongs to the extension origin, so it is trusted
// (a web page cannot write to it). It only fills settings that are still empty,
// never overwrites a configured value, and the old copy is deleted only after the
// new value is confirmed to be stored.
const migratePopupLocalStorage = (items) => new Promise((resolve) => {
  const updates = {};
  for (const key of STORAGE_KEYS) {
    let legacy = null;
    try { legacy = localStorage.getItem(key); } catch {}
    if (typeof legacy !== "string" || !legacy.trim()) continue;
    const value = legacy.trim();
    const current = items[key];
    if (current === value) {
      try { localStorage.removeItem(key); } catch {}
      continue;
    }
    const isEmpty = current === undefined || (key === "bili_motrix_rpc_token" && current === "");
    if (isEmpty && (key !== "bili_motrix_rpc_url" || isValidRpcUrl(value))) updates[key] = value;
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) return resolve();
  chrome.storage.local.set(updates, () => {
    if (chrome.runtime.lastError) return resolve();
    chrome.storage.local.get(keys, (check) => {
      for (const key of keys) {
        if (check[key] === updates[key]) {
          try { localStorage.removeItem(key); } catch {}
        }
      }
      resolve();
    });
  });
});

// Settings found in a bilibili.com page's localStorage are untrusted (any page script can
// write them). The background parks them as "pending"; they are applied only by a click here.
const PENDING_FIELDS = [
  { short: "url", key: "bili_motrix_rpc_url", label: () => T.pendingUrl },
  { short: "dir", key: "bili_motrix_rpc_dir", label: () => T.pendingDir },
  { short: "token", key: "bili_motrix_rpc_token", label: () => T.pendingToken }
];

const removePending = (short, value, done) => {
  chrome.storage.local.get([PENDING_KEY], (items) => {
    const pending = items[PENDING_KEY] || {};
    pending[short] = (Array.isArray(pending[short]) ? pending[short] : []).filter((v) => v !== value);
    const empty = PENDING_FIELDS.every((f) => !Array.isArray(pending[f.short]) || pending[f.short].length === 0);
    const finish = () => done && done();
    if (empty) chrome.storage.local.remove(PENDING_KEY, finish);
    else chrome.storage.local.set({ [PENDING_KEY]: pending }, finish);
  });
};

const renderPending = () => {
  const box = document.getElementById("pending-box");
  const list = document.getElementById("pending-list");
  const title = document.getElementById("txt-pending");
  if (!box || !list) return;
  chrome.storage.local.get([PENDING_KEY], (items) => {
    const pending = items[PENDING_KEY] || {};
    list.textContent = "";
    let count = 0;
    for (const field of PENDING_FIELDS) {
      const values = Array.isArray(pending[field.short]) ? pending[field.short] : [];
      for (const value of values) {
        if (typeof value !== "string") continue;
        count++;
        const row = document.createElement("div");
        row.className = "pending-row";

        const label = document.createElement("div");
        label.className = "pending-label";
        // Untrusted text: always textContent, never innerHTML. Secrets stay masked.
        label.textContent = `${field.label()}: ${field.short === "token" ? "••••••" : value}`;

        const applyBtn = document.createElement("button");
        applyBtn.className = "btn primary";
        applyBtn.textContent = T.apply;
        applyBtn.addEventListener("click", () => {
          if (field.short === "url" && !isValidRpcUrl(value)) return removePending(field.short, value, renderPending);
          chrome.storage.local.set({ [field.key]: value }, () => {
            if (chrome.runtime.lastError) return;
            removePending(field.short, value, () => { renderPending(); loadSettings(); });
          });
        });

        const ignoreBtn = document.createElement("button");
        ignoreBtn.className = "btn";
        ignoreBtn.textContent = T.ignore;
        ignoreBtn.addEventListener("click", () => removePending(field.short, value, renderPending));

        const actions = document.createElement("div");
        actions.className = "pending-actions";
        actions.append(applyBtn, ignoreBtn);
        row.append(label, actions);
        list.appendChild(row);
      }
    }
    if (title) title.textContent = T.pendingTitle;
    box.style.display = count > 0 ? "" : "none";
  });
};

// Load stored settings
const loadSettings = () => {
  chrome.storage.local.get(STORAGE_KEYS, async (first) => {
    await migratePopupLocalStorage(first);
    chrome.storage.local.get(STORAGE_KEYS, (items) => {
      const fullUrl = items.bili_motrix_rpc_url || DEFAULT_RPC_URL;
      const token = items.bili_motrix_rpc_token || "";
      const dir = items.bili_motrix_rpc_dir || "";

      const parts = parseRpcParts(fullUrl);
      rpcHostInput.value = parts.host;
      rpcPortInput.value = parts.port;
      rpcTokenInput.value = token;
      rpcDirInput.value = dir;

      // Apply localized placeholders
      if (txtEndpoint) txtEndpoint.textContent = T.endpoint;
      if (txtDir) txtDir.textContent = T.dir;
      if (rpcDirInput) rpcDirInput.placeholder = T.dirPlaceholder;
      if (txtToken) txtToken.textContent = T.token;
      if (rpcTokenInput) rpcTokenInput.placeholder = T.tokenPlaceholder;

      renderPending();
      testConnection(fullUrl, token);
    });
  });
};

const testConnection = async (url, token) => {
  statusText.textContent = T.checking;
  rpcStatus.className = "status-badge";

  try {
    const params = token ? [`token:${token}`] : [];
    const payload = {
      jsonrpc: "2.0",
      id: `test_${Date.now()}`,
      method: "aria2.getVersion",
      params: params
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.result && data.result.version) {
      rpcStatus.className = "status-badge connected";
      statusText.textContent = T.connected(data.result.version);
      return;
    }
    throw new Error(data.error?.message || "RPC 返回錯誤");
  } catch (e) {
    rpcStatus.className = "status-badge";
    statusText.textContent = T.disconnected;
  }
};

const saveUrl = () => {
  const full = getFullRpcUrl();
  if (!isValidRpcUrl(full)) {
    rpcStatus.className = "status-badge";
    statusText.textContent = T.invalidUrl;
    return;
  }
  chrome.storage.local.set({ bili_motrix_rpc_url: full });
  testConnection(full, rpcTokenInput.value.trim());
};

rpcHostInput.addEventListener("change", saveUrl);
rpcPortInput.addEventListener("change", saveUrl);
rpcPortInput.addEventListener("input", saveUrl);

rpcTokenInput.addEventListener("change", () => {
  const token = rpcTokenInput.value.trim();
  chrome.storage.local.set({ bili_motrix_rpc_token: token });
  testConnection(getFullRpcUrl(), token);
});

rpcDirInput.addEventListener("change", () => {
  chrome.storage.local.set({ bili_motrix_rpc_dir: rpcDirInput.value.trim() });
});

btnTest.addEventListener("click", () => {
  saveUrl();
});

loadSettings();
