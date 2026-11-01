# BiliWhale

BiliWhale 是一款适用于 Chrome、Edge 等 Chromium 浏览器的 **Bilibili 视频下载扩展**。可使用浏览器内置的 WebAssembly FFmpeg 将音频与视频合并为 MP4，或通过 **Aria2 / Motrix RPC** 推送双轨下载任务；也支持字幕、弹幕、视频截图和封面下载。

**语言： [繁體中文](README.md)｜简体中文（本页）｜[English](README.en.md)**

## 功能特色

- **视频与音频下载：**选择可用画质，通过浏览器下载，或将分离的音频、视频任务推送到 Aria2 兼容的 RPC 下载器（如 Aria2、Motrix）。
- **MP4 合并：**使用随附的 WebAssembly FFmpeg 封装音频与视频，不重新编码。浏览器模式会将媒体数据存放在内存中，大型视频建议使用 RPC。
- **字幕导出：**将视频提供的字幕下载为 SRT、ASS、JSON 或 TXT。
- **弹幕导出：**下载 XML 弹幕，或转换为可用于兼容桌面播放器的 ASS 格式。
- **视频帧截图：**从 HTML5 播放器截取原生视频分辨率的画面。
- **封面下载：**下载视频封面、专栏封面及支持的动态原图。
- **RPC 设置：**在扩展界面中设置 Aria2 RPC 地址和可选密钥。

## 系统要求

- 支持 Manifest V3 扩展的 Chrome、Edge 或其他 Chromium 浏览器。
- 使用 RPC 下载时，需要先启动 Aria2 兼容服务并启用 JSON-RPC 接口；浏览器下载不需要 RPC 服务。
- 可下载的视频和媒体格式可能因账号、地区、视频及 Bilibili 服务端变化而异。

## 从源代码安装

1. 下载并解压此项目，或使用 Git 克隆项目。
2. 在 Chrome 中打开 `chrome://extensions`，或在 Edge 中打开 `edge://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择包含 `manifest.json` 的项目文件夹。
5. 打开支持的 Bilibili 视频页面，即可使用 BiliWhale 控制界面。

## 大型视频下载建议

浏览器模式会先将音频和视频流载入内存，再合并为 MP4；视频越大，内存占用越高，长视频可能导致浏览器内存不足。长时间录制、高画质或大型视频建议改用 Aria2 / Motrix RPC 下载。

## 许可证

BiliWhale 基于 [MIT License](LICENSE) 发布。第三方组件、参考项目及相关许可证声明请见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

## 致谢

本项目参考并感谢 [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)、[bilibili-helper](https://csser.top/)、[yt-dlp](https://github.com/yt-dlp/yt-dlp)、[Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved)、[us-danmaku](https://github.com/tiansh/us-danmaku) 和 [Bilibili-thread-ripper](https://github.com/MrTangLuyao/Bilibili-thread-ripper)。详情请见 [第三方许可证声明](THIRD-PARTY-NOTICES.md)。
