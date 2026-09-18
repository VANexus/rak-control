# ADR-0003：weapp 动效策略 —— GSAP 例外与 CSS 动效规范

- **日期**：2026-09-18 · **状态**：✅ 采纳（M1 使用 CSS transition/keyframes，未引入 GSAP）
- **背景**：
  1. ECO-ADR-0007：生态内 **GSAP 为动效第一优先**，交互效果优先于实现省事。
  2. GSAP 面向浏览器 DOM；微信小程序运行在双线程逻辑层/渲染层，**无 Web DOM**，无法按 web 方式使用 GSAP。
  3. 同生态又要求「现成优先、不造轮子」：不应在小程序里手写一套 rAF 补间引擎去「等效 GSAP」。
  4. 校园工具类小程序需要克制动效，但列表入场、页切换、反馈仍需达到 Linear/Vercel 级手感。
- **决策**：
  1. **本仓对 ECO-ADR-0007 的 GSAP 条款作实现层例外**：weapp 目标端 **不引入 GSAP**；若未来仅增编 H5 且需要编排动效，再评估引入，不在本 ADR 自动开通。
  2. **默认引擎 = WXSS**：`transition` + `@keyframes`，属性限 `transform` / `opacity`。
  3. **必要时**使用 Taro/小程序动画能力（如 `wx.createAnimation` 或 CSS 类切换）做状态反馈；**禁止**手写 RAF 补间、禁止引入第二套 web 动画库进 weapp。
  4. **时长与曲线**（与 token 对齐）：
     - 反馈：≤ 150ms
     - 组件进出场：≤ 250ms
     - 页面/区块入场：≤ 400ms
     - 曲线：`cubic-bezier(0.16, 1, 0.3, 1)`（`--ease-expo`）或 `ease-out`
  5. **禁止**：elastic/bounce/back 弹性夸张；动画宽高 margin 导致布局抖动；装饰性无限动画（运行态脉冲除外且必须很轻）。
  6. **列表**：可用轻 stagger（animation-delay 递增）；长列表不整段重放动画。
- **后果**：
  - DESIGN.md 动效章节以本 ADR 为准；
  - 「交互效果优先」仍有效，但实现手段降级为平台原生 CSS，不以「必须 GSAP」阻塞小程序交付；
  - 评审时动效缺失需说明原因，不得以「小程序做不了动效」为由零反馈交互。
