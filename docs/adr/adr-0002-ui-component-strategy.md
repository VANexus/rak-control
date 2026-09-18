# ADR-0002：UI 组件策略 —— 现成库 + token 换肤，禁止重造 shadcn

- **日期**：2026-09-18 · **状态**：✅ 采纳（用户裁决 2026-09-18）
- **背景**：
  1. 用户与生态要求：风格对标 Linear / Vercel / Supabase / **shadcn/ui**；**有现成的用现成的，不要自己造轮子**。
  2. shadcn/ui、Radix、Tailwind 依赖真实 DOM 与 npm web 工具链，**不能**进入 weapp 产物。
  3. Taro React 生态有成熟组件库可提供行为基座（Dialog/Toast/Picker/Calendar/Uploader 等）。
  4. 风格差异主要来自色板、圆角、密度与边框，而不是组件行为逻辑本身。
- **决策**：
  1. **行为基座 = 现成 Taro React 组件库**（单选，不混用两套同职能库）。
  2. **指定库：Taroify（`@taroify/core`）**（2026-09-18 用户裁决）。
     不再引入 NutUI / VantUI 等第二套同职能库。
  3. **视觉层 = token 换肤**：通过 Taroify 主题变量 → 本仓 `--color-*` / `--radius-*` 映射，实现 shadcn 级观感（hairline、中性色、Vercel 反色主按钮）。映射集中在 `src/styles/theme/taroify-overrides.scss`。
  4. **简单原语**：布局与文本优先 `@tarojs/components`（View/Text/Image/ScrollView…）。
  5. **稀缺原子件**：库覆盖不到且高频需要时，才写 `components/atoms/*`，遵循 shadcn 词表（variant/size）+ token 样式 + 零业务。
  6. **禁止**：fork 组件库源码进仓大改；复制 shadcn 组件源码「翻译」成小程序；同一页面混用两套 Toast/Dialog。
  7. **图标**：优先 Taroify 图标 / lucide SVG 静态资源；禁止第二套彩色图标库。
- **后果**：
  - 视觉验收以 DESIGN.md 为准，不以「Taroify 默认皮肤」为准；
  - 库升级时先在 `taroify-overrides.scss` 验证主题变量未破坏；
  - shadcn 的**设计语言**（层级、变体命名、密度）被继承，**代码资产**不被继承；
  - M1 脚手架直接安装 `@taroify/core` 并完成主题覆盖样板。
