# rak-control 设计规范（DESIGN.md）

> 产品对外名称：**Rak**（小程序）· brand 墨紫 `#4752A8`（light）/ Neon 青 `#22d3ee`（dark）。
> 本文档是小程序 UI 实现的唯一视觉/交互契约。
> 风格基准：**Linear / Vercel / Supabase / shadcn/ui 的克制审美** + **杂志 Bento 布局体验**
> （纸白底纹理、刊头排版、实底主角块、宫格入口；见
> [specs/2026-09-19-rak-control-bento-redesign-design.md](./superpowers/specs/2026-09-19-rak-control-bento-redesign-design.md)）。
> 层级靠构图与字重，不靠重阴影、不靠渐变。
>
> **生态定位（ECO-ADR-0007 / ECO-ADR-0014）**：
> - design token 基准 = Xra-space `packages/ui/src/styles/tokens.css`
> - 小程序无 DOM、无 Tailwind 类名：**禁止直接照搬 web 类名**，必须走
>   token → 小程序样式桥接（CSS 变量 + RPX），见 [ADR-0001](./adr/adr-0001-design-token-bridge.md)
> - 组件**优先用现成库 + token 换肤**，禁止手写一套 shadcn 等价物，见 [ADR-0002](./adr/adr-0002-ui-component-strategy.md)（**已裁决：Taroify**）
> - 动效：weapp 下 GSAP **不可用**（无真实 DOM），见 [ADR-0003](./adr/adr-0003-weapp-motion-strategy.md)
>
> 关联：[CONSTRUCTION.md](./CONSTRUCTION.md)（架构与工程）· [adr/](./adr/)（决策记录）

---

## 1. 设计原则

1. **内容优先**：界面服务社团信息与 ROI 数据，装饰最小化；每屏一个**主角块**
   （hero-block：一块实底强调色区域，装主操作 *或* hero 数据）。
2. **克制中性 + 单点强调**：中性纸灰阶为主；强调色只用于主角块、主按钮、选中态、关键状态。
   允许大面积品牌**实色块**作为布局元素；仍禁渐变、玻璃拟态、glow。
3. **Linear 式层级 + 杂志式构图**：相邻面用「底色阶差 + 1px hairline + 低对比方格纹理」区分；
   纹理对比度 ≤ 4%，定性为质感而非装饰。
4. **Supabase / Vercel 式密度**：信息密度可控但呼吸感在；同层级控件高度、卡片内边距全站一致。
5. **双主题等价**：本仓默认 **light**（校园移动场景），dark 作为完整第二主题同步维护，
   不是简单反色。与 rak 控制台 dark-first 的差异是**场景差异**，token 真源不变。
6. **现成优先**：能用成熟 Taro 组件库 / 官方能力解决的，绝不手写第二套。

---

## 2. Token 桥接（唯一真源映射）

### 2.1 桥接规则

| Web（Xra-space） | 小程序落点 | 说明 |
|---|---|---|
| `--background` 等 CSS 变量 | `src/styles/tokens.scss` → `page { --xxx }` | 语义名保持一致 |
| Tailwind 语义类 | Sass mixin / class（如 `.text-muted`、`.surface-card`） | **禁止**引入 Tailwind 运行时 |
| `0.625rem` 圆角基准 | `20rpx`（designWidth=750，1px 设计稿 = 2rpx） | 派生阶见 §4 |
| OKLCH | **HEX 落地**（本表值） | 旧基础库对 OKLCH 支持不稳，落地用 HEX |
| `--ease-expo` 等动效 token | 同名 CSS 变量 + CSS transition | GSAP 不适用于 weapp |

Token 定义只允许出现在 `src/styles/tokens.scss`；组件内**禁止**硬编码 hex / 阴影 / 圆角字面量。

### 2.2 色彩 Token（HEX 落地）

对齐 Xra-space「黑白灰 + 克制强调」+ rak 的 Linear 紫 / Neon 青点缀：

