/**
 * BiliBili Ultimate Downloader (哔哩哔哩 视频/音频/弹幕/字幕/封面/截图/动态原图助手)
 *
 * Comprehensive Features:
 * 1. BiliASS Engine: Converts Bilibili XML Danmaku into high-quality ASS subtitles (PotPlayer / VLC / mpv compatible) + raw XML download
 * 2. ACGHelper 4-Format Subtitle Downloader: Chinese SRT / ASS / JSON / TXT
 * 3. ACGHelper High-Res Video Frame Screenshot: Native resolution, absolutely NO pause/play icon overlays or web controls
 * 4. Cover Downloader: Video Cover + BILIBILIA Column/Article Cover (uncompressed original)
 * 5. Dynamic / Opus Feed Original Image Downloader: True raw PNG/JPG from Bilibili CDN, NOT lossy canvas conversion!
 * 6. Left: DeepSeek anime maid (wide, sharp on left, smoothly fading to right with genuine alpha transparency)
 * 7. Center: Stream specs & file sizes stacked vertically + Dropdown menu + Subtitles pills
 * 8. Right: Compact download buttons (推送到 RPC & 浏览器下载)
 * 9. Neutral RPC target & Default save directory C:\Downloads\Video
 * 10. Automatic i18n detection: zh-TW / zh-CN / en
 */


// Intercept player internal authenticated playurl response
try {
  const OrigXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class extends OrigXHR {
    constructor() {
      super();
      this.addEventListener("load", () => {
        try {
          if (this.responseURL && this.responseURL.includes("/playurl")) {
            const json = JSON.parse(this.responseText);
            const playData = json.result ? (json.result.video_info || json.result) : json.data;
            if (playData && (playData.dash || playData.durl)) {
              window.__BILI_INTERCEPTED_PLAYURL__ = playData;
              if (window.__BILI_APP_INSTANCE__) {
                window.__BILI_APP_INSTANCE__.updateFromPlayData(playData);
              }
            }
          }
        } catch (e) {}
      }, { capture: true, passive: true });
    }
  };
} catch (e) {}

const HOST_ID = "bili-motrix-host";
const SCRIPT_ID = "bili-motrix-ext-content-script";

// Multilingual Dictionary (i18n)
const I18N = {
  "zh-TW": {
    appBtn: "BiliWhale",
    qualityParsing: "解析中...",
    qualityWait: "正在準備視訊數據...",
    downloadTarget: "下載目標：",
    dualTrack: "🎬 視訊 + 音訊 (完整雙軌)",
    videoOnly: "📹 僅視訊軌 (純畫面)",
    audioOnly: "🎵 僅音訊軌 (提取音樂/M4A)",
    autoBest: "自動選擇最高畫質",
    videoTrack: "視訊軌",
    audioTrack: "音訊軌",
    noAudio: "無獨立音訊流 (已內嵌)",
    totalSize: "預估下載總大小：",
    calculating: "計算中...",
    btnRpc: "推送至 RPC (雙軌)",
    btnBrowser: "瀏覽器下載 (合併 MP4)",
    coverTrack: "影片封面",
    coverOnly: "🖼️ 僅影片封面 (無壓縮原圖)",
    btnDownloadCover: "下載封面",
    rpcConnected: (ver) => `Aria2 RPC 已連線 (v${ver})`,
    rpcDisconnected: "RPC 尚未啟動 (仍可使用瀏覽器下載)",
    rpcSettings: "⚙️ RPC 設定",
    collapse: "收起 ▼",
    rpcEndpoint: "推送介面：",
    saveDir: "儲存目錄：",
    rpcSecret: "RPC 密鑰：",
    tokenPlaceholder: "選填 (無密碼留空)",
    saveDirPlaceholder: "預設 C:\\Users\\{使用者}\\Downloads\\Video",
    btnRpcDone: "已推送至 RPC",
    btnBrowserDone: "已完成下載",
    toastAlreadyPushed: "⚠️ 此任務已推送至下載器，請勿重複觸發！",
    toastAlreadyDownloaded: "⚠️ 此任務已在瀏覽器下載中或已完成！",
    testConn: "測試連線",
    copyAria2: "複製 Aria2c 命令",
    copyLink: "複製下載直鏈",
    screenshotBtn: "影片幀截圖",
    coverBtn: "影片封面",
    articleCoverBtn: "專欄封面",
    frameTrack: "影片幀截圖",
    btnCaptureFrame: "截取影格",
    danmakuTitle: "彈幕下載",
    danmakuBtnAss: "下載 ASS 彈幕",
    danmakuBtnXml: "下載 XML 彈幕",
    danmakuAssBtn: "下載 ASS 彈幕",
    danmakuXmlBtn: "下載 XML 彈幕",
    screenshotSuffix: "截圖",
    subTitle: "字幕下載",
    subLoading: "正在載入字幕列表中...",
    subSelectPrompt: "請選擇字幕語言",
    noSubtitle: "本影片無可用字幕",
    subAiTag: "AI 自動生成",
    subBtnSrt: "下載 SRT",
    subBtnAss: "下載 ASS",
    subBtnJson: "下載 JSON",
    subBtnTxt: "下載 TXT",
    subUpTag: "UP主提供",
    dynDownloadPng: "⬇️ 下載原圖 (PNG)",
    langOption: "介面語言：",
    toastBrowserStart: "正在啟動瀏覽器下載...",
    toastBrowserDone: "✅ 瀏覽器下載已發起！",
    toastBrowserFail: (err) => `❌ 下載失敗: ${err}`,
    toastPushDual: "🚀 正在推送雙軌下載任務至 RPC...",
    toastPushVideo: "🚀 正在推送視訊軌任務至 RPC...",
    toastPushAudio: "🚀 正在推送音訊軌任務至 RPC...",
    toastPushFail: (err) => `❌ 推送失敗: ${err}`,
    toastCopyCmd: "📋 Aria2 下載命令已複製到剪貼簿！",
    toastCopyLink: (type) => `已複製${type || ""}下載直鏈！`,
    toastMerging: "⚙️ 正在使用 WebAssembly 快速無損合成 MP4...",
    toastMergeDone: "🎉 完整 MP4 合成完成，已開始下載！",
    toastSubDone: (fmt, lang) => `✅ ${lang || ""} ${fmt} 字幕下載完成！`,
    toastDanmakuDone: (fmt) => `✅ ${fmt} 彈幕下載完成！`,
    toastScreenshotDone: (res) => `📸 截圖成功！原生解析度: ${res}`,
    toastCoverDone: "🖼️ 高畫質封面下載完成！",
    browserDlWarningHeader: "⚠️ 瀏覽器下載限制提醒",
    browserDlWarningText: "瀏覽器下載需在記憶體中快取與合成，超過 2GB 的長影片容易因記憶體溢出 (OOM) 導致分頁崩潰。",
    cdnModeLabel: "CDN 路線：",
    cdnAuto: "🌐 智慧探測優選 (自動測速容錯，推薦)",
    cdnOverseas: "🌏 海外優先 (Akamai / 阿里海外，台港美澳)",
    cdnMainland: "🇨🇳 大陸直連 (阿里雲 / 華為雲核心節點)"
  },
  "zh-CN": {
    appBtn: "BiliWhale",
    qualityParsing: "解析中...",
    qualityWait: "正在准备视频数据...",
    downloadTarget: "下载目标：",
    dualTrack: "🎬 视频 + 音频 (完整双轨)",
    videoOnly: "📹 仅视频轨 (纯画面)",
    audioOnly: "🎵 仅音频轨 (提取音乐/M4A)",
    autoBest: "自动选择最高画质",
    videoTrack: "视频轨",
    audioTrack: "音频轨",
    noAudio: "无独立音频流 (已内嵌)",
    totalSize: "预估下载总大小：",
    calculating: "计算中...",
    btnRpc: "推送至 RPC (双轨)",
    btnBrowser: "浏览器下载 (合并 MP4)",
    coverTrack: "视频封面",
    coverOnly: "🖼️ 仅视频封面 (无压缩原图)",
    btnDownloadCover: "下载封面",
    rpcConnected: (ver) => `Aria2 RPC 已连接 (v${ver})`,
    rpcDisconnected: "RPC 尚未启动 (仍可使用浏览器下载)",
    rpcSettings: "⚙️ RPC 设置",
    collapse: "收起 ▼",
    rpcEndpoint: "推送接口：",
    saveDir: "保存目录：",
    rpcSecret: "RPC 密钥：",
    tokenPlaceholder: "选填 (无密码留空)",
    saveDirPlaceholder: "默认 C:\\Users\\{用户}\\Downloads\\Video",
    btnRpcDone: "已推送至 RPC",
    btnBrowserDone: "已完成下载",
    toastAlreadyPushed: "⚠️ 此任务已推送至下载器，请勿重复触发！",
    toastAlreadyDownloaded: "⚠️ 此任务已在浏览器下载中或已完成！",
    testConn: "测试连接",
    copyAria2: "复制 Aria2c 命令",
    copyLink: "复制下载直链",
    screenshotBtn: "视频帧截图",
    coverBtn: "视频封面",
    articleCoverBtn: "专栏封面",
    frameTrack: "视频帧截图",
    btnCaptureFrame: "截取帧画面",
    danmakuTitle: "弹幕下载",
    danmakuBtnAss: "下载 ASS 弹幕",
    danmakuBtnXml: "下载 XML 弹幕",
    danmakuAssBtn: "下载 ASS 弹幕",
    danmakuXmlBtn: "下载 XML 弹幕",
    screenshotSuffix: "截图",
    subTitle: "字幕下载",
    subLoading: "正在载入字幕列表中...",
    subSelectPrompt: "请选择字幕语言",
    noSubtitle: "本视频无可用字幕",
    subAiTag: "AI 自动生成",
    subBtnSrt: "下载 SRT",
    subBtnAss: "下载 ASS",
    subBtnJson: "下载 JSON",
    subBtnTxt: "下载 TXT",
    subUpTag: "UP主提供",
    dynDownloadPng: "⬇️ 下载原图 (PNG)",
    langOption: "界面语言：",
    toastBrowserStart: "正在启动浏览器下载...",
    toastBrowserDone: "✅ 浏览器下载已发起！",
    toastBrowserFail: (err) => `❌ 下载失败: ${err}`,
    toastPushDual: "🚀 正在推送双轨下载任务至 RPC...",
    toastPushVideo: "🚀 正在推送视频轨任务至 RPC...",
    toastPushAudio: "🚀 正在推送音频轨任务至 RPC...",
    toastPushFail: (err) => `❌ 推送失败: ${err}`,
    toastCopyCmd: "📋 Aria2 下载命令已复制到剪贴板！",
    toastCopyLink: (type) => `已复制${type || ""}下载直链！`,
    toastMerging: "⚙️ 正在使用 WebAssembly 快速无损合成 MP4...",
    toastMergeDone: "🎉 完整 MP4 合成完成，已开始下载！",
    toastSubDone: (fmt, lang) => `✅ ${lang || ""} ${fmt} 字幕下载完成！`,
    toastDanmakuDone: (fmt) => `✅ ${fmt} 弹幕下载完成！`,
    toastScreenshotDone: (res) => `📸 截图成功！原生分辨率: ${res}`,
    toastCoverDone: "🖼️ 高清封面下载完成！",
    browserDlWarningHeader: "⚠️ 浏览器下载限制提醒",
    browserDlWarningText: "浏览器下载需在内存中缓存与合成，超过 2GB 的长视频容易因内存溢出 (OOM) 导致分屏崩溃。",
    cdnModeLabel: "CDN 路线：",
    cdnAuto: "🌐 智能探测优选 (自动测速容错，推荐)",
    cdnOverseas: "🌏 海外优先 (Akamai / 阿里海外，港台美澳)",
    cdnMainland: "🇨🇳 大陆直连 (阿里云 / 华为云核心节点)"
  },
  "en": {
    appBtn: "BiliWhale",
    qualityParsing: "Parsing...",
    qualityWait: "Preparing video streams...",
    downloadTarget: "Target:",
    dualTrack: "🎬 Video + Audio (Merged)",
    videoOnly: "📹 Video Only (No Audio)",
    audioOnly: "🎵 Audio Only (M4A/MP3)",
    autoBest: "Auto highest quality",
    videoTrack: "Video Stream",
    audioTrack: "Audio Stream",
    noAudio: "Embedded Audio Stream",
    totalSize: "Estimated Total:",
    calculating: "Calculating...",
    btnRpc: "Push to RPC (Dual)",
    btnBrowser: "Browser Download (Merged MP4)",
    coverTrack: "Video Cover",
    coverOnly: "🖼️ Video Cover (Original)",
    btnDownloadCover: "Download Cover",
    rpcConnected: (ver) => `Aria2 RPC Connected (v${ver})`,
    rpcDisconnected: "RPC not started (Browser download available)",
    rpcSettings: "⚙️ RPC Settings",
    collapse: "Collapse ▼",
    rpcEndpoint: "RPC Endpoint:",
    saveDir: "Save Dir:",
    rpcSecret: "RPC Secret:",
    tokenPlaceholder: "Optional (token)",
    saveDirPlaceholder: "Default C:\\Users\\{User}\\Downloads\\Video",
    btnRpcDone: "Pushed to RPC",
    btnBrowserDone: "Downloaded",
    toastAlreadyPushed: "⚠️ Task already pushed to RPC!",
    toastAlreadyDownloaded: "⚠️ Task already downloaded!",
    testConn: "Test",
    copyAria2: "Copy Aria2c Command",
    copyLink: "Copy Direct Links",
    screenshotBtn: "Screenshot",
    coverBtn: "Video Cover",
    articleCoverBtn: "Article Cover",
    frameTrack: "Video Frame",
    btnCaptureFrame: "Capture Frame",
    danmakuTitle: "Danmaku",
    danmakuBtnAss: "Download ASS Danmaku",
    danmakuBtnXml: "Download XML Danmaku",
    danmakuAssBtn: "Download ASS Danmaku",
    danmakuXmlBtn: "Download XML Danmaku",
    screenshotSuffix: "_screenshot",
    subTitle: "Subtitles",
    subLoading: "Loading subtitles...",
    subSelectPrompt: "Select subtitle language",
    noSubtitle: "No subtitles available",
    subAiTag: "AI Generated",
    subBtnSrt: "Download SRT",
    subBtnAss: "Download ASS",
    subBtnJson: "Download JSON",
    subBtnTxt: "Download TXT",
    subUpTag: "Uploader",
    dynDownloadPng: "⬇️ Raw PNG",
    langOption: "Language:",
    toastBrowserStart: "Starting browser download...",
    toastBrowserDone: "✅ Browser download started!",
    toastBrowserFail: (err) => `❌ Download failed: ${err}`,
    toastPushDual: "🚀 Pushing dual-track download to RPC...",
    toastPushVideo: "🚀 Pushing video stream to RPC...",
    toastPushAudio: "🚀 Pushing audio stream to RPC...",
    toastPushFail: (err) => `❌ RPC push failed: ${err}`,
    toastCopyCmd: "📋 Aria2 command copied to clipboard!",
    toastCopyLink: (type) => `Direct ${type || ""} download links copied!`,
    toastMerging: "⚙️ Muxing video and audio to MP4 with WebAssembly...",
    toastMergeDone: "🎉 MP4 muxed successfully and downloading!",
    toastSubDone: (fmt, lang) => `✅ ${lang || ""} ${fmt} subtitle downloaded!`,
    toastDanmakuDone: (fmt) => `✅ ${fmt} danmaku downloaded!`,
    toastScreenshotDone: (res) => `📸 Captured frame: ${res}`,
    toastCoverDone: "🖼️ Cover downloaded!",
    browserDlWarningHeader: "⚠️ Browser Download Notice",
    browserDlWarningText: "Streams are cached & merged in browser RAM. Videos >2GB may cause Out-Of-Memory (OOM) tab crashes.",
    cdnModeLabel: "CDN Route:",
    cdnAuto: "🌐 Smart Probe (Auto latency & failover)",
    cdnOverseas: "🌏 Overseas (Akamai / Aliyun Overseas)",
    cdnMainland: "🇨🇳 Mainland (Aliyun / Huawei Core)"
  }
};
function getActiveLanguage() {
  const saved = localStorage.getItem("bili_downloader_lang");
  if (saved && I18N[saved]) return saved;

  const browserLang = (navigator.language || navigator.userLanguage || "zh-TW").toLowerCase();
  if (browserLang.includes("tw") || browserLang.includes("hk") || browserLang.includes("mo") || browserLang.includes("hant")) {
    return "zh-TW";
  }
  if (browserLang.includes("cn") || browserLang.includes("sg") || browserLang.includes("hans")) {
    return "zh-CN";
  }
  if (browserLang.startsWith("en")) {
    return "en";
  }
  return "zh-TW";
}

