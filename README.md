# <img src="assets/icon128.png" width="36" height="36" style="vertical-align: -6px;" alt="BiliWhale" /> BiliWhale

BiliWhale 是一款適用於 Chrome、Edge 等 Chromium 瀏覽器的 Bilibili 擴充功能，提供影片與音訊下載、字幕與彈幕匯出、播放器截圖、原圖下載，以及首頁推薦歷史瀏覽。

**語言：繁體中文（本頁）｜[简体中文](README.zh-CN.md)｜[English](README.en.md)**

## 功能

- **影片與音訊下載：**選擇可用畫質，以瀏覽器下載合併後的 MP4，或將音訊與視訊工作推送至 Aria2 相容的 RPC 下載器（例如 Aria2、Motrix）。
- **字幕匯出：**下載可用字幕為 SRT、ASS、JSON 或 TXT。
- **彈幕匯出：**下載 XML 彈幕，或轉換為相容桌面播放器的 ASS 格式。
- **影片截圖：**從 HTML5 播放器擷取影片畫格。
- **B 站原圖：**在 Bilibili 頁面中的圖片按右鍵，選擇「下載原圖片」。此選項不會出現在直接開啟的圖片 CDN 網址；瀏覽器內建的「在新分頁開啟圖片」也會移除支援圖片的 CDN 縮圖轉換參數。
- **首頁推薦上一頁／下一頁：**在首頁「換一換」下方加入前進與後退控制，保留可用的初始推薦與換頁紀錄。返回較早推薦後再次按「換一換」，會從目前位置建立新的歷史分支。
- **封面下載：**下載影片封面、專欄封面及支援的動態圖片原圖。
- **RPC 設定：**在擴充功能介面設定 Aria2 RPC 位址與選填密鑰。

推薦歷史功能依賴 Bilibili 首頁的前端狀態與推薦介面，網站改版可能影響相容性。

## 系統需求

- 支援 Manifest V3 擴充功能的 Chrome、Edge 或其他 Chromium 瀏覽器。
- 使用 RPC 下載時，需先啟動 Aria2 相容服務並開啟 JSON-RPC 介面；瀏覽器下載不需要 RPC。
- 可下載的影片與媒體格式會因帳號、地區、影片及 Bilibili 服務端變更而異。
- 瀏覽器合併影片會使用記憶體處理媒體資料；大型影片建議使用 RPC 下載。

## 從原始碼安裝

1. 下載並解壓縮此專案，或使用 Git 複製專案。
2. 在 Chrome 開啟 `chrome://extensions`，或在 Edge 開啟 `edge://extensions`。
3. 開啟「開發人員模式」。
4. 點選「載入未封裝項目」，選取包含 `manifest.json` 的專案資料夾。
5. 開啟支援的 Bilibili 頁面即可使用相應功能。

## 授權與致謝

BiliWhale 以 [MIT License](LICENSE) 發布。感謝本專案參考的開源專案及其作者；完整來源、參考範圍與授權資訊統一列於 [第三方授權聲明](THIRD-PARTY-NOTICES.md)。
