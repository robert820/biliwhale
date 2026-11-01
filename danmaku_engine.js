// BiliASS: Bilibili XML Danmaku to ASS Converter
function xmlToAss(xmlStr, title = "Bilibili Danmaku", screenWidth = 1920, screenHeight = 1080) {
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

  const formatTime = (sec) => {
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
  const tracks = new Array(20).fill(0); // 20 rolling tracks
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
    const startStr = formatTime(time);

    if (mode === 1 || mode === 2 || mode === 3) {
      // Rolling R2L
      const endStr = formatTime(time + scrollDuration);
      // Track allocation
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
      tracks[bestTrack] = time + 2.5; // Next danmaku can enter this track after 2.5s
      const y = 60 + bestTrack * trackHeight;
      lines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\move(${screenWidth + 50},${y},-${text.length * 50 + 100},${y})${colorTag}}${text}`);
    } else if (mode === 5) {
      // Top fixed
      const endStr = formatTime(time + stillDuration);
      lines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\an8\\pos(${screenWidth / 2},50)${colorTag}}${text}`);
    } else if (mode === 4) {
      // Bottom fixed
      const endStr = formatTime(time + stillDuration);
      lines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,{\\an2\\pos(${screenWidth / 2},${screenHeight - 50})${colorTag}}${text}`);
    }
  }

  return header + lines.join("\n");
}
console.log("Danmaku engine syntax check passed!");
