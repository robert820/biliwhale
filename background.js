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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROXY_FETCH") {
    const { url, options } = message;
    fetch(url, options)
      .then(async (res) => {
        const text = await res.text();
        sendResponse({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          text: text
        });
      })
      .catch((err) => {
        sendResponse({
          ok: false,
          error: err.message
        });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === "DOWNLOAD_URL") {
    const { url, filename } = message;
    const safeFilename = (filename || "download").replace(/[\/:*?"<>|]/g, "_");
    chrome.downloads.download({
      url: url,
      filename: safeFilename,
      saveAs: false
    }, (downloadId) => {
      const err = chrome.runtime.lastError;
      sendResponse({
        ok: !err && !!downloadId,
        downloadId: downloadId,
        error: err ? err.message : null
      });
    });
    return true;
  }
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