let T = I18N[getActiveLanguage()];

// Quality Maps
const QUALITY_MAP_TW = {
  127: "8K 超高畫質",
  126: "杜比視界 Dolby Vision",
  125: "HDR 真彩",
  120: "4K 超高畫質",
  116: "1080P 60幀",
  112: "1080P 高碼率",
  80: "1080P 高畫質",
  74: "720P 60幀",
  64: "720P 準高畫質",
  32: "480P 清晰",
  16: "360P 流暢"
};

const QUALITY_MAP_CN = {
  127: "8K 超高清",
  126: "杜比视界 Dolby Vision",
  125: "HDR 真彩",
  120: "4K 超高清",
  116: "1080P 60帧",
  112: "1080P 高码率",
  80: "1080P 高畫質",
  74: "720P 60帧",
  64: "720P 准高清",
  32: "480P 清晰",
  16: "360P 流畅"
};

const AUDIO_QUALITY_MAP_TW = {
  30280: "192K 高音質",
  30232: "132K 標準音質",
  30216: "64K 語音",
  30250: "杜比全景聲 (Dolby Atmos)",
  30251: "Hi-Res 無損音質"
};

const AUDIO_QUALITY_MAP_CN = {
  30280: "192K 高音质",
  30232: "132K 标准音质",
  30216: "64K 语音",
  30250: "杜比全景声 (Dolby Atmos)",
  30251: "Hi-Res 无损音质"
};


function localizeQuality(text) {
  if (!text) return "";
  if (getActiveLanguage() === "zh-TW") {
    return text
      .replace(/超高清/g, "超高畫質")
      .replace(/高清/g, "高畫質")
      .replace(/超清/g, "超高畫質")
      .replace(/准高/g, "準高")
      .replace(/准/g, "準")
      .replace(/音质/g, "音質")
      .replace(/画质/g, "畫質")
      .replace(/标清/g, "標清")
      .replace(/流畅/g, "流暢");
  }
  return text;
}

function getQualityMap() {
  return getActiveLanguage() === "zh-CN" ? QUALITY_MAP_CN : QUALITY_MAP_TW;
}

function getAudioQualityMap() {
  return getActiveLanguage() === "zh-CN" ? AUDIO_QUALITY_MAP_CN : AUDIO_QUALITY_MAP_TW;
}

const PLAYURL_API = "//api.bilibili.com/x/player/wbi/playurl";
const FETCH_OPTS = { credentials: "include" };

// Page Type Detectors
const isVideoPage = () => /\/video\/(av|bv)[0-9a-zA-Z]+/i.test(window.location.pathname);
const isBangumiPage = () => /\/bangumi\/play\/\S+/i.test(window.location.pathname);
const isWatchPage = () => {
  const host = location.hostname;
  return (host === "www.bilibili.com" || host === "bilibili.com") && (isVideoPage() || isBangumiPage());
};
const isArticlePage = () => /\/read\/cv[0-9]+/i.test(window.location.pathname) || /\/opus\/\d+/i.test(window.location.pathname);
const isDynamicFeed = () => location.hostname === "t.bilibili.com" || location.pathname.includes("/dynamic") || location.pathname.includes("/opus");

const formatSize = (bytes) => {
  if (!bytes || bytes <= 0) return "未知大小";
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;
  const kb = 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
  if (bytes >= kb) return `${(bytes / kb).toFixed(2)} KB`;
  return `${bytes} B`;
};

const sanitizeFilename = (name) => {
  return (name || "bilibili_download")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
};

const getInternals = () => {
  const el = document.getElementById(SCRIPT_ID);
  if (!el || !el.dataset.internals) {
    return {
      baseUrl: "",
      characterUrl: "",
      iconUrl: "",
      manifest: { name: "BiliWhale", version: "1.0.0" }
    };
  }
  return JSON.parse(el.dataset.internals);
};

function parseRpcParts(fullUrl) {
  try {
    const u = new URL(fullUrl);
    return {
      host: `${u.protocol}//${u.hostname}`,
      port: u.port || "16800",
      path: u.pathname || "/jsonrpc"
    };
  } catch (e) {
    return { host: "http://localhost", port: "16800", path: "/jsonrpc" };
  }
}

const Settings = {
  get rpcUrl() {
    return localStorage.getItem("bili_motrix_rpc_url") || "http://localhost:16800/jsonrpc";
  },
  set rpcUrl(val) {
    localStorage.setItem("bili_motrix_rpc_url", val.trim());
  },
  get rpcToken() {
    return localStorage.getItem("bili_motrix_rpc_token") || "";
  },
  set rpcToken(val) {
    localStorage.setItem("bili_motrix_rpc_token", val.trim());
  },
  get rpcDir() {
    return localStorage.getItem("bili_motrix_rpc_dir") || "Video";
  },
  set rpcDir(val) {
    localStorage.setItem("bili_motrix_rpc_dir", val.trim());
  },
  get cdnMode() {
    return localStorage.getItem("bili_whale_cdn_mode") || "auto";
  },
  set cdnMode(val) {
    localStorage.setItem("bili_whale_cdn_mode", val);
  },
  get isExpanded() {
    return localStorage.getItem("bili_motrix_panel_expanded") === "true";
  },
  set isExpanded(val) {
    localStorage.setItem("bili_motrix_panel_expanded", val ? "true" : "false");
  }
};

const logMsg = (...args) => {
  console.log("[BiliWhale]", ...args);
};

// ==========================================
// BiliASS: XML Danmaku to ASS Converter
// ==========================================
function convertXmlToAss(xmlStr, title = "Bilibili Danmaku", screenWidth = 1920, screenHeight = 1080) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
  const danmakus = xmlDoc.getElementsByTagName("d");

  const header = `[Script Info]
Title: ${title}
ScriptType: v4.00+
Collisions: Normal
PlayResX: ${screenWidth}
PlayResY: ${screenHeight}
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Microsoft YaHei,50,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1.5,0,2,20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const formatAssTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
  };

  const colorToAss = (num) => {
    const c = parseInt(num, 10);
    const r = (c >> 16) & 0xff;
    const g = (c >> 8) & 0xff;
    const b = c & 0xff;
    return `\\c&H${b.toString(16).padStart(2, "0").toUpperCase()}${g.toString(16).padStart(2, "0").toUpperCase()}${r.toString(16).padStart(2, "0").toUpperCase()}&`;
  };

  const lines = [];
  const tracks = new Array(20).fill(0);
  const trackHeight = 52;
  const scrollDuration = 9.0;
  const stillDuration = 4.5;

  for (let i = 0; i < danmakus.length; i++) {
    const d = danmakus[i];
    const p = d.getAttribute("p");
    if (!p) continue;
    const parts = p.split(",");
    const time = parseFloat(parts[0]);
    const mode = parseInt(parts[1], 10);
    const color = parts[3];
    const text = d.textContent.trim().replace(/[\r\n]/g, " ");

    const colorTag = colorToAss(color);
    const startStr = formatAssTime(time);

    if (mode === 1 || mode === 2 || mode === 3) {
      const endStr = formatAssTime(time + scrollDuration);
      let bestTrack = 0;
      let minAvailableTime = Infinity;
      for (let t = 0; t < tracks.length; t++) {
        if (tracks[t] <= time) {
          bestTrack = t;
          break;
        }
        if (tracks[t] < minAvailableTime) {
          minAvailableTime = tracks[t];
          bestTrack = t;
        }
      }
      tracks[bestTrack] = time + 2.5;
      const y = 60 + bestTrack * trackHeight;
      lines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\move(${screenWidth + 50},${y},-${text.length * 50 + 100},${y})${colorTag}}${text}`);
    } else if (mode === 5) {
      const endStr = formatAssTime(time + stillDuration);
      lines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\an8\\pos(${screenWidth / 2},50)${colorTag}}${text}`);
    } else if (mode === 4) {
      const endStr = formatAssTime(time + stillDuration);
      lines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\an2\\pos(${screenWidth / 2},${screenHeight - 50})${colorTag}}${text}`);
    }
  }

  return header + lines.join("\n");
}

// Subtitle Converters (SRT, ASS, TXT)
function subToSrt(items) {
  const formatSrtTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec - Math.floor(sec)) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  };
  return items.map((item, idx) => `${idx + 1}\n${formatSrtTime(item.from)} --> ${formatSrtTime(item.to)}\n${item.content}\n`).join("\n");
}

