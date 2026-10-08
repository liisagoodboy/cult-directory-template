# 用户自录旁白 → 按句切成 12 段（不改音色/音量，只在切口加 10ms 淡入淡出），并记下句内分句的起点偏移，供画面卡点
# usage: user_lines.py <录音> <输出目录>
import sys, json, subprocess, numpy as np, soundfile as sf
SRC, OUT = sys.argv[1:3]
sr = 24000
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
hop = sr // 100; e = np.array([np.sqrt(np.mean(x[k:k + hop] ** 2)) for k in range(0, len(x) - hop, hop)])
thr = max(0.008, np.percentile(e, 30) * 1.5); quiet = e < thr
phr = []; i = 0; n = len(e)                                    # 分句 = 被 ≥0.25s 静音隔开的说话段
while i < n:
    if quiet[i]: i += 1; continue
    j = i
    while j < n:
        if quiet[j]:
            q = j
            while q < n and quiet[q]: q += 1
            if q - j >= 25 or q >= n: break
            j = q
        else: j += 1
    phr.append((i / 100, j / 100)); i = j
GROUPS = [2, 1, 3, 2, 2, 3, 2, 2, 2, 1, 2, 2]                  # 每句旁白含几个分句（与 lines.json 对应）
assert len(phr) == sum(GROUPS), f'检测到 {len(phr)} 个分句，应为 {sum(GROUPS)}：{phr}'
import os; os.makedirs(OUT, exist_ok=True); meta = []; k = 0
for li, g in enumerate(GROUPS):
    ps = phr[k:k + g]; k += g
    a = max(0, ps[0][0] - 0.10); b = min(len(x) / sr, ps[-1][1] + 0.18)
    seg = x[int(a * sr):int(b * sr)].copy(); f = int(0.01 * sr)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    sf.write(f'{OUT}/{li:02d}.wav', seg, sr)
    meta.append({'i': li, 'dur': len(seg) / sr, 'src': [round(a, 3), round(b, 3)], 'ph': [round(p[0] - a, 3) for p in ps]})
    print(li, f'{a:6.2f}-{b:6.2f}', 'ph', meta[-1]['ph'])
json.dump({'sr': sr, 'source': SRC, 'lines': meta}, open(f'{OUT}/meta.json', 'w'), ensure_ascii=False, indent=1)
