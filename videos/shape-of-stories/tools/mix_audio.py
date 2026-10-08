# 粉笔摩擦声（按笔画时间表程序化合成，种子固定）＋ 旁白 → 48kHz 立体声混音
import sys, json, numpy as np, soundfile as sf
PROJ = sys.argv[1]
voice, sr = sf.read(f"{PROJ}/音频/narration.wav", dtype="float32")
strokes = json.load(open(f"{PROJ}/音频/strokes.json"))
rs = np.random.default_rng(7); sfx = np.zeros_like(voice)
def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x)).astype(np.float32)
for s in strokes:
    if s["k"] == "pop": continue
    t0, t1 = s["t0"], s["t1"]; n = int((t1 - t0) * sr)
    if n < 200: continue
    x = band(rs.standard_normal(n).astype(np.float32), 1800, 7000)
    tt = np.arange(n) / sr
    if s["k"] == "text":                                    # 写字：一个字一组短促笔触
        rate = max(1, s["n"]) / (t1 - t0) * 3.0
        env = np.clip(np.sin(2 * np.pi * rate * tt + rs.uniform(0, 6)), 0, None) ** 1.5
    else:                                                   # 画线：连续摩擦，带颗粒起伏
        env = 0.55 + 0.45 * np.clip(np.sin(2 * np.pi * rs.uniform(9, 15) * tt), -1, 1) ** 2
    ramp = np.minimum(1, np.minimum(tt / 0.03, (tt[-1] - tt) / 0.05 + 1e-3))
    k = int(t0 * sr); m = min(n, len(sfx) - k); sfx[k:k + m] += (x * env * ramp)[:m]
sfx *= 0.10 / (np.abs(sfx).max() + 1e-9)                    # 粉笔声峰值约 -20 dBFS，压在人声（-1 dBFS）下面
room = band(rs.standard_normal(len(voice)).astype(np.float32), 80, 1200); room *= 0.004 / (np.sqrt(np.mean(room ** 2)) + 1e-9)   # 极轻的室内底噪，空档不是数字静音
mix = voice + sfx + room; mix *= 0.89 / np.abs(mix).max()
out = np.repeat(mix[:, None], 2, axis=1)
sf.write(f"{PROJ}/音频/mix_24k.wav", out, sr)
print("ok", len(mix) / sr, "s")