function subToAss(items, title = "Subtitle") {
  const formatAssTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
  };
  const header = `[Script Info]\nTitle: ${title}\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Microsoft YaHei,42,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,20,20,30,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const lines = items.map((item) => `Dialogue: 0,${formatAssTime(item.from)},${formatAssTime(item.to)},Default,,0,0,0,,${item.content}`);
  return header + lines.join("\n");
}

function subToTxt(items) {
  return items.map((item) => item.content).join("\n");
}

// Download Trigger Helper
function triggerFileDownload(content, filename, mime = "text/plain;charset=utf-8") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  (document.body || document.documentElement).appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 20000);
}

// Aria2 / Motrix RPC Client

// =========================================================================
// Privileged Fetch Proxy Helper: Bypasses Mixed Content (HTTPS -> HTTP),
// Private Network Access (PNA), and CORS via background service worker
// =========================================================================

function privilegedFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestId = `pf_${Date.now()}_${Math.random()}`;
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      reject(new Error("RPC 代理通訊逾時"));
    }, 8000);

    const onMsg = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "BILI_EXT_PROXY_RESPONSE" && event.data.requestId === requestId) {
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
        const resp = event.data.response;
        if (!resp) {
          reject(new Error("擴充功能代理無回應"));
          return;
        }
        if (resp.error && !resp.ok && resp.status === undefined) {
          reject(new Error(resp.error));
          return;
        }
        resolve({
          ok: resp.ok,
          status: resp.status || (resp.ok ? 200 : 500),
          statusText: resp.statusText || "",
          text: async () => resp.text || "",
          json: async () => {
            try {
              return JSON.parse(resp.text || "{}");
            } catch (err) {
              throw new Error("無效的 JSON 回應");
            }
          }
        });
      }
    };

    window.addEventListener("message", onMsg);
    window.postMessage({
      type: "BILI_EXT_PROXY_FETCH",
      requestId,
      url,
      options
    }, "*");
  });
}

function downloadFileViaExtension(url, filename) {
  return new Promise((resolve, reject) => {
    const requestId = `dl_${Date.now()}_${Math.random()}`;
    const safeFilename = (filename || "download").replace(/[\\/:*?"<>|]/g, "_");
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      reject(new Error("下載請求逾時"));
    }, 8000);

    const onMsg = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "BILI_EXT_DOWNLOAD_RESPONSE" && event.data.requestId === requestId) {
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
        if (event.data.response?.ok) {
          resolve({ ok: true });
        } else {
          reject(new Error(event.data.response?.error || "擴充功能下載失敗"));
        }
      }
    };

    window.addEventListener("message", onMsg);
    window.postMessage({
      type: "BILI_EXT_DOWNLOAD_URL",
      requestId,
      url,
      filename: safeFilename
    }, "*");
  });
}

const Aria2RPC = {
  async testConnection(rpcUrl = Settings.rpcUrl, token = Settings.rpcToken) {
    try {
      const params = token ? [`token:${token}`] : [];
      const payload = {
        jsonrpc: "2.0",
        id: `test_${Date.now()}`,
        method: "aria2.getVersion",
        params: params
      };
      const res = await privilegedFetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "RPC Error");
      return { ok: true, version: data.result.version };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

    async tellActive(rpcUrl = Settings.rpcUrl, token = Settings.rpcToken) {
    try {
      const params = token ? [`token:${token}`] : [];
      const payload = {
        jsonrpc: "2.0",
        id: `act_${Date.now()}`,
        method: "aria2.tellActive",
        params: params
      };
      const res = await privilegedFetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.result || [];
    } catch (e) {
      return [];
    }
  },

async addUri({ url, urls, filename, dir, referer = "https://www.bilibili.com/" }) {
    const rpcUrl = Settings.rpcUrl;
    const token = Settings.rpcToken;
    const saveDir = dir || Settings.rpcDir;

    const headers = [
      `Referer: ${referer}`,
      `User-Agent: ${navigator.userAgent}`
    ];

    const options = {
      header: headers,
      out: filename,
      "remote-time": "false",
      "split": "8",
      "max-connection-per-server": "8",
      "min-split-size": "1M"
    };

    // Only specify options.dir if user entered a custom absolute path (e.g. C:\Users\...\Downloads\Video)
    // If empty or relative, do not send options.dir so Motrix naturally uses its own default Downloads directory!
    if (saveDir && saveDir.trim() !== "" && /^[a-zA-Z]:\\|^\\\\|^\//.test(saveDir.trim())) {
      options.dir = saveDir.trim();
    }

    const uriList = (Array.isArray(urls) && urls.length > 0 
      ? urls 
      : (Array.isArray(url) ? url : [url])).slice().sort((a, b) => {
        const aBad = a.includes("mirrorcosov");
        const bBad = b.includes("mirrorcosov");
        if (aBad && !bBad) return 1;
        if (!aBad && bBad) return -1;
        return 0;
      });

    const params = [];
    if (token) {
      params.push(`token:${token}`);
    }
    params.push(uriList);
    params.push(options);

    const payload = {
      jsonrpc: "2.0",
      id: `bili_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      method: "aria2.addUri",
      params: params
    };

    const res = await privilegedFetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} 連線失敗`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "RPC 回傳錯誤");
    return data.result;
  }
};


// =========================================================================
// WebAssembly FFmpeg Muxing Engine (Ported from bilibili-helper v3.0.4)
// Allows direct in-browser lossless MP4 muxing (-vcodec copy -acodec copy)
// =========================================================================
var FFMPEG_CMD;
(function(e){
  e.LOAD="LOAD"; e.EXEC="EXEC"; e.WRITE_FILE="WRITE_FILE"; e.READ_FILE="READ_FILE";
  e.DELETE_FILE="DELETE_FILE"; e.RENAME="RENAME"; e.CREATE_DIR="CREATE_DIR";
  e.LIST_DIR="LIST_DIR"; e.DELETE_DIR="DELETE_DIR"; e.ERROR="ERROR";
  e.DOWNLOAD="DOWNLOAD"; e.PROGRESS="PROGRESS"; e.LOG="LOG";
})(FFMPEG_CMD || (FFMPEG_CMD = {}));

var ffmpegSeq = (() => { let e = 0; return () => e++; })();

class WasmFFmpegClient {
  #worker = null;
  #resolves = {};
  #rejects = {};
  #logHandlers = [];
  #progressHandlers = [];
  loaded = false;

  constructor({ worker }) {
    this.#worker = worker;
    this.#initEvents();
  }

  #initEvents = () => {
    if (!this.#worker) return;
    this.#worker.onmessage = ({ data: { id, type, data } }) => {
      switch (type) {
        case FFMPEG_CMD.LOAD:
          this.loaded = true;
          if (this.#resolves[id]) this.#resolves[id](data);
          break;
        case FFMPEG_CMD.EXEC:
        case FFMPEG_CMD.WRITE_FILE:
        case FFMPEG_CMD.READ_FILE:
        case FFMPEG_CMD.DELETE_FILE:
        case FFMPEG_CMD.RENAME:
        case FFMPEG_CMD.CREATE_DIR:
        case FFMPEG_CMD.LIST_DIR:
        case FFMPEG_CMD.DELETE_DIR:
          if (this.#resolves[id]) this.#resolves[id](data);
          break;
        case FFMPEG_CMD.LOG:
          this.#logHandlers.forEach((fn) => fn(data));
          break;
        case FFMPEG_CMD.PROGRESS:
          this.#progressHandlers.forEach((fn) => fn(data));
          break;
        case FFMPEG_CMD.ERROR:
          if (this.#rejects[id]) this.#rejects[id](data);
          break;
      }
      delete this.#resolves[id];
      delete this.#rejects[id];
    };
  };

  #send = ({ type, data }, transfer = []) => {
    if (!this.#worker) return Promise.reject(new Error("FFmpeg worker not initialized"));
    return new Promise((resolve, reject) => {
      const reqId = ffmpegSeq();
      this.#worker.postMessage({ id: reqId, type, data }, transfer);
      this.#resolves[reqId] = resolve;
      this.#rejects[reqId] = reject;
    });
  };

  on(type, fn) {
    if (type === "log") this.#logHandlers.push(fn);
    else if (type === "progress") this.#progressHandlers.push(fn);
  }

  load = (data = {}) => this.#send({ type: FFMPEG_CMD.LOAD, data });
  exec = (args, timeout = -1) => this.#send({ type: FFMPEG_CMD.EXEC, data: { args, timeout } });
  writeFile = (path, data) => {
    const transfer = [];
    if (data instanceof Uint8Array) transfer.push(data.buffer);
    return this.#send({ type: FFMPEG_CMD.WRITE_FILE, data: { path, data } }, transfer);
  };
  readFile = (path, encoding = "binary") => this.#send({ type: FFMPEG_CMD.READ_FILE, data: { path, encoding } });
  deleteFile = (path) => this.#send({ type: FFMPEG_CMD.DELETE_FILE, data: { path } });
}

const urlToBlobUrl = async (url, mime) => {
  const buf = await (await fetch(url)).arrayBuffer();
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
};

let globalFFmpegInstance = null;
async function getFFmpegCoreInstance(baseUrl) {
  if (globalFFmpegInstance) return globalFFmpegInstance;
  logMsg("正在初始化 WebAssembly FFmpeg 核心模組...");
  const workerBlob = await urlToBlobUrl(`${baseUrl}/ffmpeg.worker.js`, "text/javascript");
  const worker = new Worker(workerBlob, { type: "module" });
  const client = new WasmFFmpegClient({ worker });

  const coreBlob = await urlToBlobUrl(`${baseUrl}/ffmpeg-core.js`, "text/javascript");
  const wasmBlob = await urlToBlobUrl(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm");
  const coreWorkerBlob = await urlToBlobUrl(`${baseUrl}/ffmpeg-core.worker.js`, "text/javascript");

  await client.load({
    coreURL: coreBlob,
    wasmURL: wasmBlob,
    workerURL: coreWorkerBlob
  });

  globalFFmpegInstance = client;
  logMsg("WebAssembly FFmpeg 初始化就緒！");
  return client;
}

async function mergeTracksToMp4(baseUrl, audioBuf, videoBuf, onStatus) {
  if (onStatus) onStatus("載入 WebAssembly FFmpeg 核心...");
  const ffmpeg = await getFFmpegCoreInstance(baseUrl);
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const aFile = `${stamp}_a.mp4`;
  const vFile = `${stamp}_v.mp4`;
  const mFile = `${stamp}_merged.mp4`;

  if (onStatus) onStatus("正在寫入視訊與音訊數據至虛擬記憶體...");
  await ffmpeg.writeFile(aFile, new Uint8Array(audioBuf));
  await ffmpeg.writeFile(vFile, new Uint8Array(videoBuf));

  if (onStatus) onStatus("正在執行快速無損混流 (Copy)...");
  await ffmpeg.exec(["-i", vFile, "-i", aFile, "-vcodec", "copy", "-acodec", "copy", mFile]);

  if (onStatus) onStatus("讀取最終 MP4 封裝檔案...");
  const output = await ffmpeg.readFile(mFile);

  // cleanup virtual files
  ffmpeg.deleteFile(aFile).catch(() => {});
  ffmpeg.deleteFile(vFile).catch(() => {});
  ffmpeg.deleteFile(mFile).catch(() => {});

  return output.buffer;
}

// ==========================================
// Bilibili Multi-Cloud UPOS CDN Routing & Intelligent Resolver
// Inspired by Bilibili-thread-ripper research (UPOS host swap & cross-region dispatch)
// ==========================================
const OVERSEAS_UPOS_HOSTS = [
  "upos-hz-mirrorakam.akamaized.net",   // Akamai (Fastest for US / Europe / Australia / Taiwan / Japan)
  "upos-sz-mirroraliov.bilivideo.com",  // Aliyun Overseas (Ultra-low latency for Taiwan / HK / APAC)
  "upos-sz-mirrorhwov.bilivideo.com"   // Huawei Cloud Overseas
];

const MAINLAND_UPOS_HOSTS = [
  "upos-sz-mirrorali.bilivideo.com",    // Aliyun Mainland (High bandwidth, zero throttling)
  "upos-sz-mirrorhw.bilivideo.com",     // Huawei Cloud Mainland
  "upos-sz-mirrorcos.bilivideo.com",    // Tencent Cloud Mainland
  "upos-sz-mirrorcoso1.bilivideo.com",  // Tencent Cloud Mainland Backup
  "upos-sz-mirrorbd.bilivideo.com"      // Baidu Cloud Mainland
];

function synthesizeUposUrls(originalUrl) {
  if (!originalUrl || typeof originalUrl !== "string") return [];
  // Only standard UPOS URLs allow host swapping (exclude mcdn P2P relays)
  if (!originalUrl.includes("/upgcxcode/") || originalUrl.includes("mcdn")) {
    return [originalUrl];
  }

  try {
    const u = new URL(originalUrl);
    const mode = Settings.cdnMode; // 'auto', 'overseas', 'mainland'

    let targetHosts = [];
    if (mode === "overseas") {
      targetHosts = [...OVERSEAS_UPOS_HOSTS, ...MAINLAND_UPOS_HOSTS];
    } else if (mode === "mainland") {
      targetHosts = [...MAINLAND_UPOS_HOSTS, ...OVERSEAS_UPOS_HOSTS];
    } else {
      // Auto: detect client timezone heuristic
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const isOverseas = !/Shanghai|Chongqing|Beijing|Harbin|Urumqi/i.test(tz);
      targetHosts = isOverseas
        ? [...OVERSEAS_UPOS_HOSTS, ...MAINLAND_UPOS_HOSTS]
        : [...MAINLAND_UPOS_HOSTS, ...OVERSEAS_UPOS_HOSTS];
    }

    const synthesized = [originalUrl];
    for (const host of targetHosts) {
      if (host !== u.hostname) {
        synthesized.push(`${u.protocol}//${host}${u.pathname}${u.search}`);
      }
    }
    return synthesized;
  } catch (e) {
    return [originalUrl];
  }
}

// 1-Byte Micro-Probe to test real latency & reachability from user's current network
async function probeUposNode(url, timeoutMs = 1800) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Range": "bytes=0-0",
        "Referer": "https://www.bilibili.com/"
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok || res.status === 206) {
      const rtt = Math.round(performance.now() - start);
      return { ok: true, rtt, url };
    }
    return { ok: false, status: res.status, url };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.message, url };
  }
}

async function fetchBufferWithProgress(urls, onProgress) {
  const urlList = (Array.isArray(urls) && urls.length > 0 ? urls : [urls]).filter(Boolean);
  
  // Sort candidate URLs: deprioritize upos-sz-mirrorcosov.bilivideo.com
  const sortedUrls = [...urlList].sort((a, b) => {
    const aBad = a.includes("mirrorcosov");
    const bBad = b.includes("mirrorcosov");
    if (aBad && !bBad) return 1;
    if (!aBad && bBad) return -1;
    return 0;
  });

  // Run in-browser micro-probe (1-byte Range test) on top candidates in parallel
  logMsg("正在探測本地最佳延遲 CDN 節點 (台/美/澳/大陸智慧調度)...");
  const candidatesToProbe = sortedUrls.slice(0, 5);
  let probeSortedUrls = sortedUrls;

  try {
    const probeResults = await Promise.allSettled(candidatesToProbe.map((u) => probeUposNode(u)));
    const fastAliveNodes = [];
    const failedNodes = [];

    candidatesToProbe.forEach((u, i) => {
      const res = probeResults[i];
      if (res.status === "fulfilled" && res.value.ok) {
        fastAliveNodes.push(res.value);
      } else {
        failedNodes.push(u);
      }
    });

    if (fastAliveNodes.length > 0) {
      fastAliveNodes.sort((a, b) => a.rtt - b.rtt);
      logMsg(`CDN 探測完成！首選最佳節點延遲: ${fastAliveNodes[0].rtt}ms (${new URL(fastAliveNodes[0].url).hostname})`);
      probeSortedUrls = [
        ...fastAliveNodes.map((n) => n.url),
        ...sortedUrls.slice(5),
        ...failedNodes
      ];
    }
  } catch (pErr) {
    logMsg("CDN 探測跳過，使用備用排序", pErr);
  }

  let lastError = null;
  for (const targetUrl of probeSortedUrls) {
    try {
      logMsg(`嘗試請求串流節點: ${targetUrl.substring(0, 65)}...`);
      // Add Range: bytes=0- header to satisfy CDN media range requirements and bypass HTTP 567
      const res = await fetch(targetUrl, {
        headers: {
          "Range": "bytes=0-",
          "Referer": "https://www.bilibili.com/"
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Determine total stream size from Content-Range (for 206) or Content-Length (for 200)
      let total = 0;
      const contentRange = res.headers.get("content-range");
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)/);
        if (match) total = parseInt(match[1], 10);
      }
      if (!total) {
        const lenHeader = res.headers.get("content-length");
        total = lenHeader ? parseInt(lenHeader, 10) : 0;
      }

      let received = 0;
      const reader = res.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (onProgress && total > 0) {
          onProgress(received, total);
        }
      }
      const result = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return result.buffer;
    } catch (err) {
      logMsg(`該串流節點下載失敗: ${err.message}，正在自動切換備用節點...`);
      lastError = err;
    }
  }
  throw lastError || new Error("所有串流節點均無法存取 (567/403)");
}


// Browser Native Download Helper (Records directly into Chrome/Edge downloads)
async function downloadInBrowser({ url, urls, filename, btnEl }) {
  let origText = "";
  if (btnEl) {
    btnEl.disabled = true;
    origText = btnEl.innerHTML;
    btnEl.innerHTML = `<span>⏳</span> 下載中...`;
  }
  try {
    logMsg(`啟動瀏覽器原生下載: ${filename}`);
    const candidateUrls = urls && urls.length > 0 ? urls : [url];
    const buf = await fetchBufferWithProgress(candidateUrls, (received, total) => {
      if (btnEl && total > 0) {
        const pct = Math.min(99, Math.round((received / total) * 100));
        btnEl.innerHTML = `<span>⏳</span> ${pct}% (${formatSize(received)})`;
      }
    });

    const isAudio = filename.endsWith(".m4a");
    const blob = new Blob([buf], { type: isAudio ? "audio/mp4" : "video/mp4" });
    triggerFileDownload(blob, filename);

    logMsg(`瀏覽器下載完成: ${filename}`);
    if (btnEl) {
      btnEl.innerHTML = `<span>✅</span> 已完成！`;
      setTimeout(() => {
        btnEl.innerHTML = origText;
        btnEl.disabled = false;
      }, 3000);
    }
    return true;
  } catch (err) {
    logMsg(`瀏覽器下載失敗: ${err.message}`);
    if (btnEl) {
      btnEl.innerHTML = `<span>⚠️</span> 失敗`;
      setTimeout(() => {
        btnEl.innerHTML = origText;
        btnEl.disabled = false;
      }, 3000);
    }
    throw err;
  }
}

