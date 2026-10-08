// 冯内古特「故事的形状」· 黑板粉笔讲解片（Y3 白板语法的黑板变体）
// 依据：语法卡 y3_whiteboard.md——一整块大板＋相机移动；说一句写一句、开写比开说晚约 0.2–0.5s；手（这里是一截粉笔）只在画时入画；
//       板上平滑移动 easeInOutSine；收尾拉远看全图。黑板版改动：底色墨绿、粉笔白＋淡黄唯一强调色、粉笔颗粒（destination-out 噪点）＋微光晕。
// 世界布局（世界像素，z=1 时一屏 1920×1080）：片名板 X0=0 · 坐标系一 X1=2200 · 坐标系二 X2=4400 · 结论写在两图下方。
// 时间轴：timing.js 的 CUES（旁白每句起止，build_audio.py 生成）；句内分句点来自旁白波形的停顿检测（见 PH）。
(() => {
const W = 1920, H = 1080;
const { clamp, lerp, rng } = U;
const seg = MO.seg;
const VS = window.VS = {};
const CUE = window.CUES;
const CHALK = '#EEF0E6', YEL = '#F2D774', BOARD = '#1E2B25';
const LW = 7;                                            // 粉笔线宽 ≈ 画高 0.65%（语法卡线宽口径）
const X1 = 2200, X2 = 4400;
const FONT = '"LXGWWenKai-500"';
// 分句起点（秒，绝对时间）：句首 + 波形里逗号停顿的结束点
const PH = {
  goodUp: CUE[2].t0 + 1.84, end3: CUE[3].t0 + 1.87,
  fall: CUE[5].t0 + 2.32, climb: CUE[5].t0 + 3.81,
  meet: CUE[8].t0 + 1.52, rise2: CUE[10].t0 + 1.56,
  name1: CUE[4].t0 + 1.76, name2: CUE[7].t0 + 1.71,
};
VS.PH = PH;

const B = DG.board({ ink: CHALK, lw: LW, speed: 1500, font: FONT });
VS.board = B;
// 一只手只能一笔一笔画：想开笔的时刻若前一笔还没画完，就顺延，并记下迟到多少（交付前核对 VS.late，卡口播的笔不能迟太多）
VS.late = [];
const at = t => { if (B.cur > t + 1e-6) VS.late.push([+t.toFixed(2), +(B.cur - t).toFixed(2)]); return B.at(Math.max(B.cur, t)); };
// 最后一笔改成指定时长（曲线要卡口播的分句，不按笔速算）
const fit = (d, gap = 0.02) => { const s = B.S[B.S.length - 1]; s.t1 = s.t0 + d; B.cur = s.t1 + gap; };
const L = (X, pts) => pts.map(([x, y]) => [X + x, y]);
const line = (X, pts, d, o = {}) => { B.line(L(X, pts), o); if (d) fit(d, o.gap); };
const text = (X, str, x, y, size, o = {}) => B.text(str, X + x, y, size, o);
const pop = (X, str, x, y, size, o = {}) => B.pop(str, X + x, y, size, o);

// ---------- 小画：火柴人、心、碎心、星、虚线 ----------
const stick = (X, x, y, h, pose = 'stand', col = CHALK, d = 1.0) => {
  const k = d / 1.0, P = pts => L(X, pts);
  B.line(P(DG.ellipsePts(x, y - h * 0.86, h * 0.13, h * 0.13, -Math.PI / 2, 1.06, 22)), { col, w: 6 }); fit(0.3 * k);
  B.line(P([[x, y - h * 0.73], [x, y - h * 0.36]]), { col, w: 6 }); fit(0.14 * k);
  const arms = pose === 'up' ? [[x - h * 0.26, y - h * 0.98], [x, y - h * 0.62], [x + h * 0.26, y - h * 0.98]]
             : pose === 'down' ? [[x - h * 0.2, y - h * 0.36], [x, y - h * 0.62], [x + h * 0.2, y - h * 0.36]]
             : [[x - h * 0.24, y - h * 0.44], [x, y - h * 0.62], [x + h * 0.26, y - h * 0.5]];
  B.line(P(arms), { col, w: 6, smooth: false }); fit(0.22 * k);
  const legs = pose === 'walk' || pose === 'stand' ? [[x - h * 0.2, y], [x, y - h * 0.36], [x + h * 0.14, y - h * 0.01]] : [[x - h * 0.17, y], [x, y - h * 0.36], [x + h * 0.17, y]];
  B.line(P(legs), { col, w: 6, smooth: false }); fit(0.2 * k);
};
const heartPts = (cx, cy, s, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; o.push([cx + s * Math.pow(Math.sin(t), 3), cy - s / 16 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } return o; };
const heart = (X, cx, cy, s, d = 0.7, col = YEL) => { B.line(L(X, heartPts(cx, cy, s)), { col, w: 6 }); fit(d); };
const brokenHeart = (X, cx, cy, s, col = YEL) => {
  heart(X, cx, cy, s, 0.7, col);
  B.line(L(X, [[cx + 2, cy - s * 0.32], [cx - s * 0.18, cy - s * 0.02], [cx + s * 0.16, cy + s * 0.22], [cx - s * 0.1, cy + s * 0.48], [cx + 2, cy + s * 0.72]]), { col, w: 5, smooth: false }); fit(0.35);
};
const star = (X, cx, cy, r, col = YEL, d = 0.35) => { const o = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } B.line(L(X, o), { col, w: 5, smooth: false }); fit(d); };
const dashed = (X, a, b, d, col = YEL) => {
  const A = [X + a[0], a[1]], Bp = [X + b[0], b[1]];
  B.push({ kind: 'custom', t0: B.cur, t1: B.cur + d, col,
    draw(g, q) { const e = MO.sineInOut(q), x = lerp(A[0], Bp[0], e), y = lerp(A[1], Bp[1], e);
      g.save(); g.strokeStyle = col; g.lineWidth = 5; g.setLineDash([24, 18]); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(x, y); g.stroke(); g.restore(); return q < 1 ? [x, y] : null; },
    start() { return A; }, end() { return Bp; } });
  B.cur += d + 0.02;
};
const arrowHead = (X, tip, dir, d = 0.18, col = CHALK) => {   // dir：'up' | 'right'
  const [x, y] = tip, p = dir === 'up' ? [[x - 18, y + 30], [x, y], [x + 18, y + 30]] : [[x - 30, y - 18], [x, y], [x - 30, y + 18]];
  B.line(L(X, p), { col, smooth: false }); fit(d);
};

// ---------- 坐标系（局部坐标：纵轴 x=260，横轴 y=510；左侧 G/I 两列标签，B/E 在横轴两端） ----------
const OX = 260, OY = 510, TOP = 175, BOT = 845, RIGHT = 1720;
const axes = (X, t0, fast) => {
  at(t0);
  line(X, [[OX, BOT], [OX, TOP]], fast ? 0.5 : 0.95); arrowHead(X, [OX, TOP], 'up', 0.16);
  line(X, [[OX, OY], [RIGHT, OY]], fast ? 0.7 : 1.15); arrowHead(X, [RIGHT, OY], 'right', 0.16);
};
const yLabels = (X, tG, tI, rate) => {          // G 在上、I 在下（淡黄大字母＋中文＋英文原文）
  at(tG); text(X, 'G', 150, 225, 84, { col: YEL, align: 'center', rate: 3 }); text(X, '好运', 150, 280, 40, { align: 'center', rate }); text(X, 'Good fortune', 150, 316, 30, { align: 'center', rate: 20 });
  at(tI); text(X, '厄运', 150, 712, 40, { align: 'center', rate }); text(X, 'Ill fortune', 150, 748, 30, { align: 'center', rate: 20 }); text(X, 'I', 150, 840, 84, { col: YEL, align: 'center', rate: 3 });
};
const xLabels = (X, tB, tE, rate) => {          // B 在左（原点旁）、E 在右（箭头旁）
  at(tB); text(X, 'B', 212, 538, 70, { col: YEL, align: 'center', rate: 3 }); text(X, '开头', 300, 565, 36, { rate }); text(X, 'Beginning', 300, 600, 30, { rate: 20 });
  at(tE); text(X, 'E', 1790, 538, 70, { col: YEL, align: 'center', rate: 3 }); text(X, '结尾', 1745, 580, 36, { align: 'center', rate }); text(X, 'End', 1745, 615, 30, { align: 'center', rate: 20 });
};

// ===== ① 片名板（X0 = 0） =====
at(0.7); B.text('故事的形状', 960, 440, 168, { align: 'center', rate: 2.3 });
at(3.4); B.text('The Shapes of Stories', 960, 560, 62, { align: 'center', rate: 13 });
at(5.3); B.text('—— 库尔特·冯内古特  Kurt Vonnegut', 960, 665, 44, { align: 'center', rate: 15, col: YEL });
// 「每个故事都有形状」：题下画一条小小的起伏线，预告后面的曲线
at(CUE[0].t0 + 1.8); B.line([[700, 780], [800, 790], [880, 830], [960, 850], [1040, 830], [1130, 780], [1240, 745]], { col: YEL }); fit(1.9);
const T_TITLE_END = B.cur;

// ===== ② 坐标系一（X1）：画一个坐标系 → 纵轴运气 G/I → 横轴时间 B/E =====
axes(X1, CUE[1].t0 + 0.35, false);
at(CUE[2].t0 + 0.3); text(X1, '运', 62, 492, 46, { rate: 3 }); text(X1, '气', 62, 548, 46, { rate: 3 });
yLabels(X1, PH.goodUp + 0.15, PH.goodUp + 1.25, 5);
at(CUE[3].t0 + 0.3); text(X1, '时间', 1555, 478, 40, { rate: 3.5 });
xLabels(X1, PH.end3 + 0.1, PH.end3 + 1.15, 6);
const T_AXES1_END = B.cur;

// ===== ③ 掉进坑里的人（Man in Hole） =====
at(PH.name1 + 0.2); text(X1, '① 掉进坑里的人', 360, 112, 64, { col: YEL, rate: 5 });
text(X1, 'Man in Hole', 860, 112, 46, { rate: 9 });
at(CUE[4].t1 + 0.4); stick(X1, 330, 438, 84, 'walk', CHALK, 1.2);          // 主角：站在开局的地方（中间偏上）
// 曲线卡口播三个分句：惹上麻烦（往下滑）→ 跌进低谷 → 再爬出来
const MH = [[262, 440], [400, 452], [520, 520], [640, 650]];
const MH2 = [[640, 650], [740, 742], [860, 778], [960, 752]];
const MH3 = [[960, 752], [1080, 662], [1250, 500], [1450, 360], [1680, 250]];
at(CUE[5].t0 + 0.3); line(X1, MH, PH.fall - CUE[5].t0 - 0.35, { w: 8, gap: 0 });
at(PH.fall + 0.05); line(X1, MH2, PH.climb - PH.fall - 0.05, { w: 8, gap: 0 });
at(PH.climb + 0.05); line(X1, MH3, CUE[5].t1 - PH.climb + 0.35, { w: 8 });
at(CUE[5].t1 + 0.6); text(X1, '惹上麻烦', 330, 668, 38, { rate: 6 });
stick(X1, 860, 765, 70, 'up', CHALK, 1.0);                                   // 坑底的人：举手求救
at(B.cur + 0.15); text(X1, '?!', 905, 668, 40, { col: YEL, rate: 6 });
at(B.cur + 0.25); stick(X1, 1700, 244, 80, 'up', CHALK, 1.0);                // 爬出来：欢呼
text(X1, '脱困！', 1500, 222, 42, { col: YEL, rate: 6 });
// 「人类讲了一千年还爱听」
at(CUE[6].t0 + 1.6); text(X1, '百讲不厌', 1250, 806, 60, { col: YEL, rate: 5 });
line(X1, [[1240, 832], [1330, 840], [1420, 828], [1500, 838]], 0.5, { col: YEL, w: 5 });
star(X1, 1555, 770, 22); star(X1, 1600, 812, 15);
const T_HOLE_END = B.cur;

// ===== ④ 坐标系二（X2）＋ 男孩遇见女孩（Boy Meets Girl） =====
const AX2 = CUE[6].t1 + 7.6;                                                 // 相机到位后快速画好第二个坐标系（无旁白）
axes(X2, AX2, true);
at(B.cur + 0.05); pop(X2, 'G', 150, 225, 84, { col: YEL }); pop(X2, '好运', 150, 280, 40); pop(X2, 'Good fortune', 150, 316, 30);
at(B.cur + 0.15); pop(X2, '厄运', 150, 712, 40); pop(X2, 'Ill fortune', 150, 748, 30); pop(X2, 'I', 150, 840, 84, { col: YEL });
at(B.cur + 0.15); pop(X2, 'B', 212, 538, 70, { col: YEL }); pop(X2, '开头', 300, 565, 36, { align: 'left' }); pop(X2, 'Beginning', 300, 600, 30, { align: 'left' });
at(B.cur + 0.15); pop(X2, 'E', 1790, 538, 70, { col: YEL }); pop(X2, '结尾', 1745, 580, 36); pop(X2, 'End', 1745, 615, 30);
at(B.cur + 0.1); pop(X2, '运', 82, 492, 46); pop(X2, '气', 82, 548, 46); pop(X2, '时间', 1555, 478, 40, { align: 'left' });
const T_AXES2_END = B.cur;
at(PH.name2 + 0.2); text(X2, '② 男孩遇见女孩', 360, 112, 64, { col: YEL, rate: 5 });
text(X2, 'Boy Meets Girl', 860, 112, 46, { rate: 10 });
at(CUE[7].t1 + 0.5); stick(X2, 330, 462, 84, 'stand', CHALK, 1.2);
// 平淡开局 → 遇见心动的人冲上高峰
const BG1 = [[262, 470], [400, 466], [560, 472]];
const BG2 = [[560, 472], [680, 404], [780, 282], [860, 236]];
const BG3 = [[860, 236], [950, 330], [1050, 560], [1110, 720], [1155, 762]];
const BG4 = [[1155, 762], [1205, 738], [1270, 645], [1400, 420], [1560, 228], [1690, 150]];
at(CUE[8].t0 + 0.25); line(X2, BG1, PH.meet - CUE[8].t0 - 0.3, { w: 8, gap: 0 });
at(PH.meet + 0.05); line(X2, BG2, CUE[8].t1 - PH.meet + 0.1, { w: 8 });
at(CUE[8].t1 + 0.3); heart(X2, 860, 168, 30, 0.75);
// 失去对方跌到谷底
at(CUE[9].t0 + 0.2); line(X2, BG3, CUE[9].t1 - CUE[9].t0 + 0.1, { w: 8 });
at(CUE[9].t1 + 0.4); brokenHeart(X2, 1010, 760, 30);
// 最后复合，冲上比之前更高的地方
at(CUE[10].t0 + 0.35); line(X2, BG4, CUE[10].t1 - CUE[10].t0 - 0.2, { w: 8 });
at(CUE[10].t1 + 0.35); dashed(X2, [860, 236], [1720, 236], 1.0);
text(X2, '更高！', 1400, 150, 46, { col: YEL, rate: 6 });
at(B.cur + 0.25); heart(X2, 1625, 78, 18, 0.45); heart(X2, 1675, 78, 18, 0.45);
const T_GIRL_END = B.cur;

// ===== ⑤ 点题：拉远看到两条曲线，在下方写结论 =====
const CX = (X1 + X2 + 1920) / 2, CY = 1190;
at(CUE[11].t1 + 0.45); B.text('故事 + 数据可视化 = 用数学看懂叙事', CX, CY, 118, { align: 'center', rate: 4.2 });
line(0, [[CX - 900, CY + 42], [CX - 300, CY + 52], [CX + 300, CY + 40], [CX + 900, CY + 50]], 1.0, { col: YEL, w: 8 });
const T_END = B.cur;
VS.timeline = { T_TITLE_END, T_AXES1_END, T_HOLE_END, AX2, T_AXES2_END, T_GIRL_END, T_END };

// ---------- 相机 ----------
const P1 = { x: X1 + 960, y: 540, z: 1 }, P2 = { x: X2 + 960, y: 540, z: 1 };
const OVER = { x: CX, y: 665, z: 0.455 };
const MV1 = CUE[0].t1 + 1.6, MV2 = CUE[6].t1 + 4.8, MV3 = CUE[10].t1 + 4.8;
const camAt = ft => CAM.at([
  { t: 0, x: 960, y: 560, z: 1.0 },
  { t: MV1, x: 966, y: 548, z: 1.03, ease: MO.sineInOut },
  { t: MV1 + 2.6, ...P1, ease: MO.sineInOut },                               // 板上平滑移动到坐标系一
  { t: MV2, x: P1.x + 14, y: P1.y + 4, z: 1.02, ease: MO.sineInOut },
  { t: MV2 + 2.6, ...P2, ease: MO.sineInOut },                               // 移到坐标系二
  { t: MV3, x: P2.x + 14, y: P2.y + 4, z: 1.02, ease: MO.sineInOut },
  { t: MV3 + 4.0, ...OVER, ease: MO.sineInOut },                             // 拉远看全图
  { t: window.FILM_DURATION, ...OVER, z: OVER.z * 1.04, ease: MO.sineInOut },
], ft);
VS.camAt = camAt;
VS.MV = { MV1, MV2, MV3 };

// ---------- 黑板与粉笔质感 ----------
const boardTile = () => PAINT.cached('vs_board', 2048, 2048, g => {
  const r = rng(11);
  g.fillStyle = BOARD; g.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 60; i++) {                                              // 擦过的粉笔灰：大片淡白
    const x = r() * 2048, y = r() * 2048, rx = 120 + r() * 420, ry = 30 + r() * 120;
    for (const dx of [-2048, 0, 2048]) for (const dy of [-2048, 0, 2048]) { g.fillStyle = `rgba(220,230,220,${0.012 + r() * 0.02})`; g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, (r() - 0.5) * 0.5, 0, 7); g.fill(); }
  }
  for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.035})`; g.fillRect(r() * 2048, r() * 2048, 1 + r() * 2, 1 + r() * 2); }
});
const grainTile = () => PAINT.cached('vs_grain', 512, 512, g => {             // 粉笔颗粒：在墨层上挖掉一部分像素
  const r = rng(29), im = g.createImageData(512, 512), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const v = r(); d[i + 3] = v < 0.28 ? 150 + r() * 105 : v < 0.6 ? r() * 70 : 0; }
  g.putImageData(im, 0, 0);
});
const vignette = () => PAINT.cached('vs_vig', W, H, g => {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
});

// 粉笔头（屏幕空间，笔尖在 (x,y)，笔身朝右下）
const chalkStick = (c, x, y, tilt) => {
  c.save(); c.translate(x, y); c.rotate(0.62 + tilt);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.roundRect(14, 10, 150, 26, 12); c.fill();
  const gr = c.createLinearGradient(0, -13, 0, 13); gr.addColorStop(0, '#FFFFFA'); gr.addColorStop(0.55, '#E9E8DF'); gr.addColorStop(1, '#BDBCB2');
  c.fillStyle = gr; c.beginPath(); c.moveTo(0, -6); c.lineTo(16, -13); c.lineTo(140, -13); c.quadraticCurveTo(148, 0, 140, 13); c.lineTo(16, 13); c.lineTo(0, 6); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(22, -10, 108, 3);
  c.restore();
};

// 笔的位置：画的时候在笔尖；短空档沿弧线滑过去；长空档（>2s）先退到右下屏外，下一笔前 0.6s 再进来
const handed = B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill');
const OFF = [W + 260, H + 220];
const chalkAt = (ft, cam, tip) => {
  if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
  let prev = null, next = null;
  for (const s of handed) { if (s.t1 <= ft) prev = s; else if (s.t0 > ft && !next) next = s; }
  const gap = prev && next ? next.t0 - prev.t1 : 99;
  if (!next || gap > 2.0) {
    const out = prev ? MO.cubicIn(clamp((ft - prev.t1) / 0.6)) : 1, inn = next ? MO.cubicOut(clamp(1 - (next.t0 - ft) / 0.6)) : 0;
    if (next && inn > 0) { const b = B.penAt(next.t0 - 1e-3, cam, null); return [lerp(OFF[0], b[0], inn), lerp(OFF[1], b[1], inn)]; }
    if (prev && out < 1) { const a = B.penAt(prev.t1 + 1e-4, cam, null); return [lerp(a[0], OFF[0], out), lerp(a[1], OFF[1], out)]; }
    return null;
  }
  return B.penAt(ft, cam, null);
};

// ---------- 字幕（屏幕空间，底部，和旁白逐句对齐） ----------
const SUB_Y = 1012;
const drawSub = (c, t) => {
  const q = CUE.find(k => t >= k.t0 - 0.05 && t < k.t1 + 0.25); if (!q) return;
  const a = Math.min(clamp((t - q.t0 + 0.05) / 0.15), clamp((q.t1 + 0.25 - t) / 0.15));
  c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let size = 44; c.font = `${size}px "PuHui-Medium"`; const w = c.measureText(q.sub).width; if (w > 1760) { size *= 1760 / w; c.font = `${size}px "PuHui-Medium"`; }
  const tw = Math.min(1760, w) + 56;
  c.fillStyle = 'rgba(8,12,10,.55)'; c.beginPath(); c.roundRect(W / 2 - tw / 2, SUB_Y - size - 14, tw, size + 34, 12); c.fill();
  c.fillStyle = '#F6F3E8'; c.fillText(q.sub, W / 2, SUB_Y); c.restore();
};

// ---------- 画 ----------
const shot = (c, lt, t) => {
  const ft = t, cam = camAt(ft);
  // 板：世界空间平铺（随相机平移、缩放）
  c.save(); CAM.apply(c, cam); c.fillStyle = c.createPattern(boardTile(), 'repeat');
  const tl = CAM.toWorld(cam, 0, 0), br = CAM.toWorld(cam, W, H); c.fillRect(tl[0] - 10, tl[1] - 10, br[0] - tl[0] + 20, br[1] - tl[1] + 20); c.restore();
  // 墨层：粉笔字和线 → 挖颗粒 → 带微光晕合到板上
  const buf = PAINT.scratch('vs_ink'), g = buf.getContext('2d'); g.reset();
  g.save(); CAM.apply(g, cam); const { tip } = B.draw(g, ft);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = g.createPattern(grainTile(), 'repeat'); g.fillRect(tl[0] - 10, tl[1] - 10, br[0] - tl[0] + 20, br[1] - tl[1] + 20);
  g.restore();
  c.save(); c.shadowColor = 'rgba(235,240,225,.35)'; c.shadowBlur = 7; c.drawImage(buf, 0, 0); c.restore();
  c.drawImage(vignette(), 0, 0);
  const p = chalkAt(ft, cam, tip);
  if (p) chalkStick(c, p[0], p[1], Math.sin(ft * 6) * 0.04);
  drawSub(c, t);
  // 片头从黑淡入、片尾淡出
  const fade = Math.max(1 - clamp(t / 0.6), clamp((t - (window.FILM_DURATION - 1.4)) / 1.4));
  if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); }
};
const init = () => {
  U.assertGlyphs(FONT, B.S.filter(s => s.str).map(s => s.str).join(''), 'shape_stories 板书');
  U.assertGlyphs('"PuHui-Medium"', CUE.map(q => q.sub).join(''), 'shape_stories 字幕');
};
for (const id of ['vs_title', 'vs_axes', 'vs_hole', 'vs_girl', 'vs_end']) SCENES[id] = { draw: shot };
SCENES.vs_title.init = init;
})();
