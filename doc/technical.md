# Breath Loom 技术文档

## 1. 技术栈

- Vanilla JavaScript + Vite 6.4.3。
- p5.js 1.4.0 instance mode，Canvas 2D 渲染。
- Web Audio API 提供轻量触摸与释放音效。
- 无图片、模型、纹理或运行时后端依赖。

## 2. 目录结构

- `src/main.js`：原始线场公式、p5 生命周期、pointer 状态、72 样本幽灵演示、释放时间线与音频。
- `src/style.css`：全屏舞台、极简 HUD、Material `touch_app`、加载和错误状态。
- `index.html`：页面骨架、Material Symbols Rounded 与 Vite 入口。
- `upstream/ATTRIBUTION.md`：原作、许可、版本和基线合同。
- `_qa/capture.mjs`：双移动尺寸、基线、按住、峰值、恢复和错误状态验证。
- `doc/`：需求、视觉、技术、QA 文档。

## 3. 核心模块

- 基线：`?baseline=1` 使用原版 `background(0,25)`、`frameCount*.008`、80×201 点、左右镜像和全部 wave 公式；HUD 与幽灵手完全隐藏。
- 产品参数：`tension / pointerX / pointerY / release` 只乘算或偏移原 `wave1 / wave2 / centerComplexity / base`；归零时回到原作。
- 状态时间线：700ms 达最大张力；松手 300ms 收束、650ms 外扩、1.65 秒三次缓出。
- 引导：72 个固定时间样本经 `applyGhostSample()` 补齐，并同时移动 Material 手和真实线场。
- 输入：舞台只使用 pointer 事件；复位按钮用 `pointerdown` 且阻止冒泡。
- 性能：线场每帧绘制 80×2×201 个顶点，不制造粒子对象或 DOM 节点；DPR 上限 2。
- 调试：`window.__BREATH_LOOM__` 暴露状态快照和 reset。

## 4. 扩展点

- 改原版密度：调整 `numLines / numPoints`，并同步 HUD、需求和性能 QA。
- 改触摸形态：调整四个原式倍率，保持 idle 值为 1/0。
- 改释放节奏：修改 300/650/1650 三段时间，不把动画改成按帧固定 lerp。
- 改引导路径：只调整 `applyGhostSample()` 的归一化曲线。
- 平台永久 UUID：`5eeb1dc6-a744-4dc4-a4b2-944c30f0e84d`。它已同步写入 `index.html`，后续版本不可更换。