// UI Styles
const STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #18191c;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Host Container */
  #container {
    position: fixed;
    z-index: 2147483647;
    bottom: 0;
    right: 0;
    font-size: 13px;
  }

  /* Collapsed Floating Button (Bottom-Right) */
  #toggle-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #00aeec 0%, #fb7299 100%);
    color: #fff;
    padding: 10px 20px;
    border-radius: 28px;
    box-shadow: 0 4px 16px rgba(0, 174, 236, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    user-select: none;
    border: none;
    outline: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2147483647;
  }
  #toggle-btn:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 20px rgba(251, 114, 153, 0.45);
  }
  #toggle-btn:active {
    transform: translateY(0) scale(0.98);
  }

  /* Expanded Bottom Panel - Height 390px */
  #panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 390px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.93) 45%, rgba(255, 255, 255, 0.88) 100%);
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
    border-top: 2px solid rgba(0, 174, 236, 0.6);
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
    display: flex;
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
  }
  #panel.show {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  /* Left Side: DeepSeek Anime Maid Image - Shifted Left, Zero Hard Seams */
  #character-container {
    position: absolute;
    left: -12px;
    bottom: 0;
    width: 330px;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  #character-img {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: left bottom;
    background-size: auto 100%;
    opacity: 0.98;
    filter: drop-shadow(2px 0 12px rgba(0, 0, 0, 0.05));
  }

  /* Right Side: Main Content Container (No scroll when RPC settings closed) */
  #panel-content {
    margin-left: 270px;
    flex: 1;
    height: 100%;
    max-height: 100%;
    padding: 20px 24px 16px 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 10px;
    position: relative;
    z-index: 2;
    overflow-y: hidden;
    overflow-x: hidden;
  }

  /* Only allow vertical scroll when RPC settings drawer is open */
  #panel-content.can-scroll {
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  /* Custom Floating Minimalist Scrollbar (Never shifts elements) */
  #panel-content::-webkit-scrollbar {
    width: 6px;
  }
  #panel-content::-webkit-scrollbar-track {
    background: transparent;
  }
  #panel-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.16);
    border-radius: 4px;
    transition: background 0.2s;
  }
  #panel-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 174, 236, 0.65);
  }

  /* Top Bar (Balanced, aligned, and properly spaced from top border) */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    min-height: 32px;
  }
  .title-area {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
    height: 32px;
  }
  .quality-badge {
    background: #fb7299;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 0 8px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    white-space: nowrap;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }
  .video-title {
    font-size: 16px;
    font-weight: 600;
    color: #18191c;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 32px;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    height: 32px;
  }
  .header-lang-select {
    background: #f4f5f7;
    border: 1px solid #e3e5e7;
    border-radius: 6px;
    padding: 0 10px;
    height: 32px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-family: inherit;
    color: #61666d;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
  }
  .header-lang-select:hover {
    background: #e3e5e7;
    color: #18191c;
    border-color: #ccd0d7;
  }
  .icon-btn {
    background: #f4f5f7;
    border: 1px solid #e3e5e7;
    border-radius: 6px;
    padding: 0 12px;
    height: 32px;
    box-sizing: border-box;
    font-size: 12px;
    font-family: inherit;
    color: #61666d;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .icon-btn:hover {
    background: #e3e5e7;
    color: #18191c;
    border-color: #ccd0d7;
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c62828;
    flex-shrink: 0;
  }
  .status-dot.connected {
    background: #2e7d32;
  }
  .btn-close {
    background: #f4f5f7;
    border: 1px solid transparent;
    padding: 0 14px;
    height: 32px;
    box-sizing: border-box;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    color: #61666d;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .btn-close:hover {
    background: #e3e5e7;
    color: #18191c;
  }

  /* Collapsible Settings Drawer */
  .settings-drawer {
    display: none;
    background: rgba(246, 247, 249, 0.95);
    border: 1px solid #e3e5e7;
    border-radius: 8px;
    padding: 10px 14px;
    flex-shrink: 0;
    animation: fadeIn 0.2s ease;
  }
  .settings-drawer.show {
    display: block;
  }
  .setting-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .setting-input {
    border: 1px solid #ccd0d7;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
    background: #fff;
  }
  .btn-pill {
    border: 1px solid #ccd0d7;
    background: #fff;
    color: #18191c;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
  }
  .btn-pill.primary {
    background: #00aeec;
    border-color: #00aeec;
    color: #fff;
  }

  /* Main Workspace */
  .workspace-layout {
    display: flex;
    gap: 18px;
    align-items: stretch;
    margin: 4px 0;
    flex-shrink: 0;
  }

  /* Center Column: Specs, Dropdown & Subtitles Stacked Vertically */
  .center-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .center-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dropdown-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dropdown-label {
    font-size: 12px;
    font-weight: 600;
    color: #61666d;
  }
  .stream-dropdown {
    appearance: none;
    -webkit-appearance: none;
    background: #fff url('data:image/svg+xml;utf8,<svg fill="%2361666d" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>') no-repeat right 10px center;
    border: 1px solid #ccd0d7;
    border-radius: 6px;
    padding: 5px 30px 5px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #18191c;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
  }

  /* Stacked Spec Rows */
  .specs-vertical-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .spec-row-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border: 1px solid #e3e5e7;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
  }
  .spec-row-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .spec-val {
    font-weight: 700;
    color: #222;
  }

  /* Subtitles Section */
  .subtitles-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px solid #e3e5e7;
    gap: 12px;
  }
  /* Danmaku Section (Placed symmetrically right below subtitles) */
  .danmaku-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px dashed #e9ecef;
    gap: 12px;
  }
  .danmaku-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  .danmaku-label {
    font-size: 13px;
    font-weight: 700;
    color: #18191c;
    white-space: nowrap;
  }
  .danmaku-desc {
    font-size: 11px;
    color: #9499a0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .danmaku-pills {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .subtitles-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  .subtitles-label {
    font-size: 13px;
    font-weight: 700;
    color: #18191c;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }
  .sub-lang-select {
    background: #ffffff;
    border: 1px solid #c9ccd0;
    border-radius: 6px;
    padding: 5px 12px;
    height: 34px;
    font-size: 13px;
    font-weight: 500;
    color: #18191c;
    outline: none;
    cursor: pointer;
    min-width: 190px;
    max-width: 270px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  .sub-lang-select:hover:not(:disabled) {
    border-color: #00aeec;
    box-shadow: 0 0 0 2px rgba(0, 174, 236, 0.15);
  }
  .sub-lang-select:disabled {
    background: #f4f5f7;
    color: #9499a0;
    cursor: not-allowed;
  }
  .subtitles-pills {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .sub-pill-btn {
    background: #f0f9ff;
    border: 1px solid #b9e6fc;
    border-radius: 6px;
    padding: 5px 14px;
    height: 34px;
    font-size: 13px;
    font-weight: 600;
    color: #008ac5;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 138, 197, 0.08);
  }
  .sub-pill-btn:hover:not(:disabled) {
    background: #00aeec;
    color: #ffffff;
    border-color: #00aeec;
    box-shadow: 0 3px 8px rgba(0, 174, 236, 0.28);
    transform: translateY(-1px);
  }
  .sub-pill-btn:active:not(:disabled) {
    transform: translateY(0);
    background: #009cd3;
  }
  .sub-pill-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f4f5f7;
    color: #9499a0;
    border-color: #e3e5e7;
    box-shadow: none;
    transform: none;
  }

  /* Right Column: Download Buttons (Compact, not stretched!) */
  .right-column {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    background: #fff;
    border: 1px solid #e3e5e7;
    border-radius: 8px;
    padding: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  .btn-action-side {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    white-space: nowrap;
  }
  .btn-action-side:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
  }
  .btn-action-side:active:not(:disabled) {
    transform: translateY(0);
  }
  .btn-action-side:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  .btn-rpc-side {
    background: linear-gradient(135deg, #00aeec 0%, #0088cc 100%);
    color: #fff;
  }
  .btn-browser-side {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
  }
  .browser-warning-card {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all 0.25s ease;
  }
  .browser-warning-card:hover {
    border-color: #f59e0b;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
  }
  .browser-warning-card.highlight-oom {
    background: #fef2f2;
    border-color: #fca5a5;
    animation: gentlePulse 2s infinite ease-in-out;
  }
  .browser-warning-card.highlight-oom .warning-title {
    color: #b91c1c;
  }
  .browser-warning-card.highlight-oom .warning-desc {
    color: #991b1b;
  }
  .warning-title {
    font-size: 11px;
    font-weight: 700;
    color: #b45309;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .warning-desc {
    font-size: 11px;
    line-height: 1.45;
    color: #78350f;
    word-break: break-word;
  }
  @keyframes gentlePulse {
    0%, 100% { border-color: #fca5a5; }
    50% { border-color: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.25); }
  }

  /* Interactive Frame Timecode Sync Box */
  .frame-time-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
    background: #f4f5f7;
    border: 1px solid #ccd0d7;
    border-radius: 4px;
    padding: 2px 6px;
    transition: all 0.2s;
  }
  .frame-time-wrapper:focus-within {
    border-color: #00aeec;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(0, 174, 236, 0.15);
  }
  .frame-time-input {
    width: 54px;
    border: none;
    background: transparent;
    font-size: 11px;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-weight: 600;
    color: #008ac5;
    text-align: center;
    padding: 0;
    outline: none;
  }
  .frame-time-total {
    font-size: 11px;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
    color: #9499a0;
    user-select: none;
  }

  /* Dynamic Raw PNG Floating Badge */
  .bili-dyn-png-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 174, 236, 0.9);
    backdrop-filter: blur(4px);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    z-index: 999;
    transition: all 0.2s;
  }
  .bili-dyn-png-badge:hover {
    background: #0099e6;
    transform: scale(1.05);
  }

  /* Toast Notification */
  .toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(24, 25, 28, 0.92);
    backdrop-filter: blur(8px);
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2147483647;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Main App Controller
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function parseTimeToSeconds(str) {
  if (!str) return NaN;
  str = String(str).trim();
  if (/^\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str);
  }
  const parts = str.split(":").map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return NaN;
}

class BiliMotrixApp {
  constructor() {
    window.__BILI_APP_INSTANCE__ = this;
    this.internals = getInternals();
    this.currentQuality = 120;
    this.streamData = null;
    this.subtitleList = [];
    this.initDOM();
    this.bindEvents();
    this.checkInitialAria2();
    this.startRpcHeartbeat();
    this.startVideoProgressSync();
  }

  startVideoProgressSync() {
    if (this._progressSyncTimer) clearInterval(this._progressSyncTimer);
    this._progressSyncTimer = setInterval(() => {
      if (!this.shadow || !Settings.isExpanded) return;
      const input = this.shadow.getElementById("frame-time-input");
      const totalEl = this.shadow.getElementById("frame-time-total");
      if (!input) return;

      // Do not overwrite while user is editing/focusing the input
      if (this.shadow.activeElement === input) return;

      const video = document.querySelector("#bilibili-player video, .bpx-player-video-wrap video");
      if (video && !isNaN(video.currentTime)) {
        input.value = formatTime(video.currentTime);
        if (totalEl && !isNaN(video.duration) && video.duration > 0) {
          totalEl.textContent = `/ ${formatTime(video.duration)}`;
        }
      } else {
        // Fallback: sync from Bilibili shadow progress scaleX
        const progressCurrent = document.querySelector(".bpx-player-progress-schedule-current");
        if (progressCurrent && totalEl) {
          const match = progressCurrent.style.transform?.match(/scaleX\(([\d\.]+)\)/);
          if (match && video && video.duration) {
            const frac = parseFloat(match[1]);
            input.value = formatTime(frac * video.duration);
            totalEl.textContent = `/ ${formatTime(video.duration)}`;
          }
        }
      }
    }, 250);
  }

  startRpcHeartbeat() {
    if (this._rpcHeartbeat) clearInterval(this._rpcHeartbeat);
    this._rpcHeartbeat = setInterval(() => {
      this.checkInitialAria2();
    }, 3000);
  }

