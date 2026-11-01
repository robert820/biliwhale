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

  // Privileged Proxy Bridge: Bypasses Mixed Content (HTTPS -> HTTP) and Private Network Access
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === "BILI_EXT_PROXY_FETCH") {
      const { requestId, url, options } = event.data;
      try {
        chrome.runtime.sendMessage({
          type: "PROXY_FETCH",
          url,
          options
        }, (response) => {
          window.postMessage({
            type: "BILI_EXT_PROXY_RESPONSE",
            requestId,
            response: response || { ok: false, error: chrome.runtime.lastError?.message || "無法與後台通訊" }
          }, "*");
        });
      } catch (err) {
        window.postMessage({
          type: "BILI_EXT_PROXY_RESPONSE",
          requestId,
          response: { ok: false, error: err.message }
        }, "*");
      }
    }
    if (event.data.type === "BILI_EXT_DOWNLOAD_URL") {
      const { requestId, url, filename } = event.data;
      try {
        chrome.runtime.sendMessage({
          type: "DOWNLOAD_URL",
          url,
          filename
        }, (response) => {
          const err = chrome.runtime.lastError;
          window.postMessage({
            type: "BILI_EXT_DOWNLOAD_RESPONSE",
            requestId,
            response: response || { ok: !err, error: err?.message }
          }, "*");
        });
      } catch (err) {
        window.postMessage({
          type: "BILI_EXT_DOWNLOAD_RESPONSE",
          requestId,
          response: { ok: false, error: err.message }
        }, "*");
      }
    }

  });

})(window);
