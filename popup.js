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
    tokenPlaceholder: "選填 (無密碼留空)"
  },
  "zh-CN": {
    connected: (ver) => `Aria2 已连接 (v${ver})`,
    disconnected: "RPC 尚未启动 (仍可使用浏览器下载)",
    checking: "检测中...",
    endpoint: "RPC 接口 (独立端口输入)",
    dir: "保存目录",
    dirPlaceholder: "默认 C:\\Downloads\\Video",
    token: "RPC 密钥",
    tokenPlaceholder: "选填 (无密码留空)"
  },
  "en": {
    connected: (ver) => `Aria2 Connected (v${ver})`,
    disconnected: "RPC not started (Browser download available)",
    checking: "Checking...",
    endpoint: "RPC Endpoint (Separate port input)",
    dir: "Save Directory",
    dirPlaceholder: "Default C:\\Downloads\\Video",
    token: "RPC Secret",
    tokenPlaceholder: "Optional (token)"
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

// Load stored settings
const loadSettings = () => {
  const fullUrl = localStorage.getItem("bili_motrix_rpc_url") || "http://localhost:16800/jsonrpc";
  const token = localStorage.getItem("bili_motrix_rpc_token") || "";
  const dir = localStorage.getItem("bili_motrix_rpc_dir") || "C:\\Downloads\\Video";

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

  testConnection(fullUrl, token);
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
  localStorage.setItem("bili_motrix_rpc_url", full);
  testConnection(full, rpcTokenInput.value.trim());
};

rpcHostInput.addEventListener("change", saveUrl);
rpcPortInput.addEventListener("change", saveUrl);
rpcPortInput.addEventListener("input", saveUrl);

rpcTokenInput.addEventListener("change", () => {
  localStorage.setItem("bili_motrix_rpc_token", rpcTokenInput.value.trim());
  testConnection(getFullRpcUrl(), rpcTokenInput.value.trim());
});

rpcDirInput.addEventListener("change", () => {
  localStorage.setItem("bili_motrix_rpc_dir", rpcDirInput.value.trim());
});

btnTest.addEventListener("click", () => {
  saveUrl();
});

loadSettings();