  initDOM() {
    let host = document.getElementById(HOST_ID);
    if (host) {
      host.remove();
    }
    host = document.createElement("div");
    host.id = HOST_ID;
    const parent = document.body || document.documentElement;
    if (parent) {
      parent.appendChild(host);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (!document.getElementById(HOST_ID)) {
          (document.body || document.documentElement).appendChild(host);
        }
      });
    }

    const shadow = host.attachShadow({ mode: "open" });
    const currentLang = getActiveLanguage();
    T = I18N[currentLang];

    shadow.innerHTML = `
      <style>${STYLES}</style>
      <div id="container">
        <!-- Collapsed Floating Button (Bottom-Right) -->
        <button id="toggle-btn" title="${T.appBtn}">
          <span class="btn-text">${T.appBtn}</span>
        </button>

        <!-- Expanded Bottom Panel (Height 390px) -->
        <div id="panel">
          <!-- Left Side: DeepSeek Maid Character (Shifted Left, No White Pillar) -->
          <div id="character-container">
            <div id="character-img" style="background-image: url('${this.internals.characterUrl}');"></div>
          </div>

          <!-- Right Side: Clean UI Controls Area (No elements on the left!) -->
          <div id="panel-content">
            <!-- Top Bar: Title, Quality Badge, Settings & Close Button -->
            <div class="panel-header">
              <div class="title-area">
                <span class="quality-badge" id="badge-quality">${T.qualityParsing}</span>
                <span class="video-title" id="display-title">${T.qualityWait}</span>
              </div>
              <div class="header-actions">
                <select id="header-lang-select" class="header-lang-select" title="介面語言 / Language">
                  <option value="auto" ${!localStorage.getItem("bili_downloader_lang") ? "selected" : ""}>🌐 自動 (Auto)</option>
                  <option value="zh-TW" ${localStorage.getItem("bili_downloader_lang") === "zh-TW" ? "selected" : ""}>繁體中文</option>
                  <option value="zh-CN" ${localStorage.getItem("bili_downloader_lang") === "zh-CN" ? "selected" : ""}>简体中文</option>
                  <option value="en" ${localStorage.getItem("bili_downloader_lang") === "en" ? "selected" : ""}>English</option>
                </select>
                <button class="icon-btn" id="btn-toggle-settings" title="${T.rpcSettings}">
                  <span class="status-dot" id="header-status-dot"></span>
                  <span>${T.rpcSettings}</span>
                </button>
                <button class="btn-close" id="btn-close-panel">${T.collapse}</button>
              </div>
            </div>

            <!-- Collapsible Settings Drawer -->
            <div class="settings-drawer" id="settings-drawer">
              <div class="setting-item">
                <span style="color: #61666d;">${T.rpcEndpoint}</span>
                <input type="text" id="rpc-host-input" class="setting-input" style="width: 140px;" placeholder="http://localhost" />
                <span style="color: #61666d; font-weight: bold; margin: 0 -2px;">:</span>
                <input type="number" id="rpc-port-input" class="setting-input" style="width: 72px; text-align: center; font-weight: 600;" placeholder="16800" title="在此直接修改端口 (如 16800 或 6800)" />
                <span style="color: #61666d; font-size: 11px;">/jsonrpc</span>
                <button class="btn-pill primary" id="btn-test-rpc" style="margin-left: 6px;">${T.testConn}</button>
              </div>
              <div class="setting-item" style="margin-top: 8px;">
                <span style="color: #61666d;">${T.saveDir}</span>
                <input type="text" id="rpc-dir-input" class="setting-input" style="width: 200px;" value="${Settings.rpcDir}" placeholder="${T.saveDirPlaceholder}" />
                <span style="color: #61666d; margin-left: 12px;">${T.rpcSecret}</span>
                <input type="password" id="rpc-token-input" class="setting-input" style="width: 140px;" value="${Settings.rpcToken}" placeholder="${T.tokenPlaceholder}" />
              </div>
              <div class="setting-item" style="margin-top: 8px;">
                <span style="color: #61666d;">${T.cdnModeLabel}</span>
                <select id="cdn-mode-select" class="setting-input" style="flex: 1; max-width: 320px; font-weight: 500; cursor: pointer;">
                  <option value="auto" ${Settings.cdnMode === "auto" ? "selected" : ""}>${T.cdnAuto}</option>
                  <option value="overseas" ${Settings.cdnMode === "overseas" ? "selected" : ""}>${T.cdnOverseas}</option>
                  <option value="mainland" ${Settings.cdnMode === "mainland" ? "selected" : ""}>${T.cdnMainland}</option>
                </select>
              </div>
            </div>

            <!-- Main Workspace: Center Column (Sizes + Subtitles) + Right Column (Compact Buttons) -->
            <div class="workspace-layout">
              <!-- Center Column: Stacked Specs, Dropdown & Subtitles -->
              <div class="center-column">
                <div class="center-header">
                  <div class="dropdown-group">
                    <label class="dropdown-label" for="stream-dropdown">${T.downloadTarget}</label>
                    <select id="stream-dropdown" class="stream-dropdown">
                      <option value="dual" selected>${T.dualTrack}</option>
                      <option value="video">${T.videoOnly}</option>
                      <option value="audio">${T.audioOnly}</option>
                      <option value="cover">${T.coverOnly || "🖼️ 僅影片封面 (無壓縮原圖)"}</option>
                    </select>
                  </div>
                  <span style="font-size: 11px; color: #9499a0;">${T.autoBest}</span>
                </div>

                <!-- Specs Stacked Vertically -->
                <div class="specs-vertical-list">
                  <!-- Video Row -->
                  <div class="spec-row-item">
                    <div class="spec-row-left">
                      <span>🎬</span>
                      <span id="spec-video-label">${T.videoTrack}</span>
                      <span id="spec-video-codec" style="color: #9499a0; font-size: 11px; margin-left: 4px;">H.264/AVC</span>
                    </div>
                    <span class="spec-val" id="spec-video-size">-- MB</span>
                  </div>

                  <!-- Audio Row -->
                  <div class="spec-row-item">
                    <div class="spec-row-left">
                      <span>🎵</span>
                      <span id="spec-audio-label">${T.audioTrack}</span>
                      <span style="color: #9499a0; font-size: 11px; margin-left: 4px;">M4A / AAC</span>
                    </div>
                    <span class="spec-val" id="spec-audio-size">-- MB</span>
                  </div>

                  <!-- Cover Row -->
                  <div class="spec-row-item" id="spec-cover-item">
                    <div class="spec-row-left">
                      <span>🖼️</span>
                      <span id="spec-cover-label">${T.coverTrack || "影片封面"}</span>
                      <span style="color: #9499a0; font-size: 11px; margin-left: 4px;">JPG / PNG (無壓縮原圖)</span>
                    </div>
                    <button class="sub-pill-btn" id="btn-center-cover" title="下載高解析度無壓縮封面原圖" style="height: 30px; padding: 4px 14px; font-size: 13px; font-weight: 600;">
                      <span>${T.btnDownloadCover || "下載封面"}</span>
                    </button>
                  </div>

                  <!-- Frame Screenshot Row (Moved up with cover, real-time progress sync & editable time) -->
                  <div class="spec-row-item" id="spec-frame-item">
                    <div class="spec-row-left">
                      <span>📸</span>
                      <span id="spec-frame-label">${T.frameTrack || "影片幀截圖"}</span>
                      <div class="frame-time-wrapper" title="即時同步播放進度，亦可手動輸入時間 (如 01:23 或 83 秒) 截取指定影格">
                        <input type="text" id="frame-time-input" class="frame-time-input" value="00:00" />
                        <span id="frame-time-total" class="frame-time-total">/ 00:00</span>
                      </div>
                    </div>
                    <button class="sub-pill-btn" id="btn-capture-frame" title="下載 1:1 原生解析度截圖 (無浮水印/無播放圖示)" style="height: 30px; padding: 4px 14px; font-size: 13px; font-weight: 600;">
                      <span>${T.btnCaptureFrame || "截取影格"}</span>
                    </button>
                  </div>
                </div>

                <!-- Subtitles Section (No emojis) -->
                <div class="subtitles-section">
                  <div class="subtitles-left">
                    <span class="subtitles-label">${T.subTitle}：</span>
                    <select id="sub-lang-select" class="sub-lang-select" title="${T.subSelectPrompt}">
                      <option value="">${T.subLoading}</option>
                    </select>
                  </div>
                  <div class="subtitles-pills">
                    <button class="sub-pill-btn" id="btn-sub-srt" title="下載 SRT 格式字幕"><span>${T.subBtnSrt || "下載 SRT"}</span></button>
                    <button class="sub-pill-btn" id="btn-sub-ass" title="下載 ASS 特效字幕 (支援 PotPlayer/VLC)"><span>${T.subBtnAss || "下載 ASS"}</span></button>
                    <button class="sub-pill-btn" id="btn-sub-json" title="下載原始 JSON 格式"><span>${T.subBtnJson || "下載 JSON"}</span></button>
                    <button class="sub-pill-btn" id="btn-sub-txt" title="下載純文字逐字稿"><span>${T.subBtnTxt || "下載 TXT"}</span></button>
                  </div>
                </div>

                <!-- Danmaku Section (Placed symmetrically below subtitles, no emojis, explicit 下載) -->
                <div class="danmaku-section">
                  <div class="danmaku-left">
                    <span class="danmaku-label">${T.danmakuTitle || "彈幕下載"}：</span>
                    <span class="danmaku-desc">相容 PotPlayer / VLC / mpv 本機播放器</span>
                  </div>
                  <div class="danmaku-pills">
                    <button class="sub-pill-btn" id="btn-danmaku-ass-pill" title="將彈幕轉換為 ASS 格式下載 (支援本機播放器)"><span>${T.danmakuBtnAss || "下載 ASS 彈幕"}</span></button>
                    <button class="sub-pill-btn" id="btn-danmaku-xml-pill" title="下載原始 XML 彈幕檔案"><span>${T.danmakuBtnXml || "下載 XML 彈幕"}</span></button>
                  </div>
                </div>
              </div>

              <!-- Right Column: Download Buttons (Compact, not stretched!) -->
              <div class="right-column">
                <button class="btn-action-side btn-rpc-side" id="btn-rpc-action">
                  <span id="rpc-btn-text">${T.btnRpc}</span>
                </button>
                <button class="btn-action-side btn-browser-side" id="btn-browser-action">
                  <span>${T.btnBrowser}</span>
                </button>
                <div class="browser-warning-card" id="browser-warning-card">
                  <div class="warning-title">
                    <span>${T.browserDlWarningHeader}</span>
                  </div>
                  <div class="warning-desc">
                    ${T.browserDlWarningText}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        <!-- Toast -->
        <div id="toast" class="toast"></div>
      </div>
    `;

    this.shadow = shadow;
    if (Settings.isExpanded) {
      this.openPanel();
    }
  }

  showToast(msg, duration = 3000) {
    const toast = this.shadow?.getElementById("toast");
    if (!toast) return;
    let text = typeof msg === "function" ? msg() : msg;
    if (!text || String(text).trim() === "") return;
    toast.textContent = String(text);
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  async checkInitialAria2() {
    const dot = this.shadow?.getElementById("header-status-dot");
    const pill = this.shadow?.getElementById("footer-status-pill");
    const text = this.shadow?.getElementById("footer-status-text");

    const tokenInput = this.shadow?.getElementById("rpc-token-input");
    const token = (tokenInput && tokenInput.value !== undefined && tokenInput.value.trim() !== "")
      ? tokenInput.value.trim()
      : Settings.rpcToken;

    const hostInput = this.shadow?.getElementById("rpc-host-input");
    const portInput = this.shadow?.getElementById("rpc-port-input");
    let rpcUrl = Settings.rpcUrl;
    if (hostInput && portInput) {
      const h = hostInput.value.trim() || "http://localhost";
      const p = portInput.value.trim() || "16800";
      rpcUrl = `${h}:${p}/jsonrpc`;
    }

    try {
      const res = await Aria2RPC.testConnection(rpcUrl, token);
      if (res.ok) {
        if (dot) dot.className = "status-dot connected";
        if (pill) pill.className = "footer-status-pill connected";
        if (text) text.textContent = T.rpcConnected(res.version);

        // Check if Aria2 / Motrix is ACTUALLY downloading this current video right now
        if (this.streamData && !this.isRpcPushing) {
          try {
            const activeTasks = await Aria2RPC.tellActive(rpcUrl, token);
            const rpcBtn = this.shadow?.getElementById("btn-rpc-action");
            const safeTitle = this.streamData.title || "";
            const isCurrentlyDownloading = activeTasks.some((task) => {
              return task.files?.some((f) => f.path && f.path.includes(safeTitle));
            });

            if (isCurrentlyDownloading) {
              setBtnDownloadingAnimation(rpcBtn, true);
            } else if (rpcBtn && !this.isRpcPushing) {
              setBtnDownloadingAnimation(rpcBtn, false, T.btnRpc);
            }
          } catch (tErr) {}
        }
      } else {
        if (dot) dot.className = "status-dot";
        if (pill) pill.className = "footer-status-pill disconnected";
        if (text) text.textContent = T.rpcDisconnected;
      }
    } catch (e) {
      if (dot) dot.className = "status-dot";
      if (pill) pill.className = "footer-status-pill disconnected";
      if (text) text.textContent = T.rpcDisconnected;
    }
  }

  openPanel() {
    const panel = this.shadow?.getElementById("panel");
    const toggleBtn = this.shadow?.getElementById("toggle-btn");
    if (panel) panel.classList.add("show");
    if (toggleBtn) toggleBtn.style.display = "none";
    Settings.isExpanded = true;
    this.checkInitialAria2();
  }

  closePanel() {
    const panel = this.shadow.getElementById("panel");
    const toggleBtn = this.shadow.getElementById("toggle-btn");
    const panelContent = this.shadow.getElementById("panel-content");
    const settingsDrawer = this.shadow.getElementById("settings-drawer");
    panel.classList.remove("show");
    toggleBtn.style.display = "flex";
    if (settingsDrawer) settingsDrawer.classList.remove("show");
    if (panelContent) {
      panelContent.classList.remove("can-scroll");
      panelContent.scrollTop = 0;
    }
    Settings.isExpanded = false;
  }

  bindEvents() {
    const shadow = this.shadow;

    // Toggle button & Close button
    shadow.getElementById("toggle-btn")?.addEventListener("click", () => this.openPanel());
    shadow.getElementById("btn-close-panel")?.addEventListener("click", () => this.closePanel());

    // Settings drawer toggle (Only enable scrolling when drawer is open)
    const settingsDrawer = shadow.getElementById("settings-drawer");
    const panelContent = shadow.getElementById("panel-content");
    shadow.getElementById("btn-toggle-settings")?.addEventListener("click", () => {
      const isOpening = !settingsDrawer.classList.contains("show");
      settingsDrawer.classList.toggle("show");
      if (panelContent) {
        if (isOpening) {
          panelContent.classList.add("can-scroll");
        } else {
          panelContent.classList.remove("can-scroll");
          panelContent.scrollTop = 0;
        }
      }
    });

    // Language Select in Header
    const langSelect = shadow.getElementById("header-lang-select");
    if (langSelect) {
      langSelect.addEventListener("change", () => {
        const val = langSelect.value;
        if (val === "auto") {
          localStorage.removeItem("bili_downloader_lang");
        } else {
          localStorage.setItem("bili_downloader_lang", val);
        }
        T = I18N[getActiveLanguage()];
        this.initDOM();
        this.bindEvents();
        this.parseCurrentVideo();
        this.checkInitialAria2();
      });
    }

    // RPC Host and Port separate inputs
    const hostInput = shadow.getElementById("rpc-host-input");
    const portInput = shadow.getElementById("rpc-port-input");

    const parts = parseRpcParts(Settings.rpcUrl);
    if (hostInput) hostInput.value = parts.host;
    if (portInput) portInput.value = parts.port;

    const syncRpcUrl = () => {
      const h = hostInput.value.trim() || "http://localhost";
      const p = portInput.value.trim() || "16800";
      Settings.rpcUrl = `${h}:${p}/jsonrpc`;
      this.checkInitialAria2();
    };

    if (hostInput) { hostInput.addEventListener("input", syncRpcUrl); hostInput.addEventListener("change", syncRpcUrl); }
    if (portInput) {
      portInput.addEventListener("change", syncRpcUrl);
      portInput.addEventListener("input", syncRpcUrl);
    }

    shadow.getElementById("btn-test-rpc")?.addEventListener("click", async () => {
      syncRpcUrl();
      const res = await Aria2RPC.testConnection();
      if (res.ok) {
        this.showToast(`🟢 連線成功！版本: ${res.version}`);
      } else {
        this.showToast(`🔴 連線失敗: ${res.error}`);
      }
      this.checkInitialAria2();
    });

    const tokenInput = shadow.getElementById("rpc-token-input");
    tokenInput.addEventListener("input", () => {
      Settings.rpcToken = tokenInput.value;
      this.checkInitialAria2();
    });

    const dirInput = shadow.getElementById("rpc-dir-input");
    dirInput.addEventListener("change", () => {
      Settings.rpcDir = dirInput.value;
      this.showToast(`儲存目錄已設定為: ${dirInput.value}`);
    });

    const cdnSelect = shadow.getElementById("cdn-mode-select");
    if (cdnSelect) {
      cdnSelect.addEventListener("change", () => {
        Settings.cdnMode = cdnSelect.value;
        const optText = cdnSelect.options[cdnSelect.selectedIndex]?.text || cdnSelect.value;
        this.showToast(`CDN 路線已切換為: ${optText}`);
        this.parseCurrentVideo();
      });
    }

    // Dropdown change listener
    const dropdown = shadow.getElementById("stream-dropdown");

    // Action Button 1: Push to RPC with 0-3 cycling dots animation
    shadow.getElementById("btn-rpc-action")?.addEventListener("click", async () => {
      if (!this.streamData || this.isRpcPushing) return;
      const { title, qualityName, vUrl, aUrl } = this.streamData;
      const mode = dropdown.value;
      const btn = shadow.getElementById("btn-rpc-action");

      this.isRpcPushing = true;
      setBtnDownloadingAnimation(btn, true);

      try {
        if (mode === "dual") {
          this.showToast(T.toastPushDual);
          const vFilename = `${title}_[${qualityName}]_video.mp4`;
          const aFilename = `${title}_[${qualityName}]_audio.m4a`;

          const vUrls = (this.streamData.vBackupUrls && this.streamData.vBackupUrls.length) ? this.streamData.vBackupUrls : [vUrl];
          const aUrls = (this.streamData.aBackupUrls && this.streamData.aBackupUrls.length) ? this.streamData.aBackupUrls : (aUrl ? [aUrl] : []);

          await Aria2RPC.addUri({ urls: vUrls, filename: vFilename });
          if (aUrls.length > 0) {
            await Aria2RPC.addUri({ urls: aUrls, filename: aFilename });
          }
        } else if (mode === "video") {
          this.showToast(T.toastPushVideo);
          const vUrls = (this.streamData.vBackupUrls && this.streamData.vBackupUrls.length) ? this.streamData.vBackupUrls : [vUrl];
          await Aria2RPC.addUri({ urls: vUrls, filename: `${title}_[${qualityName}]_video.mp4` });
        } else if (mode === "audio") {
          if (!aUrl) {
            this.showToast("無獨立音訊流");
            this.isRpcPushing = false;
            if (btn) { btn.disabled = false; btn.innerHTML = `<span>${T.btnRpc}</span>`; }
            return;
          }
          this.showToast(T.toastPushAudio);
          const aUrls = (this.streamData.aBackupUrls && this.streamData.aBackupUrls.length) ? this.streamData.aBackupUrls : [aUrl];
          await Aria2RPC.addUri({ urls: aUrls, filename: `${title}_[${qualityName}]_audio.m4a` });
        } else if (mode === "cover") {
          const picUrl = this.streamData?.coverUrl || this.cachedPic || getPageCoverUrl();
          if (!picUrl) {
            this.showToast("未找到封面圖網址");
            this.isRpcPushing = false;
            if (btn) { btn.disabled = false; btn.innerHTML = `<span>${T.btnRpc}</span>`; }
            return;
          }
          const rawUrl = picUrl.replace(/@.*$/, "");
          const ext = rawUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || "jpg";
          await Aria2RPC.addUri({ url: rawUrl, filename: `${title}_封面.${ext}` });
          this.showToast("🚀 正在推送封面下載至 RPC...");
        }

      } catch (err) {
        this.showToast(T.toastPushFail(err.message));
        setBtnDownloadingAnimation(btn, false, T.btnRpc);
      } finally {
        this.isRpcPushing = false;
        setTimeout(() => {
          if (this.shadow) this.checkInitialAria2();
        }, 1000);
      }
    });

    // Action Button 2: Browser Download (Disabled only WHILE DOWNLOADING)
    shadow.getElementById("btn-browser-action")?.addEventListener("click", async (e) => {
      if (!this.streamData || this.isBrowserDownloading) return;
      const { title, qualityName, vUrl, aUrl } = this.streamData;
      const mode = dropdown.value;
      const btn = e.currentTarget;
      const origText = `<span>${T.btnBrowser}</span>`;

      this.isBrowserDownloading = true;
      btn.disabled = true;

      if (mode === "dual") {
        this.showToast(T.toastBrowserStart);
        btn.disabled = true;
        try {
          let vRec = 0, vTot = 0, aRec = 0, aTot = 0;
          const updateProgress = () => {
            const tot = vTot + aTot;
            const rec = vRec + aRec;
            if (tot > 0) {
              const pct = Math.min(99, Math.round((rec / tot) * 100));
              btn.innerHTML = `<span>⏳</span> 下載雙軌 (${pct}%)...`;
            } else {
              btn.innerHTML = `<span>⏳</span> 下載雙軌數據...`;
            }
          };

          const vUrls = (this.streamData.vBackupUrls && this.streamData.vBackupUrls.length) ? this.streamData.vBackupUrls : [vUrl];
          const aUrls = (this.streamData.aBackupUrls && this.streamData.aBackupUrls.length) ? this.streamData.aBackupUrls : (aUrl ? [aUrl] : []);

          logMsg("開始下載視訊串流...");
          const vPromise = fetchBufferWithProgress(vUrls, (rec, tot) => {
            vRec = rec; vTot = tot;
            updateProgress();
          });

          let aPromise = null;
          if (aUrl) {
            logMsg("開始下載音訊串流...");
            aPromise = fetchBufferWithProgress(aUrls, (rec, tot) => {
              aRec = rec; aTot = tot;
              updateProgress();
            });
          }

          const [vBuf, aBuf] = await Promise.all([vPromise, aPromise || Promise.resolve(null)]);

          let finalBlob = null;
          if (aBuf) {
            btn.innerHTML = `<span>⚙️</span> 合成 MP4 中...`;
            this.showToast(T.toastMerging);
            const { baseUrl } = this.internals;
            const mergedBuf = await mergeTracksToMp4(baseUrl, aBuf, vBuf, (msg) => {
              logMsg(msg);
            });
            finalBlob = new Blob([mergedBuf], { type: "video/mp4" });
          } else {
            finalBlob = new Blob([vBuf], { type: "video/mp4" });
          }

          const filename = `${title}.mp4`;
          triggerFileDownload(finalBlob, filename);
          this.showToast(T.toastMergeDone);

          btn.innerHTML = `<span>✅ 下載完成！</span>`;
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = origText;
            btn.style.opacity = "1";
            this.isBrowserDownloading = false;
          }, 2000);
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = origText;
          btn.style.opacity = "1";
          this.isBrowserDownloading = false;
          this.showToast(T.toastBrowserFail(err.message));
        }
      } else if (mode === "video") {
        this.showToast(T.toastBrowserStart);
        const vUrls = (this.streamData.vBackupUrls && this.streamData.vBackupUrls.length) ? this.streamData.vBackupUrls : [vUrl];
        await downloadInBrowser({
          urls: vUrls,
          filename: `${title}_[${qualityName}]_video.mp4`,
          btnEl: btn
        });
        this.showToast(T.toastBrowserDone);
      } else if (mode === "audio") {
        if (!aUrl) {
          this.showToast(T.noAudio);
          return;
        }
        this.showToast(T.toastBrowserStart);
        const aUrls = (this.streamData.aBackupUrls && this.streamData.aBackupUrls.length) ? this.streamData.aBackupUrls : [aUrl];
        await downloadInBrowser({
          urls: aUrls,
          filename: `${title}_[${qualityName}]_audio.m4a`,
          btnEl: btn
        });
        this.showToast(T.toastBrowserDone);
      } else if (mode === "cover") {
        this.downloadCover();
      }
    });

    shadow.getElementById("btn-center-cover")?.addEventListener("click", () => {
      this.downloadCover();
    });

    shadow.getElementById("btn-capture-frame")?.addEventListener("click", () => {
      this.captureVideoFrame();
    });

    const timeInput = shadow.getElementById("frame-time-input");
    if (timeInput) {
      timeInput.addEventListener("change", () => {
        const sec = parseTimeToSeconds(timeInput.value);
        const video = document.querySelector("#bilibili-player video, .bpx-player-video-wrap video");
        if (!isNaN(sec) && video) {
          video.currentTime = Math.max(0, Math.min(sec, video.duration || sec));
          this.showToast(`已跳轉至: ${formatTime(video.currentTime)}`);
        }
      });
      timeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          timeInput.blur();
        }
      });
    }

    shadow.getElementById("btn-danmaku-ass-pill")?.addEventListener("click", () => {
      this.downloadDanmakuAss();
    });
    shadow.getElementById("btn-danmaku-xml-pill")?.addEventListener("click", () => {
      this.downloadDanmakuXml();
    });
    shadow.getElementById("btn-danmaku-ass")?.addEventListener("click", () => {
      this.downloadDanmakuAss();
    });
    shadow.getElementById("btn-danmaku-xml")?.addEventListener("click", () => {
      this.downloadDanmakuXml();
    });

    // ==========================================
    // ACGHelper Style: 4-Format Subtitle Download (SRT / ASS / JSON / TXT)
    // ==========================================
    const setupSubHandlers = () => {
      const select = shadow.getElementById("sub-lang-select");
      const btnSrt = shadow.getElementById("btn-sub-srt");
      const btnAss = shadow.getElementById("btn-sub-ass");
      const btnJson = shadow.getElementById("btn-sub-json");
      const btnTxt = shadow.getElementById("btn-sub-txt");

      const getSelectedSubItem = async () => {
        if (!this.subtitleList || this.subtitleList.length === 0) {
          throw new Error(T.noSubtitle);
        }
        const val = select ? parseInt(select.value, 10) : 0;
        const subObj = this.subtitleList[isNaN(val) ? 0 : val] || this.subtitleList[0];
        let subUrl = subObj.subtitle_url || subObj.url;
        if (!subUrl) throw new Error("無效的字幕鏈接");
        if (subUrl.startsWith("//")) subUrl = "https:" + subUrl;

        logMsg(`正在拉取字幕: ${subUrl}`);
        const res = await fetch(subUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.body || [];
        return { items, subObj };
      };

      btnSrt.addEventListener("click", async () => {
        try {
          const { items, subObj } = await getSelectedSubItem();
          const srtText = subToSrt(items);
          const langDoc = (subObj.lan_doc || subObj.lan || "中文").replace(/（自动生成）|\(自动生成\)|（AI生成）|\(AI\)/gi, "").trim();
          const isAI = subObj.lan?.startsWith("ai-") || subObj.ai_status > 0 || /自动|AI/i.test(subObj.lan_doc || "");
          const suffix = isAI ? `_${langDoc}(AI)` : `_${langDoc}`;
          triggerFileDownload(srtText, `${this.streamData?.title || "video"}${suffix}.srt`);
          this.showToast(T.toastSubDone("SRT", langDoc));
        } catch (e) {
          this.showToast(`⚠️ ${e.message}`);
        }
      });

      btnAss.addEventListener("click", async () => {
        try {
          const { items, subObj } = await getSelectedSubItem();
          const assText = subToAss(items, this.streamData?.title);
          const langDoc = (subObj.lan_doc || subObj.lan || "中文").replace(/（自动生成）|\(自动生成\)|（AI生成）|\(AI\)/gi, "").trim();
          const isAI = subObj.lan?.startsWith("ai-") || subObj.ai_status > 0 || /自动|AI/i.test(subObj.lan_doc || "");
          const suffix = isAI ? `_${langDoc}(AI)` : `_${langDoc}`;
          triggerFileDownload(assText, `${this.streamData?.title || "video"}${suffix}.ass`);
          this.showToast(T.toastSubDone("ASS", langDoc));
        } catch (e) {
          this.showToast(`⚠️ ${e.message}`);
        }
      });

      btnJson.addEventListener("click", async () => {
        try {
          const { items, subObj } = await getSelectedSubItem();
          const jsonText = JSON.stringify({ body: items }, null, 2);
          const langDoc = (subObj.lan_doc || subObj.lan || "中文").replace(/（自动生成）|\(自动生成\)|（AI生成）|\(AI\)/gi, "").trim();
          const isAI = subObj.lan?.startsWith("ai-") || subObj.ai_status > 0 || /自动|AI/i.test(subObj.lan_doc || "");
          const suffix = isAI ? `_${langDoc}(AI)` : `_${langDoc}`;
          triggerFileDownload(jsonText, `${this.streamData?.title || "video"}${suffix}.json`, "application/json");
          this.showToast(T.toastSubDone("JSON", langDoc));
        } catch (e) {
          this.showToast(`⚠️ ${e.message}`);
        }
      });

      btnTxt.addEventListener("click", async () => {
        try {
          const { items, subObj } = await getSelectedSubItem();
          const txtText = items.map((i) => i.content).join("\n");
          const langDoc = (subObj.lan_doc || subObj.lan || "中文").replace(/（自动生成）|\(自动生成\)|（AI生成）|\(AI\)/gi, "").trim();
          const isAI = subObj.lan?.startsWith("ai-") || subObj.ai_status > 0 || /自动|AI/i.test(subObj.lan_doc || "");
          const suffix = isAI ? `_${langDoc}(AI)` : `_${langDoc}`;
          triggerFileDownload(txtText, `${this.streamData?.title || "video"}${suffix}_文稿.txt`);
          this.showToast(T.toastSubDone("TXT", langDoc));
        } catch (e) {
          this.showToast(`⚠️ ${e.message}`);
        }
      });
    };
    setupSubHandlers();

    // Footer tools: Copy clean direct download links (100% safe URLs, no scary terminal commands)
    shadow.getElementById("btn-copy-links")?.addEventListener("click", () => {
      if (!this.streamData) return;
      const { title, vUrl, aUrl } = this.streamData;
      let urlsText = `視訊直鏈:\n${vUrl}\n`;
      if (aUrl) {
        urlsText += `\n音訊直鏈:\n${aUrl}\n`;
      }
      navigator.clipboard.writeText(urlsText);
      this.showToast(typeof T.toastCopyLink === "function" ? T.toastCopyLink("") : "下載直鏈已複製到剪貼簿！");
    });


  }


  // Capture native video frame with real-time or custom timestamp
  captureVideoFrame() {
    const video = document.querySelector("#bilibili-player video, .bpx-player-video-wrap video");
    if (!video) {
      this.showToast("未偵測到播放中的視訊組件");
      return;
    }

    const input = this.shadow?.getElementById("frame-time-input");
    const targetSec = input ? parseTimeToSeconds(input.value) : NaN;

    const doCapture = (sec) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            this.showToast("截圖生成失敗");
            return;
          }
          const timeSec = Math.floor(sec >= 0 ? sec : (video.currentTime || 0));
          const suffix = T.screenshotSuffix || "截圖";
          const filename = `${this.streamData?.title || "bilibili"}_${timeSec}s${suffix}.png`;
          triggerFileDownload(blob, filename, "image/png");
          this.showToast(`截圖成功！(${formatTime(timeSec)} 原畫 ${canvas.width}x${canvas.height})`);
        }, "image/png");
      } catch (err) {
        this.showToast(`截圖失敗: ${err.message}`);
      }
    };

    if (!isNaN(targetSec) && Math.abs((video.currentTime || 0) - targetSec) > 0.5) {
      video.currentTime = Math.max(0, Math.min(targetSec, video.duration || targetSec));
      video.addEventListener("seeked", () => doCapture(targetSec), { once: true });
      setTimeout(() => doCapture(targetSec), 200);
    } else {
      doCapture(video.currentTime || 0);
    }
  }

  // Download raw uncompressed cover directly to disk (never open in new tab)
  async downloadCover() {
    let picUrl = this.streamData?.coverUrl || this.cachedPic;
    if (!picUrl) {
      picUrl = getPageCoverUrl();
    }
    if (!picUrl) {
      this.showToast("未找到封面圖網址");
      return;
    }
    const rawUrl = picUrl.replace(/@.*$/, "").replace(/^http:/, "https:");
    const ext = rawUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || "jpg";
    const title = this.streamData?.title || this.cachedTitle || "video";
    const filename = `${title}_封面.${ext}`;
    this.showToast("正在下載高解析度封面...");

    try {
      // 1. Fetch image directly as Blob to guarantee direct download without opening cross-origin URL
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      triggerFileDownload(blob, filename, blob.type || "image/jpeg");
      this.showToast(T.toastCoverDone || "封面下載完成！");
    } catch (e) {
      // 2. If CORS fetch is blocked, proxy through background service worker's chrome.downloads API
      try {
        await downloadFileViaExtension(rawUrl, filename);
        this.showToast(T.toastCoverDone || "封面下載完成！");
      } catch (err) {
        this.showToast(`封面下載失敗: ${err.message}`);
      }
    }
  }

  // Download BiliASS Danmaku
  async downloadDanmakuAss() {
    const cid = this.streamData?.cid;
    if (!cid) {
      this.showToast("未取得影片 CID，無法下載彈幕");
      return;
    }
    this.showToast("正在拉取並轉換 BiliASS 格式字幕...");
    try {
      const res = await fetch(`https://comment.bilibili.com/${cid}.xml`);
      const xmlText = await res.text();
      const assText = convertXmlToAss(xmlText, this.streamData?.title || "Bilibili Danmaku");
      const filename = `${this.streamData?.title || "bilibili"}_彈幕.ass`;
      triggerFileDownload(assText, filename, "text/plain;charset=utf-8");
      this.showToast("💬 ASS 彈幕下載完成 (支援 PotPlayer/VLC)！");
    } catch (err) {
      this.showToast(`彈幕獲取失敗: ${err.message}`);
    }
  }

  // Download XML Danmaku
  async downloadDanmakuXml() {
    const cid = this.streamData?.cid;
    if (!cid) {
      this.showToast("未取得影片 CID");
      return;
    }
    try {
      const res = await fetch(`https://comment.bilibili.com/${cid}.xml`);
      const xmlText = await res.text();
      const filename = `${this.streamData?.title || "bilibili"}_彈幕.xml`;
      triggerFileDownload(xmlText, filename, "application/xml;charset=utf-8");
      this.showToast("📄 原生 XML 彈幕下載完成！");
    } catch (err) {
      this.showToast(`彈幕獲取失敗: ${err.message}`);
    }
  }

  // Extract initial state or window hydrate data
  async extractInitialState() {
    if (window.__PLAYURL_HYDRATE_DATA__) {
      return { code: 0, data: window.__PLAYURL_HYDRATE_DATA__ };
    }
    if (window.__INITIAL_STATE__) {
      return { code: 0, data: window.__INITIAL_STATE__ };
    }
    try {
      const html = await (await fetch(window.location.href, FETCH_OPTS)).text();
      const match1 = html.match(/<script>window\.__INITIAL_STATE__=(.+?)<\/script>/);
      if (match1 && match1[1]) {
        const clean = match1[1].replace(/;\(function\(\).+$/, "");
        return { code: 0, data: JSON.parse(clean) };
      }
      const match2 = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
      if (match2 && match2[1]) {
        const nextData = JSON.parse(match2[1]);
        const state = nextData.props?.pageProps?.dehydratedState?.queries?.[0]?.state;
        if (state) return { code: 0, data: state };
      }
    } catch (e) {
      logMsg("獲取頁面初始狀態失敗", e);
    }
    return { code: -1, message: "無法讀取視訊初始資訊" };
  }

  // Detect current player quality setting
  getCurrentQuality() {
    try {
      if (localStorage.bilibili_player_settings) {
        const settings = JSON.parse(localStorage.bilibili_player_settings);
        if (settings?.setting_config?.defquality) {
          return settings.setting_config.defquality;
        }
      }
      const qualityEl = document.querySelector(
        ".squirtle-quality-select-list li.active, .bpx-player-ctrl-quality-menu .bpx-state-active"
      );
      if (qualityEl && qualityEl.dataset.value) {
        return parseInt(qualityEl.dataset.value, 10);
      }
    } catch (e) {}
    return 120;
  }

  // Core Parser
  
  updateFromPlayData(data, fullTitle = "", picUrl = "", cid = null, avid = null) {
    if (!data) return;
    const dash = data.dash;
    const durl = data.durl;
    const qn = this.currentQuality || 120;

    if (!fullTitle && this.cachedTitle) fullTitle = this.cachedTitle;
    if (!picUrl && this.cachedPic) picUrl = this.cachedPic;
    if (!cid && this.cachedCid) cid = this.cachedCid;
    if (!avid && this.cachedAid) avid = this.cachedAid;

    if (dash) {
      const videoStream = dash.video.find((v) => v.id === qn) || dash.video[0];
      const audioStream = dash.audio?.[0];

      const videoSize = videoStream?.bandwidth
        ? Math.round((videoStream.bandwidth * (data.timelength || 60000)) / 8000)
        : 0;
      const audioSize = audioStream?.bandwidth
        ? Math.round((audioStream.bandwidth * (data.timelength || 60000)) / 8000)
        : 0;
      const totalSize = videoSize + audioSize;

      const actualQualityName = localizeQuality(getQualityMap()[videoStream.id] || `${qn}P`);
      const audioQualityName = localizeQuality(getAudioQualityMap()[audioStream?.id] || "132K 高音質");

      const baseV = videoStream.base_url || videoStream.baseUrl;
      const baseA = audioStream ? (audioStream.base_url || audioStream.baseUrl) : null;
      const vBackup = [baseV, ...(videoStream.backup_url || videoStream.backupUrl || [])].filter(Boolean);
      const aBackup = baseA ? [baseA, ...(audioStream.backup_url || audioStream.backupUrl || [])].filter(Boolean) : [];

      const synthV = synthesizeUposUrls(baseV);
      const synthA = baseA ? synthesizeUposUrls(baseA) : [];

      const allV = Array.from(new Set([...vBackup, ...synthV]));
      const allA = Array.from(new Set([...aBackup, ...synthA]));

      this.streamData = {
        title: sanitizeFilename(fullTitle || document.title),
        rawTitle: fullTitle || document.title,
        qualityName: actualQualityName,
        vUrl: allV[0] || baseV,
        vBackupUrls: allV,
        aUrl: allA[0] || baseA,
        aBackupUrls: allA,
        videoSize,
        audioSize,
        totalSize,
        coverUrl: picUrl,
        cid,
        avid
      };

      if (this.shadow) {
        const badge = this.shadow.getElementById("badge-quality");
        if (badge) badge.textContent = actualQualityName;
        const dispTitle = this.shadow.getElementById("display-title");
        if (dispTitle) {
          dispTitle.textContent = fullTitle || document.title;
          dispTitle.title = fullTitle || document.title;
        }
        const specVLabel = this.shadow.getElementById("spec-video-label");
        if (specVLabel) specVLabel.textContent = `${T.videoTrack} (${actualQualityName})`;
        const specVCodec = this.shadow.getElementById("spec-video-codec");
        if (specVCodec) specVCodec.textContent = `${videoStream.codecs || "H.264/AVC"}`;
        const specVSize = this.shadow.getElementById("spec-video-size");
        if (specVSize) specVSize.textContent = formatSize(videoSize);

        const specALabel = this.shadow.getElementById("spec-audio-label");
        if (specALabel) specALabel.textContent = `${T.audioTrack} (${audioQualityName})`;
        const specASize = this.shadow.getElementById("spec-audio-size");
        if (specASize) specASize.textContent = formatSize(audioSize);

        const calcSize = this.shadow.getElementById("calc-total-size");
        if (calcSize) calcSize.textContent = formatSize(totalSize);

        const warnCard = this.shadow.getElementById("browser-warning-card");
        if (warnCard) {
          if (totalSize >= 1.8 * 1024 * 1024 * 1024) {
            warnCard.classList.add("highlight-oom");
          } else {
            warnCard.classList.remove("highlight-oom");
          }
        }
      }
    } else if (durl && durl[0]) {
      const part = durl[0];
      const partSize = part.size || 0;
      const actualQualityName = localizeQuality(getQualityMap()[qn] || "1080P 高畫質");

      this.streamData = {
        title: sanitizeFilename(fullTitle || document.title),
        rawTitle: fullTitle || document.title,
        qualityName: actualQualityName,
        vUrl: part.url,
        aUrl: null,
        videoSize: partSize,
        audioSize: 0,
        totalSize: partSize,
        coverUrl: picUrl,
        cid,
        avid
      };

      if (this.shadow) {
        const badge = this.shadow.getElementById("badge-quality");
        if (badge) badge.textContent = actualQualityName;
        const dispTitle = this.shadow.getElementById("display-title");
        if (dispTitle) {
          dispTitle.textContent = fullTitle || document.title;
          dispTitle.title = fullTitle || document.title;
        }
        const specVLabel = this.shadow.getElementById("spec-video-label");
        if (specVLabel) specVLabel.textContent = `${T.videoTrack} (${actualQualityName})`;
        const specVSize = this.shadow.getElementById("spec-video-size");
        if (specVSize) specVSize.textContent = formatSize(partSize);
        const specALabel = this.shadow.getElementById("spec-audio-label");
        if (specALabel) specALabel.textContent = T.noAudio;
        const specASize = this.shadow.getElementById("spec-audio-size");
        if (specASize) specASize.textContent = "--";
        const calcSize = this.shadow.getElementById("calc-total-size");
        if (calcSize) calcSize.textContent = formatSize(partSize);
      }
    }
  }

async parseCurrentVideo() {
    if (!isWatchPage()) return;

    const qn = this.getCurrentQuality();
    this.currentQuality = qn;

    // 1. Resolve current active BVID and Page from URL
    const bvidMatch = location.pathname.match(/(BV[a-zA-Z0-9]{10})/i);
    const currentBvid = bvidMatch ? bvidMatch[1] : (window.bvid || "");
    const pageMatch = location.search.match(/p=(\d+)/);
    const currentP = pageMatch ? parseInt(pageMatch[1], 10) : 1;

    let avid = window.aid || null;
    let cid = window.cid || null;
    let fullTitle = "";
    let picUrl = getPageCoverUrl();

    // Fast title from DOM
    const titleEl = document.querySelector("h1.video-title, .video-info-title-inner, .video-title, #viewbox_report .tit");
    if (titleEl && titleEl.textContent) {
      fullTitle = titleEl.textContent.trim();
    } else {
      fullTitle = document.title.replace(/_哔哩哔哩_bilibili.*$/, "").replace(/ - 哔哩哔哩.*$/, "").trim();
    }

    if (fullTitle && this.shadow) {
      const dispTitle = this.shadow.getElementById("display-title");
      if (dispTitle) {
        dispTitle.textContent = fullTitle;
        dispTitle.title = fullTitle;
      }
    }

    // 2. Fetch official View API for active BVID (guarantees exact aid, cid, title, pic across collections & multi-P)
    if (currentBvid) {
      try {
        logMsg(`正在向 View API 查詢當前影片資訊: bvid=${currentBvid}`);
        const viewRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${currentBvid}`, { credentials: "include" }).then((r) => r.json());
        if (viewRes.code === 0 && viewRes.data) {
          const data = viewRes.data;
          avid = data.aid;
          picUrl = data.pic || picUrl;
          if (data.pages && data.pages.length > 0) {
            const pIdx = Math.max(0, Math.min(currentP - 1, data.pages.length - 1));
            const curP = data.pages[pIdx];
            cid = curP.cid;
            fullTitle = data.pages.length > 1 ? `${data.title}_P${curP.page}_${curP.part}` : data.title;
          } else {
            cid = data.cid;
            fullTitle = data.title;
          }
          if (data.subtitle?.subtitles && Array.isArray(data.subtitle.subtitles)) {
            this.viewApiSubtitles = data.subtitle.subtitles;
          }
          logMsg(`View API 查詢成功: avid=${avid}, cid=${cid}, title=${fullTitle}`);
        }
      } catch (err) {
        logMsg("View API 請求異常", err);
      }
    }

    // Fallback aid/cid from player manifest if View API was blocked
    if (!cid && window.player && typeof window.player.getManifest === "function") {
      try {
        const m = window.player.getManifest();
        if (m?.cid) cid = m.cid;
        if (m?.aid) avid = m.aid;
      } catch (e) {}
    }

    this.cachedTitle = fullTitle;
    this.cachedPic = picUrl;
    this.cachedCid = cid;
    this.cachedAid = avid;

    if (this.shadow) {
      const dispTitle = this.shadow.getElementById("display-title");
      if (dispTitle) {
        dispTitle.textContent = fullTitle;
        dispTitle.title = fullTitle;
      }
    }

    // 3. Load Subtitles (Full support for multi-language AI subtitles & human subtitles)
    if (cid) {
      this.loadSubtitles(avid, cid, currentBvid);
    } else {
      this.subtitleList = [];
      this.renderSubtitlesUI();
    }

    // 4. Resolve PlayURL Streams
    let playData = null;

    // Prioritize authentic, freshly signed playurl from page environment and intercepted player responses
    if (window.__BILI_INTERCEPTED_PLAYURL__) {
      playData = window.__BILI_INTERCEPTED_PLAYURL__;
    }

    if (!playData && window.__playinfo__?.data && (window.__playinfo__.data.dash || window.__playinfo__.data.durl)) {
      playData = window.__playinfo__.data;
    }

    if (!playData && avid && cid) {
      try {
        const urlWbi = `https://api.bilibili.com/x/player/wbi/playurl?qn=${qn}&fnver=0&fnval=4048&fourk=1&avid=${avid}&bvid=${currentBvid || ""}&cid=${cid}`;
        const playResWbi = await fetch(urlWbi, { credentials: "include" }).then((r) => r.json());
        if (playResWbi.code === 0 && (playResWbi.data?.dash || playResWbi.data?.durl)) {
          playData = playResWbi.data;
        }
      } catch (e) {}
    }

    if (!playData && avid && cid) {
      try {
        const url = `https://api.bilibili.com/x/player/playurl?qn=${qn}&fnver=0&fnval=4048&fourk=1&avid=${avid}&bvid=${currentBvid || ""}&cid=${cid}`;
        const playRes = await fetch(url, { credentials: "include" }).then((r) => r.json());
        if (playRes.code === 0 && (playRes.data?.dash || playRes.data?.durl)) {
          playData = playRes.data;
        }
      } catch (e) {}
    }

    if (playData) {
      this.updateFromPlayData(playData, fullTitle, picUrl, cid, avid);
    }
  }

  // ==========================================
  // Multi-tier Subtitle Fetcher & UI Renderer
  // Full support for AI Subtitles (Chinese, English, Japanese, etc.) & UP-provided subtitles
  // ==========================================
  async loadSubtitles(aid, cid, bvid) {
    let list = [];
    logMsg(`開始多層級獲取字幕列表: aid=${aid}, cid=${cid}, bvid=${bvid}`);

    try {
      // Tier 1: Try Player API v2 directly (Public, open, returns all AI subtitles without WBI restriction!)
      if (cid) {
        try {
          const v2Url = `https://api.bilibili.com/x/player/v2?aid=${aid || ""}&cid=${cid}&bvid=${bvid || ""}`;
          const resV2 = await fetch(v2Url, { credentials: "include" });
          const jsonV2 = await resV2.json();
          if (jsonV2.code === 0 && jsonV2.data?.subtitle?.subtitles) {
            list = jsonV2.data.subtitle.subtitles.filter((s) => s.subtitle_url);
            logMsg(`從 Player API v2 獲取到 ${list.length} 條字幕`);
          }
        } catch (e) {}
      }

      // Tier 2: Try player instance directly
      if (!list.length && window.player && typeof window.player.getSubtitleList === "function") {
        try {
          const pl = window.player.getSubtitleList();
          if (Array.isArray(pl) && pl.length > 0) {
            list = pl.filter((s) => s.subtitle_url || s.url).map((s) => ({ ...s, subtitle_url: s.subtitle_url || s.url }));
            logMsg(`從 window.player 獲取到 ${list.length} 條字幕`);
          }
        } catch (e) {}
      }

      // Tier 3: Try Player API wbi
      if (!list.length && aid && cid) {
        try {
          const wbiUrl = `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`;
          const resWbi = await fetch(wbiUrl, { credentials: "include" });
          const jsonWbi = await resWbi.json();
          if (jsonWbi.code === 0 && jsonWbi.data?.subtitle?.subtitles) {
            list = jsonWbi.data.subtitle.subtitles.filter((s) => s.subtitle_url);
            logMsg(`從 Player API wbi 獲取到 ${list.length} 條字幕`);
          }
        } catch (e) {}
      }

      // Tier 4: Try View API cached subtitles
      if (!list.length && this.viewApiSubtitles && this.viewApiSubtitles.length > 0) {
        list = this.viewApiSubtitles.filter((s) => s.subtitle_url);
        logMsg(`從 View API 獲取到 ${list.length} 條字幕`);
      }

      // Tier 5: Try window playinfo
      if (!list.length && window.__playinfo__?.data?.subtitle?.subtitles) {
        list = window.__playinfo__.data.subtitle.subtitles.filter((s) => s.subtitle_url);
      }
    } catch (err) {
      logMsg("字幕清單解析異常", err);
    } finally {
      this.subtitleList = list;
      this.renderSubtitlesUI();

      // If player is still loading subtitles in the background, retry once after 1.5s
      if (!list.length) {
        setTimeout(() => {
          if (this.subtitleList.length === 0 && window.player && typeof window.player.getSubtitleList === "function") {
            try {
              const retryPl = window.player.getSubtitleList();
              if (Array.isArray(retryPl) && retryPl.length > 0) {
                this.subtitleList = retryPl.filter((s) => s.subtitle_url || s.url).map((s) => ({ ...s, subtitle_url: s.subtitle_url || s.url }));
                logMsg(`延遲重試從 window.player 獲取到 ${this.subtitleList.length} 條字幕`);
                this.renderSubtitlesUI();
              }
            } catch (e) {}
          }
        }, 1500);
      }
    }
  }

  renderSubtitlesUI() {
    const shadow = this.shadow;
    if (!shadow) return;
    const select = shadow.getElementById("sub-lang-select");
    const btns = ["btn-sub-srt", "btn-sub-ass", "btn-sub-json", "btn-sub-txt"].map((id) => shadow.getElementById(id));

    if (!select) return;
    select.innerHTML = "";

    if (!this.subtitleList || this.subtitleList.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = T.noSubtitle;
      select.appendChild(opt);
      select.disabled = true;
      btns.forEach((btn) => { if (btn) btn.disabled = true; });
      return;
    }

    select.disabled = false;
    btns.forEach((btn) => { if (btn) btn.disabled = false; });

    let defaultIdx = 0;
    let foundUpChinese = false;
    let foundAiChinese = false;

    this.subtitleList.forEach((sub, idx) => {
      const isAI = sub.lan?.startsWith("ai-") || sub.ai_status > 0 || sub.ai_type > 0 || /自动|AI/i.test(sub.lan_doc || "") || sub.is_machine;
      let cleanDoc = (sub.lan_doc || sub.lan || "中文").replace(/（自动生成）|\(自动生成\)|（AI生成）|\(AI\)/gi, "").trim();
      if (!cleanDoc) cleanDoc = sub.lan || "字幕";
      const tag = isAI ? T.subAiTag : T.subUpTag;
      const label = `${cleanDoc} (${tag})`;

      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = label;
      select.appendChild(opt);

      const isChinese = /zh|cn|hans|hant/i.test(sub.lan || "") || /中|繁|简/i.test(cleanDoc);
      if (!isAI && isChinese && !foundUpChinese) {
        defaultIdx = idx;
        foundUpChinese = true;
      } else if (isAI && isChinese && !foundUpChinese && !foundAiChinese) {
        defaultIdx = idx;
        foundAiChinese = true;
      }
    });

    select.value = String(defaultIdx);
  }
}

