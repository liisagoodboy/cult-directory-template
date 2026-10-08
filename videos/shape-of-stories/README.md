# 故事的形状（冯内古特讲座复刻 · 黑板粉笔版）

用 `huashu-art-motion` skill 的白板语法（Y3，RSA 型：一整块大板＋相机移动）做的中文讲解片。

- 成片：1920×1080，30fps，H.264，约 2:02；AAC 旁白＋粉笔声；内嵌 mov_text 中文字幕轨，同时画面底部烧录字幕
- 字幕：`故事的形状.srt`（与旁白逐句对齐，术语首次出现标英文原文）
- 旁白：离线 TTS（sherpa-onnx + Kokoro multi-lang v1.1，中文男声 speaker 68），语速 0.9

## 目录

- `film/eras.js`：分段表（只用于 QA 分镜，全片同一个画面函数）
- `film/film.js`：黑板、粉笔笔画时间线、相机、字幕
- `film/timing.js`：由 `tools/build_audio.py` 生成的每句旁白起止时间
- `tools/lines.json`：旁白原文（`tts`）与字幕文本（`sub`）
- `tools/tts_lines.py`：逐句合成旁白，并用离线中文 ASR（paraformer-zh-small）回读校对
- `tools/build_audio.py`：把各句放到时间轴上，生成 `narration.wav`、`timing.js` 和 SRT（时间轴在 `START` 里改）
- `tools/mix_audio.py`：根据笔画时间表合成粉笔摩擦声，加极轻的底噪，与旁白混音
- `tools/probe_page.py`：加载片子页面，打印笔画顺延情况并导出笔画时间表

## 重做

```sh
E=.agents/skills/huashu-art-motion/scripts/engine        # 复制一份引擎到工作目录，记为 $W
cp -r $E $W && mkdir -p $W/demos/shape_stories && cp film/*.js $W/demos/shape_stories/
python tools/tts_lines.py <kokoro目录> <asr目录> tools/lines.json <cand目录> 0.9 68
python tools/build_audio.py <cand目录>/sid68 tools/lines.json <项目目录>     # 生成 timing.js，复制进 $W/demos/shape_stories/
uv run --with playwright==1.56.0 python tools/probe_page.py $W demos/shape_stories <项目目录>/音频/strokes.json
python tools/mix_audio.py <项目目录>
uv run --with playwright==1.56.0 python $W/render.py --film demos/shape_stories --fps 30 --out 画面.mp4
ffmpeg -i 画面.mp4 -i mix.wav -i 故事的形状.srt -map 0:v -map 1:a -map 2:s -c:v copy -c:a aac -c:s mov_text 故事的形状.mp4
```
