# BiliWhale

BiliWhale 是一款適用於 Chrome、Edge 等 Chromium 瀏覽器的 **Bilibili 影片下載擴充功能**。可使用瀏覽器內建的 WebAssembly FFmpeg 合併音訊與視訊為 MP4，或透過 **Aria2 / Motrix RPC** 推送雙軌下載任務；也支援字幕、彈幕、影片截圖與封面下載。

**語言：繁體中文（本頁）｜[简体中文](README.zh-CN.md)｜[English](README.en.md)**

## 功能特色

- **影片與音訊下載：**選擇可用畫質，以瀏覽器下載或推送分離的音訊、視訊任務至 Aria2 相容的 RPC 下載器（如 Aria2、Motrix）。
- **MP4 合併：**使用隨附的 WebAssembly FFmpeg 封裝音訊與視訊，不重新編碼。瀏覽器模式會將媒體資料存放於記憶體，大型影片建議使用 RPC。
- **字幕匯出：**將影片提供的字幕下載為 SRT、ASS、JSON 或 TXT。
- **彈幕匯出：**下載 XML 彈幕，或轉換成可用於相容桌面播放器的 ASS 格式。
- **影片畫格截圖：**從 HTML5 播放器擷取原生影片解析度的畫格。
- **封面下載：**下載影片封面、專欄封面及支援的動態原圖。
- **RPC 設定：**在擴充功能介面設定 Aria2 RPC 位址與選填密鑰。

## 系統需求

- 支援 Manifest V3 擴充功能的 Chrome、Edge 或其他 Chromium 瀏覽器。
- 使用 RPC 下載時，需先啟動 Aria2 相容服務並開啟 JSON-RPC 介面；瀏覽器下載不需要 RPC 服務。
- 可下載的影片與媒體格式會因帳號、地區、影片及 Bilibili 服務端變更而異。

## 從原始碼安裝

1. 下載並解壓縮此專案，或使用 Git 複製專案。
2. 在 Chrome 開啟 `chrome://extensions`，或在 Edge 開啟 `edge://extensions`。
3. 開啟「開發人員模式」。
4. 點選「載入未封裝項目」，選取包含 `manifest.json` 的專案資料夾。
5. 開啟支援的 Bilibili 影片頁面，即可使用 BiliWhale 控制介面。

## 大型影片下載建議

瀏覽器模式會先將音訊與視訊串流載入記憶體，再合併為 MP4；影片越大，記憶體用量越高，長影片可能造成瀏覽器記憶體不足。長時間錄影、高畫質或大型影片建議改用 Aria2 / Motrix RPC 下載。

## 授權

BiliWhale 以 [MIT License](LICENSE) 發布。第三方元件、參考專案與相關授權聲明請見 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

## 致謝

本專案參考並致謝 [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)、[bilibili-helper](https://csser.top/)、[yt-dlp](https://github.com/yt-dlp/yt-dlp)、[Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved)、[us-danmaku](https://github.com/tiansh/us-danmaku) 與 [Bilibili-thread-ripper](https://github.com/MrTangLuyao/Bilibili-thread-ripper)。細節請見 [第三方授權聲明](THIRD-PARTY-NOTICES.md)。