function injectPlayerContextMenu(app) {
  const menu = document.querySelector(".bpx-player-contextmenu, ul[class*='bpx-player-contextmenu'], .bpx-player-context-menu");
  if (!menu || menu.querySelector("#bili-context-screenshot")) return;

  const currentLang = getActiveLanguage();
  const label = currentLang === "zh-TW" ? "影片幀截圖" : (currentLang === "zh-CN" ? "视频帧截图" : "Video Frame Screenshot");

  const liScreenshot = document.createElement("li");
  liScreenshot.id = "bili-context-screenshot";
  liScreenshot.setAttribute("data-action", "custom-screenshot");
  liScreenshot.textContent = label;
  liScreenshot.style.cssText = "cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.12);";
  liScreenshot.addEventListener("click", (e) => {
    e.stopPropagation();
    app.captureVideoFrame();
    menu.classList.remove("bpx-player-active");
    menu.style.display = "none";
  });

  // Only inject Video Frame Screenshot into player contextmenu (Cover download stays in bottom panel)
  if (menu.firstChild) {
    menu.insertBefore(liScreenshot, menu.firstChild);
  } else {
    menu.appendChild(liScreenshot);
  }
}

// Hook contextmenu and mutations
window.addEventListener("contextmenu", () => {
  setTimeout(() => {
    if (appInstance) injectPlayerContextMenu(appInstance);
  }, 40);
  setTimeout(() => {
    if (appInstance) injectPlayerContextMenu(appInstance);
  }, 120);
});

