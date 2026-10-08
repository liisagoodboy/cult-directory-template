# usage: tts_lines.py <kokoro_dir> <asr_dir> <lines.json> <outdir> <speed> sid [sid...]
import sys, json, os, numpy as np, sherpa_onnx, soundfile as sf, difflib
M, A, L, OUT, speed = sys.argv[1:6]; sids = [int(s) for s in sys.argv[6:]]; speed = float(speed)
lines = json.load(open(L))
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f"{M}/model.onnx", voices=f"{M}/voices.bin", tokens=f"{M}/tokens.txt",
        data_dir=f"{M}/espeak-ng-data", dict_dir=f"{M}/dict", lexicon=f"{M}/lexicon-us-en.txt,{M}/lexicon-zh.txt"), num_threads=4),
    rule_fsts=f"{M}/date-zh.fst,{M}/phone-zh.fst,{M}/number-zh.fst"))
asr = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=f"{A}/model.int8.onnx", tokens=f"{A}/tokens.txt", num_threads=4)
strip = lambda s: ''.join(ch for ch in s if '一' <= ch <= '鿿')
for sid in sids:
    d = f"{OUT}/sid{sid}"; os.makedirs(d, exist_ok=True); tot = 0; errs = 0; n = 0; meta = []
    for i, ln in enumerate(lines):
        a = tts.generate(ln["tts"], sid=sid, speed=speed); x = np.array(a.samples, dtype=np.float32); sr = a.sample_rate
        # trim leading/trailing silence
        nz = np.where(np.abs(x) > 0.01)[0]; x = x[max(0, nz[0]-int(.02*sr)): nz[-1]+int(.08*sr)]
        sf.write(f"{d}/{i:02d}.wav", x, sr)
        s = asr.create_stream(); s.accept_waveform(sr, x); asr.decode_stream(s); hyp = strip(s.result.text); ref = strip(ln["tts"])
        sm = difflib.SequenceMatcher(None, ref, hyp); e = sum(max(i2-i1, j2-j1) for t, i1, i2, j1, j2 in sm.get_opcodes() if t != 'equal')
        errs += e; n += len(ref); tot += len(x)/sr; meta.append({"i": i, "dur": len(x)/sr, "asr": hyp, "err": e})
        if e: print(f"  sid{sid} #{i} ref={ref} hyp={hyp}")
    json.dump({"sr": sr, "lines": meta}, open(f"{d}/meta.json", "w"), ensure_ascii=False, indent=1)
    print(f"sid {sid}: speech {tot:.1f}s  CER {errs}/{n} = {errs/n:.3f}", flush=True)