| Token | Light（默认） | Dark | 用途 |
|---|---|---|---|
| `--color-background` | `#F4F3EE` 纸白 | `#101014` | 页面底（叠方格纹理） |
| `--color-foreground` | `#1A1A22` | `#FAFAFA` | 正文（墨黑带蓝调） |
| `--color-card` | `#FFFFFF` | `#17171C` | 卡片面 |
| `--color-muted` | `#EFEEE7` | `#1F1F26` | 次级底 / 输入底 |
| `--color-muted-foreground` | `#6B6B76` | `#A3A3AD` | 次级文字 |
| `--color-border` | `rgba(26,26,34,0.08)` | `rgba(255,255,255,0.10)` | hairline |
| `--color-input` | `rgba(26,26,34,0.14)` | `rgba(255,255,255,0.16)` | 输入边框 |
| `--color-primary` | `#4752A8` | `#22D3EE` | 主按钮（实底强调色） |
| `--color-primary-foreground` | `#FFFFFF` | `#0A0A0A` | 主按钮文字 |
| `--color-brand` | `#4752A8` 墨紫 | `#22D3EE` Neon 青 | 主角块/宫格实底/active/focus |
| `--color-brand-pressed` | `#3A4490` | `#56DCEF` | 按压态 |
| `--color-brand-soft` | `rgba(71,82,168,0.08)` | `rgba(34,211,238,0.12)` | 选中态浅底 |
| `--color-on-accent` | `#FFFFFF` | `#0A0A0A` | 实底强调块上的文字 |
| `--color-logo` | `#5E6AD2` | `#5E6AD2` | logo 专用 Linear 紫 |
| `--texture-line` | `rgba(26,26,34,0.035)` | `rgba(255,255,255,0.04)` | 方格纹理线，格距 48rpx |
| `--color-success` | `#00C984` | `#00E599` | 成功 / 健康 ROI |
| `--color-warning` | `#E6A23C` | `#E6A23C` | 注意 / 告警（慎用第三色相） |
| `--color-destructive` | `#E5484D` | `#FF6369` | 危险 / 删除 |

规则：
- 禁止第三种装饰性彩色；状态色只表达状态。
- 正文对比度对 `--color-background` ≥ 4.5:1；次级文字 ≥ 3:1。
- 图表系列色预留 `--color-chart-1..5`（ROI 看板用），顺序固定、同指标跨图同色。

### 2.3 字体

- **正文/标题**：系统栈优先——
  `-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif`
  （小程序无法稳定自托管 Geist；观感通过字重、字距、层级逼近 Linear/Vercel）。
- **数字 / ID / 时间戳**：`font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace` + 等宽数字对齐（表格列右对齐）。
- 比例（RPX，designWidth 750）：

| 用途 | 字号 | 字重 | 备注 |
|---|---|---|---|
| **kicker**（刊头英文小标） | 20rpx | 600 | 大写，`letter-spacing: 2rpx`，muted |
| **display**（刊头主标、hero 数字） | 56–72rpx | 700 | 数字用等宽 tabular-nums |
| 页面标题 | 40rpx | 700 | tracking-tight |
| 卡片/宫格标题 | 32–34rpx | 600–700 | |
| 正文 / 列表 | 28rpx | 400 | 默认密度 |
| 次级说明 | 24rpx | 400 | `muted-foreground` |
| 微型标注 | 20rpx | 400 | 坐标轴、角标 |

---

## 3. 布局与间距

- **网格**：间距一律 4 的倍数；RPX 换算 `px * 2`（如 8px → 16rpx）。
- **背景纹理**：页面底与 paper 卡面叠方格线（`repeating-linear-gradient`，
  线色 `--texture-line`，格距 `--texture-cell: 48rpx`）；纯 CSS，禁图片。
