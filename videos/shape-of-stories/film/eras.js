// 冯内古特「故事的形状」讲解片（黑板粉笔版，RSA 型：一整块大黑板＋相机移动）。语法卡：references/动画语法/y3_whiteboard.md
//   预览 index.html?film=demos/shape_stories   渲染 render.py --film demos/shape_stories --fps 30 --out 成片.mp4 --audio 旁白.wav
// 五段是同一个画面函数（段间不设转场，直接接续）（同一块板、同一台相机），段只是为了 qa 分镜。时间轴来自 timing.js（旁白每句的起止）。
window.PUNCH = 0;
window.SCENE_LIBS = ['demos/shape_stories/timing.js', 'demos/shape_stories/film.js'];
window.ERAS = [
  { id: 'vs_title', dur: 16.6 },                                                // 片名、第一句，相机移到坐标系
  { id: 'vs_axes', dur: 20.4 },         // 画坐标系，G/I/B/E
  { id: 'vs_hole', dur: 29.5 },         // 掉进坑里的人
  { id: 'vs_girl', dur: 33.5 },         // 男孩遇见女孩
  { id: 'vs_end', dur: 22.0 },          // 拉远看全图，点题
];
