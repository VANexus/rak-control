# ADR-0001：design token 桥接 —— Xra-space → 微信小程序

- **日期**：2026-09-18 · **状态**：✅ 采纳（M1 落地 `src/styles/tokens.scss` + helpers + theme-dark）
- **背景**：
  1. 生态裁决（ECO-ADR-0007）design token 基准 = Xra-space `packages/ui/src/styles/tokens.css`（OKLCH + Tailwind `@theme`）。
  2. rak-control 仅编译 **weapp**：无 DOM、无 Tailwind 运行时；类名不可照搬（ECO-ADR-0014 已提示）。
  3. 小程序基础库对 OKLCH/广色域支持不一致；组件库（Taroify）吃的是 CSS 变量或独立主题变量。
  4. 校园移动场景默认浅色更稳，但生态要求双主题完整维护，不能只做一套。
- **决策**：
  1. **真源仍声明为 Xra-space tokens**；本仓 `src/styles/tokens.scss` 是**桥接落地**，不是第二套设计系统。语义 token 名保持一致（`--color-background`、`--color-border`…）。
  2. **单位**：Taro `designWidth: 750`，设计稿 1px → 2rpx；圆角基准 10px → 20rpx（与基准 `--radius: 0.625rem` 对齐）。
  3. **色彩落地为 HEX**（见 DESIGN.md §2.2），不直接书写 OKLCH；与 Xra-space/rak 对照表写在 DESIGN.md，色板漂移时改对照表再改实现。
  4. **引入方式**：全局 `page { --color-*: ... }`；light 为默认，`.theme-dark` 或 `page.theme-dark`（随主题方案）覆盖 dark 集。禁止组件内再定义同名变量。
  5. **样式语言**：Sass + 语义 class（`.surface-card`、`.text-muted`…）/ 原生 rpx；**不引入 Tailwind**。
  6. **组件库变量**：另开 `theme/taroify-overrides.scss`（ADR-0002 裁决库 = Taroify）把库主题变量映射到本 token，禁止在业务页面直接改库变量。
  7. **GSAP**：weapp 不适用，动效 token 以 CSS 形式桥接（见 ADR-0003）。
- **后果**：
  - 任何新增颜色必须先进 `tokens.scss` + DESIGN.md 对照表，再被页面使用；
  - 与 web 端「Tailwind class 复用」彻底切断，多端一致靠 token 值与层级规则，不靠类名；
  - HEX 落地损失部分 OKLCH 观感弹性，换代价是兼容性与审查可预期；
  - Xra-space token 变更时需人工同步本仓对照表（生态路线图 #9 色板收敛仍进行中）。