- **布局模式库**（`src/components/ui.tsx`，页面只组合不发明）：
  `MagHead` 刊头（kicker + display 标题 + 状态胶囊）、`HeroBlock` 主角块（每屏 ≤1）、
  `TileGrid`/`Tile` 宫格入口（实底格每屏 ≤2）、`Card`+`list-row` 列表、
  form-page/detail-page 骨架、空/错/载三态。
- **页面边距**：左右 `32rpx`（16px）；列表卡片间距 `24rpx`。
- **卡片内边距**：`32rpx`；卡内行距 `16–24rpx`。
- **导航栏**：小程序原生导航优先 `custom`（自绘）以统一视觉；高度对齐微信胶囊，
  状态栏用 `wx.getMenuButtonBoundingClientRect()` 适配。
- **TabBar**：用原生 tabBar 或统一样式组件，图标 48rpx，选中 `--color-brand`，未选中 muted。
- **安全区**：底部 `env(safe-area-inset-bottom)`，操作条必留。

---

## 4. 圆角 / 边框 / 阴影

| Token | 值（rpx） | 用途 |
|---|---|---|
| `--radius-sm` | 8 | 小控件、输入框 |
| `--radius-md` | 12 | 按钮、Badge |
| `--radius-lg` | 28 | 卡片、宫格、弹层 |
| `--radius-xl` | 40 | 主角块 hero-block |
| `--radius-full` | 9999 | 胶囊、Avatar |

- 边框：`1rpx solid var(--color-border)`（hairline）；阴影几乎不用。
- 浮层（Popup/Dialog）允许 `box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08)`，仅此一档。
- 同一卡片内元素圆角 ≤ 卡片自身圆角。

---

## 5. 组件策略（不造轮子）

### 5.1 裁决顺序

1. **现成 Taro React 组件库** = **Taroify**（`@taroify/core`，2026-09-18 用户裁决）
2. Taro 官方组件（`@tarojs/components`：View / Text / Image / ScrollView / Input…）
3. 微信原生能力（`wx.*` API、原生 tabBar、支付、分享）
4. 以上都没有 → 才允许写原子件，且必须吃 token、零业务（见 §5.3）

**禁止**：把 shadcn/ui、radix、Tailwind 整链搬进小程序；禁止手写 Dialog/Toast/Picker/Calendar 等已有库能力；**禁止再引入第二套同职能组件库**（NutUI/Vant 等）。

### 5.2 视觉换肤约定

组件库只提供**行为与结构**；颜色、圆角、字号一律通过：

- Taroify CSS 变量 / SCSS 覆盖（`--taroify-*` 映射到本仓 `--color-*` / `--radius-*`）
- 或包一层 `.rak-*` class 覆盖（仅覆盖视觉，不复制组件源码）

映射表落在 `src/styles/theme/taroify-overrides.scss`，**一处修改全站生效**。

### 5.3 原子件铁律（仅库覆盖不到时）

- 文件放 `src/components/atoms/`；零业务、零请求、props 驱动。
- 样式只引用 token class / CSS 变量，禁止字面量颜色。
- 状态完备：disabled、pressed（`active` 态）、loading、空态。
- 变体命名对齐 shadcn 词表：`variant = default | secondary | outline | ghost | destructive`。

### 5.4 图标

- 优先 **lucide 图标** 的静态 SVG（经构建/字体方式引入）或组件库自带图标。
- 禁止第二套彩色功能图标；品牌类（微信）允许官方资源。
- 功能图标不得用 emoji 代替。

### 5.5 反馈

| 场景 | 方案 |
|---|---|
| 轻提示 | 组件库 Toast / `Taro.showToast`（统一封装 `src/utils/toast.ts`） |
| 骨架屏 | 与真实布局同尺寸 Skeleton；禁止整屏纯 spinner |
| 空态 | 一句说明 + 可选主动作 |
| 错误 | Toast + 页面内错误态；500/网络错误统一文案 |
| 危险操作 | ActionSheet / Dialog 二次确认；禁止静默删除 |

