# BiliWhale

BiliWhale is a **Bilibili video downloader extension for Chrome, Edge, and other Chromium browsers**. Merge downloaded audio and video into MP4 with the bundled WebAssembly FFmpeg build, or send dual-track tasks to **Aria2 / Motrix** over RPC. It also exports subtitles and danmaku, captures video frames, and downloads covers.

**Languages: [繁體中文](README.md)｜[简体中文](README.zh-CN.md)｜English (this page)**

## Features

- **Video and audio downloads:** choose an available quality and download in the browser, or push separate audio and video tasks to an Aria2-compatible RPC client such as Aria2 or Motrix.
- **MP4 muxing:** combine audio and video with the bundled WebAssembly FFmpeg build without re-encoding. Browser mode stores media data in memory; use RPC for large videos.
- **Subtitle export:** download available subtitles as SRT, ASS, JSON, or TXT.
- **Danmaku export:** download XML danmaku or convert it to ASS for compatible desktop media players.
- **Video frame capture:** capture a frame from the HTML5 player at the video's native resolution.
- **Cover downloads:** save video covers, column covers, and supported original dynamic images.
- **RPC settings:** configure the Aria2 RPC endpoint and optional secret in the extension interface.

## Requirements

- Chrome, Edge, or another Chromium-based browser that supports Manifest V3 extensions.
- For RPC downloads, start an Aria2-compatible service and enable its JSON-RPC interface. Browser downloads do not require an RPC service.
- Video and media availability may vary by account, region, video, and changes to Bilibili's service.

## Install from source

1. Download and extract this project, or clone it with Git.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the project folder containing `manifest.json`.
5. Open a supported Bilibili video page to use the BiliWhale controls.

## Large-file guidance

Browser mode loads the audio and video streams into memory before muxing them into MP4. Larger videos require more memory, and long videos may exceed the browser's available memory. Use Aria2 / Motrix RPC for long recordings, high-resolution videos, or other large files.

## License

BiliWhale is released under the [MIT License](LICENSE). See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for third-party components, referenced projects, and their license notices.

## Acknowledgements

This project references and acknowledges [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm), [bilibili-helper](https://csser.top/), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved), [us-danmaku](https://github.com/tiansh/us-danmaku), and [Bilibili-thread-ripper](https://github.com/MrTangLuyao/Bilibili-thread-ripper). See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for details.
