# <img src="assets/icon128.png" width="36" height="36" style="vertical-align: -6px;" alt="BiliWhale" /> BiliWhale

BiliWhale 是一款适用于 Chrome、Edge 等 Chromium 浏览器的 Bilibili 扩展，提供视频和音频下载、字幕与弹幕导出、播放器截图、原图下载，以及首页推荐历史浏览。

**语言：[繁體中文](README.md)｜简体中文（本页）｜[English](README.en.md)**

## 功能

- **视频与音频下载：**选择可用画质，通过浏览器下载合并后的 MP4，或将音频与视频任务推送至 Aria2 兼容的 RPC 下载器（例如 Aria2、Motrix）。
- **字幕导出：**将可用字幕下载为 SRT、ASS、JSON 或 TXT。
- **弹幕导出：**下载 XML 弹幕，或转换为兼容桌面播放器的 ASS 格式。
- **视频截图：**从 HTML5 播放器截取视频画面。
- **B 站原图：**在 Bilibili 页面中的图片上右键，选择“下载原图片”。直接打开的图片 CDN 页面不会显示此菜单项；浏览器自带的“在新标签页中打开图片”也会移除受支持图片的 CDN 缩略图转换参数。
- **首页推荐上一页／下一页：**在首页“换一换”下方加入前进和后退控制，保留可用的初始推荐和换页记录。返回较早推荐后再次点击“换一换”，会从当前位置建立新的历史分支。
- **封面下载：**下载视频封面、专栏封面及支持的动态图片原图。
- **RPC 设置：**在扩展界面中设置 Aria2 RPC 地址和可选密钥。

推荐历史功能依赖 Bilibili 首页的前端状态和推荐界面；网站改版可能影响兼容性。

## 系统要求

- 支持 Manifest V3 扩展的 Chrome、Edge 或其他 Chromium 浏览器。
- 使用 RPC 下载时，需要先启动 Aria2 兼容服务并启用 JSON-RPC 接口；浏览器下载不需要 RPC。
- 可下载的视频和媒体格式可能因账号、地区、视频及 Bilibili 服务端变化而异。
- 浏览器合并视频时会使用内存处理媒体数据；大型视频建议使用 RPC 下载。

## 从源代码安装

1. 下载并解压此项目，或使用 Git 克隆项目。
2. 在 Chrome 中打开 `chrome://extensions`，或在 Edge 中打开 `edge://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择包含 `manifest.json` 的项目文件夹。
5. 打开支持的 Bilibili 页面即可使用相应功能。

## 许可证与致谢

BiliWhale 基于 [MIT License](LICENSE) 发布。感谢本项目参考的开源项目及其作者；完整来源、参考范围和许可证信息统一列于[第三方许可证声明](THIRD-PARTY-NOTICES.md)。
