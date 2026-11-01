# <img src="assets/icon128.png" width="36" height="36" style="vertical-align: -6px;" alt="BiliWhale" /> BiliWhale

BiliWhale is a Bilibili extension for Chrome, Edge, and other Chromium browsers. It provides video and audio downloads, subtitle and danmaku exports, player screenshots, original image downloads, and recommendation history navigation on the homepage.

**Languages: [繁體中文](README.md)｜[简体中文](README.zh-CN.md)｜English (this page)**

## Features

- **Video and audio downloads:** choose an available quality and download a muxed MP4 in the browser, or send separate audio and video tasks to an Aria2-compatible RPC client such as Aria2 or Motrix.
- **Subtitle export:** download available subtitles as SRT, ASS, JSON, or TXT.
- **Danmaku export:** download XML danmaku or convert it to ASS for compatible desktop media players.
- **Video screenshots:** capture a frame from the HTML5 player.
- **Original Bilibili images:** right-click an image on a Bilibili page and select “Download Original Image.” This menu item is hidden on direct image CDN pages. The browser’s native “Open image in new tab” action also removes supported CDN thumbnail transformation parameters.
- **Homepage recommendation history:** use Previous and Next controls below the homepage “换一换” button to revisit recommendation results. If you return to an earlier result and roll again, a new history branch starts from the current position.
- **Cover downloads:** save video covers, column covers, and supported original dynamic images.
- **RPC settings:** configure the Aria2 RPC endpoint and optional secret in the extension interface.

Recommendation history relies on Bilibili’s homepage state and interface, so site changes may affect compatibility.

## Requirements

- Chrome, Edge, or another Chromium-based browser that supports Manifest V3 extensions.
- For RPC downloads, start an Aria2-compatible service and enable its JSON-RPC interface. Browser downloads do not require RPC.
- Video and media availability may vary by account, region, video, and changes to Bilibili’s service.
- Browser MP4 muxing processes media in memory; use RPC for large videos.

## Install from source

1. Download and extract this project, or clone it with Git.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the project folder containing `manifest.json`.
5. Open a supported Bilibili page to use the available features.

## License and acknowledgements

BiliWhale is released under the [MIT License](LICENSE). Thanks to the open-source projects and authors referenced by this project. Their sources, areas of reference, and license information are listed together in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