const menuObserver = new MutationObserver(() => {
  if (appInstance) {
    injectDanmakuDropdownItems(appInstance);
    injectPlayerContextMenu(appInstance);
  }
});

const startObserving = () => {
  if (!isWatchPage() && !isArticlePage()) return;
  const targetNode = document.body || document.documentElement;
  if (targetNode) {
    menuObserver.observe(targetNode, { childList: true, subtree: true });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserving);
} else {
  startObserving();
}


// ==========================================
// Native Danmaku Dropdown Injection
// ==========================================
function injectDanmakuDropdownItems(app) {
  const container = document.querySelector(".bpx-player-filter .bui-dropdown-items, .bui-dropdown-items");
  if (!container || container.querySelector("#bili-danmaku-ass-item")) return;

  const itemAss = document.createElement("li");
  itemAss.id = "bili-danmaku-ass-item";
  itemAss.className = "bui-dropdown-item";
  itemAss.textContent = T.danmakuAssBtn || "💬 ASS 彈幕";
  itemAss.style.cssText = "cursor: pointer;";
  itemAss.addEventListener("click", (e) => {
    e.stopPropagation();
    app.downloadDanmakuAss();
  });

  const itemXml = document.createElement("li");
  itemXml.id = "bili-danmaku-xml-item";
  itemXml.className = "bui-dropdown-item";
  itemXml.textContent = T.danmakuXmlBtn || "📄 XML 彈幕";
  itemXml.style.cssText = "cursor: pointer;";
  itemXml.addEventListener("click", (e) => {
    e.stopPropagation();
    app.downloadDanmakuXml();
  });

  container.appendChild(itemAss);
  container.appendChild(itemXml);
}

