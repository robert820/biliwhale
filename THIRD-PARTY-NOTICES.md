# 第三方開源授權聲明 (Third-Party Open Source Notices)

本專案所包含或參考之開源模組與依賴授權條款說明如下：

---

### 1. @ffmpeg/core & ffmpeg.wasm
- **原始作者 / 來源**：FFmpeg 開源社群 & Jerome Wu (@ffmpeg/ffmpeg)
- **專案連結**：https://github.com/ffmpegwasm/ffmpeg.wasm
- **授權條款 (License)**：LGPL 2.1 (Lesser General Public License v2.1) / MIT
- **引用範疇**：
  - `ffmpeg-core.js`, `ffmpeg-core.wasm`, `ffmpeg-core.worker.js`, `ffmpeg.worker.js`
  - 用於瀏覽器記憶體端快速混流：執行 `-i video.mp4 -i audio.mp4 -vcodec copy -acodec copy output.mp4`。
- **合規處理 (Compliance)**：
  - LGPL 2.1 規範動態鏈接（Dynamic Linking）：本專案透過 Web Worker 動態載入未經修改的原生 `ffmpeg-core.wasm` 二進位模組，未修改 FFmpeg 內部 C/WebAssembly 原始碼，完全符合 LGPL 第 6 條「允許第三方應用以模組化方式調用」的合規要求。
  - 完整原始碼與專案詳見：https://github.com/ffmpegwasm/ffmpeg.wasm 與 https://ffmpeg.org

---

### 2. bilibili-helper (B站下載助手)
- **原始作者 / 來源**：indooorsman (v3.0.4 CRX 發布版)
- **官方來源連結**：https://csser.top/
- **授權條款 (License)**：MIT License
- **引用範疇**：
  - Web Accessible Resources 與內容腳本隔離通訊架構。
  - WebAssembly FFmpeg Worker 早期整合與記憶體混流思路。
- **合規處理 (Compliance)**：
  - 遵循 MIT 授權條款，本專案重構並升級其串流解析核心。

---

### 3. yt-dlp 社群 (Bilibili Extractor & Issue #17847)
- **原始作者 / 來源**：yt-dlp 開源社群
- **專案連結**：https://github.com/yt-dlp/yt-dlp/issues/17847
- **授權條款 (License)**：The Unlicense (Public Domain)
- **借鑒範疇**：
  - B站騰訊雲海外 CDN 節點（`upos-sz-mirrorcosov.bilivideo.com`）近期 WAF 安全策略防護機制研究。
  - 透過在媒體流請求中加入 `Range: bytes=0-` 標頭以避開 HTTP 567（Restricted Access）攔截。
  - 多鏡像節點權重排序策略與自動容錯切換（Failover）機制。
- **合規處理 (Compliance)**：
  - 遵循 The Unlicense 規範自由整合，於專案文檔與致謝清單中載明技術來源。

---

### 4. Bilibili-Evolved (哔哩哔哩进化版)
- **原始作者 / 來源**：the1812/Bilibili-Evolved
- **專案連結**：https://github.com/the1812/Bilibili-Evolved
- **授權條款 (License)**：MIT License
- **借鑒範疇**：
  - Aria2 RPC 標頭配置與相容性規範（`Referer: https://www.bilibili.com/` 規範化、真實 `User-Agent` 注入）。
  - 傳遞 `"remote-time": "false"` 參數，強制 Aria2 忽略遠端伺服器歷史 `Last-Modified` 時間戳，使檔案「修改日期」維持為本機當下時間。
- **合規處理 (Compliance)**：
  - 遵循 MIT 授權條款，致謝作者與專案。

---

### 5. BiliASS (Bilibili Danmaku to ASS Converter)
- **原始作者 / 來源**：tiansh (BiliASS 開源演算法)
- **專案連結**：https://github.com/tiansh/us-danmaku
- **授權條款 (License)**：MIT License / Apache 2.0
- **引用範疇**：
  - Bilibili XML 彈幕標籤解析、彈幕滾動/頂端/底端定位計算與字型樣式轉換。
- **合規處理 (Compliance)**：
  - 遵循 MIT 授權條款，獨立封裝於 `danmaku_engine.js`，保留演算法致謝註釋。

---

### 6. Bilibili-thread-ripper (B站線程撕裂者)
- **原始作者 / 來源**：MrTangLuyao
- **專案連結**：https://github.com/MrTangLuyao/Bilibili-thread-ripper
- **授權條款 (License)**：MIT License
- **借鑒範疇**：
  - B站 UPOS 多雲節點換 Host 鑑權簽名互通架構研究。
  - 大陸與海外節點分層調度與容錯思路。
- **合規處理 (Compliance)**：
  - 遵循 MIT 授權條款，本專案自主撰寫下載器之多雲 UPOS 合成與本機微探測排程器，並於致謝中載明靈感來源。
