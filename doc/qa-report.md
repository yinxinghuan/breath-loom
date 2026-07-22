# Breath Loom QA 记录

## 运行验证

- 390×844：真实浏览器已检查原版基线、Material 幽灵手、玩家拖动和松手收束。
- 320×568：线场完整可见，标题和 44px 复位目标不越界。
- 引导中：`ghostState=drawing`、`tension=0.624`，证明幽灵手不是独立覆盖动画。
- 玩家按住：`tension=1.000`，触点归一化位置 `[0.630,-0.407]`。
- 释放峰值：290ms 时 `release=-0.954`，同一 80 条线明显收束。
- 恢复：2.7 秒后 `release=0`、`tension<0.000001`。
- 基线：HUD/幽灵均为 `display:none`，状态参数为零。
- 错误：`?forceError=1` 显示明确 Canvas 提示。
- 自动化控制台无 page error / console error；状态记录在 `_qa/ui/playwright-state.json`。