---

## 6. 动效（weapp 约束）

见 [ADR-0003](./adr/adr-0003-weapp-motion-strategy.md)。

- **默认引擎**：WXSS `transition` / `@keyframes`（transform + opacity）。
- **时长**：hover/press ≤ 150ms；组件进出场 ≤ 250ms；页面入场 ≤ 400ms。
- **缓动**：`cubic-bezier(0.16, 1, 0.3, 1)`（对齐 `--ease-expo`）或 `ease-out`。
- **禁止**：手写 RAF 补间、弹性/bounce/elastic、动画 `width/height/margin`。
- 列表入场可用 `animation-delay` 做轻微 stagger；单屏同时动画元素 ≤ 20。
- `prefers-reduced-motion` 在小程序侧不可用 → 保持动效极短极轻，避免感官负担。

---

## 7. 微信小程序 UI 最佳实践

1. **分包**：主包 ≤ 2MB；低频页面（管理、设置、说明）进分包。
2. **图片**：远程 CDN + 压缩；列表缩略图 ≤ 300px；禁止未压缩原图进包。
3. **滚动**：长列表用分页 + `ScrollView` 或虚拟列表库；禁止一次拉全量。
4. **点击目标**：最小可点区域 ≥ 88rpx（44px）；主按钮高 ≥ 88rpx；宫格 tile 高 ≥ 300rpx。
5. **导航深度**：页面栈 ≤ 5；深层改用 `redirectTo` / 分包页。
6. **自定义导航栏**：统一高度与胶囊避让；页面标题不超过 20 字。
7. **空/错/载三态**：每个列表与详情页必须齐全，缺一不许合并。
8. **无障碍语义**：可点区域加 `aria-label`（原生组件属性）；对比度达标。
9. **暗色**：主题切换时全局 class/token 覆盖，切换后所有页面目视验收。
10. **权限感知 UI**：member 不得出现管理入口的「灰显占位」；manager 不得出现超级后台区块。
    无权限深链一律拦截，不在页面内大段解释权限模型。
11. **登录/绑定**：品牌名 Rak；邀请码输入大写等宽；扫码与手输同一视觉表单，不两套 UI。
12. **金额与 ROI**：等宽数字、千分位、`roiRatio` 显示为百分比（如 `12.5%`）；`cost=0` 时 ROI 显示 `—`。

---

## 8. Do / Don't

**Do**
- 复用语义 token（`var(--color-muted)`），不写 hex 字面量（token 定义处除外）
- 数字、时间、金额统一等宽风格与对齐；hero 数据用 display 级大字
- 每屏一个主角块、实底 tile ≤ 2；危险操作二次确认
- 刊头三件套（kicker / display 标题 / 状态胶囊）逐屏齐全

**Don't**
- 不引入 Tailwind / shadcn / radix 进 weapp
- 不用渐变、玻璃拟态、霓虹 glow 做装饰（实色块与 ≤4% 方格纹理是布局/质感，允许）
- 不手写已有组件库能力（Dialog/Toast/Picker…）
- 不在组件里平行造一套颜色或圆角变量；实底强调块上的文字用 `--color-on-accent`
- 不只验 light 不验 dark；不只验有数据不验空态

---

## 9. 验收清单（新页面/新组件）

- [ ] 颜色/圆角/字号来自 tokens，无硬编码
- [ ] 基础交互来自约定组件库或官方组件，未重造轮子
- [ ] loading / empty / error 三态齐全
- [ ] light / dark 双主题目视通过
- [ ] 点击热区 ≥ 88rpx；主操作唯一且明显
- [ ] 动效 ≤ 400ms，只动 transform/opacity
- [ ] 主包体积未因本页资源显著膨胀（分包策略已评估）
- [ ] 与 Linear/Vercel/Supabase 完成度对照：层级清晰、密度一致、零多余装饰
