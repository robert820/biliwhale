// Background Service Worker (Manifest V3)
// Privileged network & native downloads proxy

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
