# 粉笔声（按笔画时间表程序化合成，种子固定）＋ 旁白 → 混音
# 要点（用户反馈「太密、机械」后重写）：
#   - 写字不是「一字一响」：每个字只有约一半概率出一笔，笔触长短 70–220ms、间隔随机，整体稀疏
#   - 画线是一整段连续摩擦，力度用慢变的随机包络（2–4Hz 平滑噪声），不用规整正弦
#   - 每一笔的音色（带通中心）、力度都随机；很短的笔画（<0.12s）不出声
#   - 粉笔声整体压在人声下约 -24 dB；另加极轻的室内底噪，空档不是数字静音
import sys, json, numpy as np, soundfile as sf
PROJ = sys.argv[1]
voice, sr = sf.read(f"{PROJ}/音频/narration.wav", dtype="float32")
strokes = json.load(open(f"{PROJ}/音频/strokes.json"))
rs = np.random.default_rng(7); sfx = np.zeros_like(voice)

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr)
    w = np.clip((f - lo) / 300, 0, 1) * np.clip((hi - f) / 900, 0, 1)        # 软边带通，避免振铃
    return np.fft.irfft(X * w, len(x)).astype(np.float32)

def smooth_noise(n, hz):                                                     # 慢变随机包络
    k = max(2, int(n / sr * hz) + 2); pts = rs.uniform(0.35, 1.0, k)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), pts).astype(np.float32)

def scratch(n, gain):
    lo = rs.uniform(1400, 2600); hi = lo + rs.uniform(2500, 4500)
    x = band(rs.standard_normal(n).astype(np.float32), lo, hi)
    x *= smooth_noise(n, rs.uniform(2, 4))
    a = min(n // 4, int(0.025 * sr)); r = min(n // 3, int(0.06 * sr))
    env = np.ones(n, np.float32); env[:a] = np.linspace(0, 1, a); env[n - r:] = np.linspace(1, 0, r)
    return x * env * gain

def put(t, y):
    k = int(t * sr); m = min(len(y), len(sfx) - k)
    if m > 0: sfx[k:k + m] += y[:m]

for s in strokes:
    if s["k"] == "pop": continue
    t0, t1 = s["t0"], s["t1"]; d = t1 - t0
    if d < 0.12: continue
    if s["k"] == "text":
        nch = max(1, s["n"]); per = d / nch
        for c in range(nch):
            if rs.random() > 0.5: continue                                   # 约一半的字出声
            ln = rs.uniform(0.07, 0.22); st = t0 + c * per + rs.uniform(0, per * 0.6)
            put(st, scratch(int(ln * sr), rs.uniform(0.35, 0.8)))
    else:
        put(t0, scratch(int(d * sr), rs.uniform(0.6, 1.0)))

sfx *= 0.055 / (np.abs(sfx).max() + 1e-9)                                    # 峰值约 -25 dBFS
room = band(rs.standard_normal(len(voice)).astype(np.float32), 80, 1200); room *= 0.004 / (np.sqrt(np.mean(room ** 2)) + 1e-9)
mix = voice + sfx + room; mix *= 0.89 / np.abs(mix).max()
sf.write(f"{PROJ}/音频/mix_24k.wav", np.repeat(mix[:, None], 2, axis=1), sr)
print("ok", len(mix) / sr, "s")
