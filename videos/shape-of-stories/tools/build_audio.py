# 旁白：按 START 时间把每句贴到时间轴上，输出 narration.wav + timing.js（给画面用）+ 字幕 srt
import json, sys, numpy as np, soundfile as sf
CAND, LINES, PROJ = sys.argv[1:4]
lines = json.load(open(LINES)); meta = json.load(open(f"{CAND}/meta.json")); sr = meta["sr"]
# 每句开口 = 上一句说完 + GAP（第一句是片名写完的时刻）。GAP 只留画图需要的时间：
#   画坐标轴、标签、小人、心、相机移动（2s）、第二坐标系、拉远（3s）……
GAP = [4.3, 2.6, 1.6, 0.5, 1.6, 1.6, 2.2, 5.8, 1.3, 1.3, 1.6, 5.4]
TAIL = 7.5                                                            # 最后一句后：写结论＋停留
durs = [sf.info(f"{CAND}/{i:02d}.wav").duration for i in range(len(lines))]
START = []
for i, g in enumerate(GAP): START.append(round(g if i == 0 else START[-1] + durs[i - 1] + g, 2))
TOTAL = round(START[-1] + durs[-1] + TAIL, 1)
buf = np.zeros(int(TOTAL * sr), np.float32); cues = []
for i, (ln, t0) in enumerate(zip(lines, START)):
    x, r = sf.read(f"{CAND}/{i:02d}.wav", dtype="float32"); assert r == sr
    k = int(t0 * sr); buf[k:k + len(x)] += x
    t1 = t0 + len(x) / sr
    if i + 1 < len(START): assert t1 + 0.3 < START[i + 1], (i, t1)
    cues.append({"i": i, "t0": round(t0, 3), "t1": round(t1, 3), "ph": [round(t0 + p, 3) for p in meta["lines"][i].get("ph", [0])], "sub": ln["sub"], "tts": ln["tts"]})
peak = np.abs(buf).max(); buf *= 0.89 / peak                          # 峰值 -1 dBFS
sf.write(f"{PROJ}/音频/narration.wav", buf, sr)
open(f"{PROJ}/代码工程/demos/shape_stories/timing.js", "w").write(
    "// 自动生成（build_audio.py）：旁白每句的起止秒数，画面与字幕都按它对齐\nwindow.FILM_DURATION = %s;\nwindow.CUES = %s;\n" % (TOTAL, json.dumps(cues, ensure_ascii=False, indent=1)))
def ts(t): ms = round(t * 1000); return "%02d:%02d:%02d,%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)
with open(f"{PROJ}/成片/故事的形状.srt", "w", encoding="utf-8") as f:
    for c in cues: f.write(f"{c['i']+1}\n{ts(c['t0'])} --> {ts(c['t1'] + 0.25)}\n{c['sub']}\n\n")
for c in cues: print(c["i"], c["t0"], c["t1"], c["sub"])