// ==========================================
// BILIBILIA Style: Column / Article Cover Download
// ==========================================
function injectArticleCoverBtn() {
  if (document.getElementById("bili-article-cover-btn")) return;
  const btn = document.createElement("button");
  btn.id = "bili-article-cover-btn";
  btn.textContent = T.articleCoverBtn || "📰 專欄封面";
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #00aeec;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 174, 236, 0.3);
    z-index: 10000;
  `;
  btn.addEventListener("click", () => {
    const banner = document.querySelector(".banner-img-holder, .article-cover img, .banner-holder");
    const src = banner?.getAttribute("src") || banner?.style.backgroundImage?.match(/url\(["']?([^"']+)["']?\)/)?.[1];
    if (src) {
      const rawUrl = src.replace(/@.*$/, "");
      const ext = rawUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || "jpg";
      const filename = `bilibili_article_${Date.now()}.${ext}`;
      fetch(rawUrl).then((r) => r.blob()).then((blob) => {
        triggerFileDownload(blob, filename, blob.type);
      }).catch(() => downloadFileViaExtension(rawUrl, filename));
    } else {
      alert("未找到專欄封面圖");
    }
  });
  (document.body || document.documentElement).appendChild(btn);
}

// ==========================================
// Dynamic / Opus Feed Original Image Downloader (Lossless PNG)
// ==========================================
function initDynamicImageDownloader() {
  const processImage = (img) => {
    if (img.dataset.biliDynHooked) return;
    img.dataset.biliDynHooked = "true";

    const parent = img.parentElement;
    if (!parent) return;

    const badge = document.createElement("div");
    badge.className = "bili-dyn-dl-badge";
    badge.textContent = "⬇️ PNG原圖";
    badge.style.cssText = `
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 174, 236, 0.9);
      color: #fff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    `;

    badge.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const rawUrl = img.src.replace(/@.*$/, "");
      const ext = rawUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || "png";
      const filename = `bilibili_dynamic_${Date.now()}.${ext}`;
      try {
        badge.textContent = "⏳ 下載中...";
        const res = await fetch(rawUrl);
        const blob = await res.blob();
        triggerFileDownload(blob, filename, blob.type);
        badge.textContent = "✅ 已完成";
        setTimeout(() => (badge.textContent = "⬇️ PNG原圖"), 2000);
      } catch (err) {
        downloadFileViaExtension(rawUrl, filename);
        badge.textContent = "✅ 已完成";
      }
    });

    parent.appendChild(badge);
  };

  const scanImages = () => {
    const images = document.querySelectorAll(
      "img[src*='bfs/new_dyn'], img[src*='bfs/opus'], img[src*='bfs/album'], img[src*='bfs/article']"
    );
    images.forEach(processImage);
  };

  scanImages();
  setInterval(scanImages, 1500);
}

// ==========================================
// Global App Controller & Lifecycle Bootstrap
// ==========================================
let appInstance = null;

const waitForPlayer = () =>
  new Promise((resolve) => {
    let count = 0;
    const timer = setInterval(() => {
      count++;
      const p = document.querySelector("#bilibili-player, .bpx-player-container, video");
      if (p || count > 50) {
        clearInterval(timer);
        resolve(p);
      }
    }, 250);
  });

function handlePageCheck() {
  const host = document.getElementById(HOST_ID);

  if (isWatchPage()) {
    if (host) host.style.display = "block";
    waitForPlayer().then(() => {
      if (!isWatchPage()) return;
      if (!appInstance) {
        appInstance = new BiliMotrixApp();
      }
      appInstance.parseCurrentVideo();
    });
  } else {
    if (host) host.style.display = "none";
  }

  if (isArticlePage()) {
    injectArticleCoverBtn();
  }
}

// Dynamic image scanner
initDynamicImageDownloader();

// Handle SPA route changes
let lastHref = location.href;
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    handlePageCheck();
  }
}, 800);

window.addEventListener("popstate", handlePageCheck);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handlePageCheck);
} else {
  handlePageCheck();
}

// ==========================================
// Button Cycling Dots Animation (0 to 3 dots: 下載中 -> 下載中. -> 下載中.. -> 下載中...)
// ==========================================
function setBtnDownloadingAnimation(btn, isDownloading, defaultText) {
  if (!btn) return;
  if (isDownloading) {
    if (btn._dotsTimer) return;
    btn.disabled = true;
    btn.style.opacity = "0.75";
    btn.style.cursor = "not-allowed";
    let step = 0;
    const lang = getActiveLanguage();
    const baseText = lang === "zh-TW" ? "下載中" : (lang === "zh-CN" ? "下载中" : "Downloading");
    const update = () => {
      const dots = ".".repeat(step % 4);
      btn.innerHTML = `<span>${baseText}${dots}</span>`;
      step++;
    };
    update();
    btn._dotsTimer = setInterval(update, 380);
  } else {
    if (btn._dotsTimer) {
      clearInterval(btn._dotsTimer);
      delete btn._dotsTimer;
    }
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    if (defaultText) {
      btn.innerHTML = `<span>${defaultText}</span>`;
    }
  }
}

function getPageCoverUrl() {
  const metaImg = document.querySelector('meta[itemprop="image"], meta[property="og:image"]');
  if (metaImg && metaImg.content) return metaImg.content;
  if (window.__INITIAL_STATE__?.videoData?.pic) return window.__INITIAL_STATE__.videoData.pic;
  if (window.__INITIAL_STATE__?.mediaInfo?.cover) return window.__INITIAL_STATE__.mediaInfo.cover;
  const poster = document.querySelector(".bpx-player-poster, .bilibili-player-video-poster");
  if (poster) {
    const m = poster.style.backgroundImage?.match(/url\(["']?([^"']+)["']?\)/);
    if (m) return m[1];
  }
  return "";
}


