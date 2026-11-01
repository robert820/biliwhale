<!--
  發布前待辦（此註解不會顯示在 GitHub 頁面上）：
  1. 確認營運者名稱與生效日期（目前為 robert820、2026-11-10；若發布日期不同請更新）。
  2. 聯絡方式為 GitHub Issues，請確認儲存庫的 Issues 保持啟用。
  3. 發布後把此檔的公開網址填入 Chrome Web Store 的 Privacy Policy 欄位。
-->

# BiliWhale 隱私權政策

**English version below / 英文版在下方：[Privacy Policy (English)](#biliwhale-privacy-policy-english)**

- **營運者：**robert820（個人開發者）
- **聯絡方式：**請透過 GitHub Issues：[https://github.com/robert820/biliwhale/issues](https://github.com/robert820/biliwhale/issues)
- **生效日期：**2026-11-10

BiliWhale 是獨立的第三方 Chrome/Chromium 擴充功能，與 Bilibili（嗶哩嗶哩）沒有隸屬關係，也未獲其官方授權。

## 1. 重點摘要

- BiliWhale **沒有開發者伺服器、使用者帳號、分析、廣告或遙測**。營運者不會收到你的瀏覽活動、媒體內容、設定或任何個人資料。
- 擴充功能只會連線到兩類對象：**Bilibili 的網域**（取得你正在使用的影片資訊與媒體），以及**你自己設定的 Aria2/Motrix RPC 服務**（預設是你電腦上的 `localhost`）。
- 你的 RPC 設定保存在你自己的瀏覽器中，**不會傳送到開發者的伺服器**。只有在你啟用 RPC 功能時，連線所需的密鑰與下載資訊才會傳送到**你自己設定的 Aria2／Motrix 服務**（見第 4 節）。
- 所有下載與匯出都由你在畫面上主動觸發。

## 2. 擴充功能會讀取哪些資料，用途是什麼

| 資料                                                                                                         | 用途                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Bilibili 頁面上的影片識別資訊（BV／av／cid）、標題、封面網址、可用的畫質與串流網址、字幕與彈幕清單、圖片網址 | 在面板中顯示可下載的項目，並下載或匯出你選擇的內容                                                                           |
| 首頁推薦卡片資料                                                                                             | 提供「推薦歷史」，讓你回到上一批推薦。**只暫存在該分頁的記憶體中，最多 50 筆，重新整理或關閉分頁就消失，不寫入任何儲存空間** |
| 你在擴充功能 Popup 輸入的 RPC 設定                                                                           | 連線到你自己的下載器（見第 4 節）                                                                                            |

**對 Bilibili 的網路請求：**你在 `bilibili.com` 頁面上使用功能時，擴充功能會向 Bilibili 的 API 與 CDN（例如 `api.bilibili.com`、`comment.bilibili.com` 與影音串流網域）取得影片資訊、串流、字幕、彈幕與封面。這些請求由瀏覽器附上你目前登入 Bilibili 的 Cookie，以取得**你的帳號本來就可以存取**的內容。擴充功能的程式碼不會讀取、複製、保存或傳送 Cookie 的內容。Bilibili 依照自己的政策處理這些請求。

## 3. 儲存在你瀏覽器裡的資料

1. **擴充功能專屬儲存區（`chrome.storage.local`）：**RPC 位址、儲存目錄、RPC 密鑰，以及舊版設定的「待確認」暫存。這些資料**只能由擴充功能的 Popup 與背景程式修改**，Bilibili 網頁上的腳本無法直接存取。RPC 密鑰是以一般文字存放在瀏覽器的擴充功能儲存區，沒有額外加密。移除擴充功能時，瀏覽器會一併清除。
2. **Bilibili 網站的本機儲存（`localStorage`）：**語言、CDN 路線與面板展開狀態。這些屬於 `bilibili.com` 的網站儲存空間，該網站的腳本技術上讀得到，內容不含敏感資料。
3. **頁面上可見的資訊：**頁面中的 BiliWhale 面板會唯讀顯示 RPC 位址與儲存目錄，這些文字 Bilibili 頁面上的腳本在技術上可能讀取到。**RPC 密鑰不會傳到網頁**，面板只顯示「已設定」或「未設定」。
4. **舊版設定遷移：**早期版本曾把 RPC 設定存在 Bilibili 頁面的 `localStorage`。這類舊值來源不可信，因此不會自動套用；新版會把它們放進「待確認」清單，由你在 Popup 按「套用」或「忽略」。

## 4. Aria2／Motrix RPC 與資料傳送

當你測試連線、查看狀態或選擇「推送至 RPC」時，擴充功能的背景程式會向**你設定的 RPC 位址**發送請求：

- **測試連線：**要求 Aria2 回報版本。
- **查看狀態：**讀取進行中的下載任務與檔案路徑，用來判斷目前影片是否正在下載。只會把「是／否」的結果交給頁面，不會把路徑交給頁面。
- **推送下載：**傳送下載網址（Bilibili 串流或圖片網址）、檔名、你在 Popup 設定的儲存目錄、`Referer`（`https://www.bilibili.com/`）與瀏覽器的 `User-Agent`，以及你設定的 RPC 密鑰。不會傳送你的 Bilibili Cookie。

請注意：

- 預設的 RPC 位址是你電腦上的 `http://localhost:16800/jsonrpc`。
- 如果你把 RPC 設成區域網路或遠端伺服器，上述內容會被送到該伺服器。若位址使用 `http://`，傳輸沒有加密。連線安全與該服務的資料處理由你自己負責。
- 之後 Aria2 會自行向 Bilibili 的 CDN 下載檔案。

「瀏覽器下載」模式的 MP4 合併完全在你的瀏覽器內以 WebAssembly 完成，FFmpeg 已隨擴充功能打包，**不使用任何外部轉檔服務，也不載入遠端程式碼**。右鍵「下載原圖片」是由瀏覽器直接向圖片網址下載。

## 5. 權限用途

- `storage`：保存你的 RPC 設定。
- `downloads`：把你主動匯出的影片、音訊、字幕、彈幕、封面與原圖存到本機。
- `contextMenus`：在 Bilibili 圖片上提供「下載原圖片」。
- 主機權限 `http://localhost:*/*`、`http://127.0.0.1:*/*`：連線你本機的 Aria2/Motrix。
- 在 `bilibili.com` 頁面注入的內容腳本：顯示 BiliWhale 面板並執行上述功能。

## 6. 資料分享

除了第 2、4 節所述「為你選擇的功能而連線到 Bilibili」以及「傳送到你自己設定的 RPC 服務」之外，BiliWhale 不會為廣告、行銷、信用評估或任何與上述功能無關的目的，出售、出租或向第三方提供你的資料。營運者沒有任何接收使用者資料的伺服器。

## 7. 保存與刪除

營運者不持有你的任何資料，所以沒有需要向營運者提出的刪除請求。你可以：

- 在 Popup 清空 RPC 位址、目錄與密鑰；
- 移除擴充功能，讓瀏覽器清除擴充功能儲存區；
- 清除 `bilibili.com` 的網站資料，以移除語言、CDN 與面板狀態偏好。

下載到你電腦的檔案由你自行管理。

## 8. 使用責任與兒童

請只下載與匯出你有權使用的內容，並遵守著作權法、Bilibili 的服務條款與內容權利人的規定。BiliWhale 不提供也不鼓勵繞過登入、付費或存取控制。本擴充功能並非針對兒童設計，也不是成人內容服務。

## 9. 政策更新

功能或資料處理方式改變時，營運者會在這個頁面更新內容與生效日期。

## 10. 聯絡

有隱私相關問題，請到 GitHub Issues 提出：[https://github.com/robert820/biliwhale/issues](https://github.com/robert820/biliwhale/issues)。請不要在公開議題中貼上你的 RPC 密鑰或其他私人資訊。

---

# BiliWhale Privacy Policy (English)

- **Operator:** robert820 (individual developer)
- **Contact:** via GitHub Issues: [https://github.com/robert820/biliwhale/issues](https://github.com/robert820/biliwhale/issues)
- **Effective date:** 2026-11-10

BiliWhale is an independent third-party Chrome/Chromium extension. It is not affiliated with, or endorsed by, Bilibili.

## 1. Summary

- BiliWhale has **no developer server, no user accounts, no analytics, no advertising and no telemetry**. The operator does not receive your browsing activity, media, settings or any personal data.
- The extension only connects to **Bilibili domains** (to get the video information and media you are using) and to **the Aria2/Motrix RPC service that you configure yourself** (by default `localhost` on your own computer).
- Your RPC settings are stored in your own browser and are **never sent to the developer's servers**. Only when you use the RPC feature are the secret and download information needed for the connection sent to **the Aria2/Motrix service you configured yourself** (see section 4).
- Every download or export is started by your own action in the interface.

## 2. Data the extension reads, and why

| Data                                                                                                                                             | Purpose                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Video identifiers (BV/av/cid), title, cover URL, available quality and stream URLs, subtitle and danmaku lists, and image URLs on Bilibili pages | Show downloadable items in the panel and download or export what you choose                                                                                                                               |
| Home-page recommendation cards                                                                                                                   | Provide "recommendation history" so you can go back to a previous batch. **Kept only in that tab's memory, at most 50 entries, discarded on reload or when the tab closes, and never written to storage** |
| RPC settings you enter in the extension popup                                                                                                    | Connect to your own downloader (see section 4)                                                                                                                                                            |

**Network requests to Bilibili:** when you use a feature on a `bilibili.com` page, the extension requests video information, streams, subtitles, danmaku and covers from Bilibili's APIs and CDNs (for example `api.bilibili.com`, `comment.bilibili.com` and media-stream domains). The browser attaches your current Bilibili login cookies to these requests so that you receive content **your account can already access**. The extension's code does not read, copy, store or transmit cookie values. Bilibili handles those requests under its own policies.

## 3. Data stored in your browser

1. **Extension storage (`chrome.storage.local`):** the RPC address, the save directory, the RPC secret, and a "pending" list of legacy settings. This data can **only be changed by the extension's popup and background worker**; scripts on the Bilibili page cannot access it directly. The RPC secret is stored as plain text in the browser's extension storage (no extra encryption). The browser removes it when you uninstall the extension.
2. **Bilibili site storage (`localStorage`):** language, CDN route and panel-expanded state. This is storage for `bilibili.com`, so that site's scripts can technically read it. It contains no sensitive data.
3. **Information visible on the page:** the BiliWhale panel on the page shows the RPC address and save directory read-only, and scripts on the Bilibili page could technically read that text. **The RPC secret is never sent to the page**; the panel only shows "set" or "not set".
4. **Legacy settings migration:** earlier versions kept RPC settings in the Bilibili page's `localStorage`. That source is untrusted, so those values are never applied automatically; the extension puts them in a "pending" list and you choose "Apply" or "Ignore" in the popup.

## 4. Aria2/Motrix RPC and what is sent

When you test the connection, check status, or choose "Push to RPC", the extension's background worker sends requests to **the RPC address you configured**:

- **Test connection:** asks Aria2 for its version.
- **Check status:** reads the active download tasks and their file paths to decide whether the current video is already downloading. Only a yes/no result is given to the page; file paths are not.
- **Push a download:** sends the download URL (a Bilibili stream or image URL), a file name, the save directory you set in the popup, a `Referer` (`https://www.bilibili.com/`), the browser's `User-Agent`, and your RPC secret. Your Bilibili cookies are not sent.

Please note:

- The default RPC address is `http://localhost:16800/jsonrpc` on your own computer.
- If you set the RPC address to a LAN or remote server, the data above is sent to that server. If the address uses `http://`, the transmission is not encrypted. You are responsible for that connection and for how that service handles data.
- Aria2 then downloads the files from Bilibili's CDN by itself.

In "browser download" mode, MP4 merging runs entirely inside your browser with WebAssembly. FFmpeg is bundled with the extension, so **no external conversion service is used and no remote code is loaded**. The right-click "Download original image" action downloads directly from the image URL through the browser.

## 5. Permissions

- `storage`: save your RPC settings.
- `downloads`: save the videos, audio, subtitles, danmaku, covers and images you choose to export.
- `contextMenus`: offer "Download original image" on Bilibili images.
- Host permissions `http://localhost:*/*` and `http://127.0.0.1:*/*`: connect to Aria2/Motrix on your computer.
- Content script on `bilibili.com`: show the BiliWhale panel and run the features above.

## 6. Sharing

Other than connecting to Bilibili for the features you choose (sections 2 and 4) and sending data to the RPC service you configured yourself, BiliWhale does not sell, rent or provide your data to any third party, and does not use it for advertising, marketing, credit assessment or any purpose unrelated to those features. The operator runs no server that receives user data.

## 7. Retention and deletion

The operator holds none of your data, so there is nothing to request from the operator for deletion. You can:

- clear the RPC address, directory and secret in the popup;
- uninstall the extension so the browser clears its extension storage;
- clear site data for `bilibili.com` to remove language, CDN and panel-state preferences.

Files downloaded to your computer are yours to manage.

## 8. Your responsibility; children

Download and export only content you are entitled to use, and follow copyright law, Bilibili's terms of service, and the rights holders' rules. BiliWhale does not provide or encourage bypassing login, payment or access controls. The extension is not designed for children and is not an adult-content service.

## 9. Changes

If features or data handling change, the operator will update this page and its effective date.

## 10. Contact

For privacy questions, please open an issue at [https://github.com/robert820/biliwhale/issues](https://github.com/robert820/biliwhale/issues). Do not post your RPC secret or other private information in a public issue.
