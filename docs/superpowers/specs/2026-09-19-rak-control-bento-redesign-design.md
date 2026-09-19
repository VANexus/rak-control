# rak-control 杂志 Bento 体验重做 · 设计规格

> 日期：2026-09-19 · 状态：已批准（用户逐节确认 §1/§2，§3/§4 授权直接定稿）
> 范围：全应用一次性重做（登录 + 5 Tab + 全部详情/子页 + 管理分包）
> 参考基准：用户提供的招新小程序实拍图 ×2（刊头排版、宫格入口、纸面纹理、敦实圆卡）
> 方向裁决：**Linear/Vercel 视觉语言不变，布局体验换代**；配色走「单紫加深版」。

## 0. 问题诊断（本次要解决的 6 条）

1. 首屏无主次——所有区块同一种 surface-card，是列表不是仪表盘
2. 无视觉锚点——90% 白底灰字，没有色块/大数字落点
3. 字体层级弱——标题/正文仅 1.3 倍差
4. 入口做成小灰按钮——高频动作没有配得上它的视觉权重
5. 节奏单一——每段都是同一种「左标题右'全部›'」
6. 核心数据被埋没——ROI 净额/比率挤在卡片角落

## 1. Token 体系

### 1.1 色彩（light）

| Token | 旧值 | 新值 | 说明 |
|---|---|---|---|
| `--color-background` | `#FFFFFF` | `#F4F3EE` | 纸白底，白卡靠阶差浮出 |
| `--color-card` | `#FFFFFF` | `#FFFFFF` | 不变 |
| `--color-brand` | `#5E6AD2` | `#4752A8` | 墨紫：降明度降饱和的印刷紫 |
| `--color-brand-pressed` | — | `#3A4490` | 按压态 |
| `--color-brand-soft` | — | `rgba(71,82,168,0.08)` | 选中态/浅底唯一稀释形式 |
| `--color-primary` | `#0A0A0A` | `#4752A8` | 主按钮改实底墨紫 |
| `--color-primary-foreground` | `#FFFFFF` | `#FFFFFF` | 不变 |
| `--color-foreground` | `#0A0A0A` | `#1A1A22` | 带蓝调墨黑 |
| `--color-muted-foreground` | `#737373` | `#6B6B76` | 偏冷灰 |
| `--color-border` | 8% 黑 | 8% `#1A1A22` | 色基跟随 foreground |
| `--color-surface-1/2` | `#FAFAFA/#F5F5F5` | `#FAF9F5/#EFEEE7` | 纸底两档 |
| success/warning/destructive | 不变 | 不变 | 状态色只表达状态 |

不引入第二装饰色相；DESIGN.md 原有「禁第三装饰色」戒律保持。

### 1.2 背景纹理

页面底与 paper 卡面叠方格线：`repeating-linear-gradient`，线色
`rgba(26,26,34,0.035)`（dark：`rgba(255,255,255,0.04)`），格距 `48rpx`。
纯 CSS，无图片资源。纹理对比度 ≤ 4%，定性为「质感」非「装饰」。

### 1.3 字体层级

| 用途 | 旧 | 新 |
|---|---|---|
| kicker（刊头英文小标） | 无 | 20rpx / 600 / letter-spacing 2rpx / 大写 / muted |
| display（刊头主标、hero 数字） | 无 | 56rpx / 700（数字等宽 tabular-nums） |
| 页面标题 `.text-title` | 36/600 | 40/700 |
| 卡片标题 `.text-card-title` | 28/500 | 32/600 |
| 正文/次级/微型 | 28/24/20 | 不变 |

### 1.4 圆角

`--radius-lg` 20→**28rpx**；新增 `--radius-xl: 40rpx`（hero 主角块）。
其余档位不变。

### 1.5 DESIGN.md 契约修订（三处）

1. 「每屏一个主操作」→「每屏一个**主角块**」（实底色块，装主操作或 hero 数据）
2. 允许大面积品牌实色块作为布局元素（仍禁渐变/玻璃拟态/glow）
3. 允许低对比方格纹理作为背景质感（对比度 ≤ 4%）

### 1.6 Dark 主题

底 `#101014`、卡 `#17171C`、muted `#1F1F26`；强调色**保持 Neon 青 `#22d3ee`**
（hero 实底、tile 徽章、主按钮用青），`--color-logo` 保持 `#5E6AD2`。
纹理线 `rgba(255,255,255,0.04)`。

## 2. 布局模式库（token 驱动，页面只组合）

全部落 `src/components/ui.tsx`（组件）+ `ui.scss`/`helpers.scss`（class）：

1. **`mag-head` 刊头**：kicker（英文）+ display 中文大标题 + 右侧状态胶囊；
   每屏顶部，替代 PageShell 现有标题行（PageShell 新增 `kicker/title/status` props）。
2. **`hero-block` 主角块**：全宽墨紫实底（dark：Neon 青底墨黑字），radius-xl，每屏 ≤1。
   变体 `action`（大标题+说明+白色›）与 `metric`（display 等宽数字+副指标+迷你图）。
3. **`tile` 宫格入口**：2 列，单格高 300–360rpx；卡面 `solid|white|paper` 三种；
   右上角圆形徽章（✓ 或 →），下沿 32–36rpx/700 标题 + 24rpx 说明；**实底格每屏 ≤2**。
4. **`list-card` 列表卡**：白卡 + `list-row`（行高 ≥112rpx）；段头 = 小号中文粗标题 + muted 链接。
5. **`form-page` / `detail-page` 骨架**：表单=刊头+分组白卡+96rpx 纸底输入（focus 描墨紫）
   +吸底全宽实底紫主按钮；详情=刊头+hero 摘要块+分区白卡。
6. **状态模式**：空态 = paper 卡面 tile 占位 + 一句话 + 实底紫小按钮；Skeleton 与模式同尺寸。

TabBar：active 色换 `#4752A8`，用 `scripts/gen-tabbar-icons.py` 改色重生成。
动效沿用 ADR-0003：tile 按压 `scale(0.97)` ≤150ms，首屏 stagger 复用。

## 3. 逐屏构图

| 页面 | 结构 |
|---|---|
| auth/login | 纸底全屏 → 刊头（RAK WORKSPACE/Rak）→ hero-action（微信一键登录）→ tile×2（邀请码/加入进度）→ 底部小字 |
| auth/join-status | 刊头 + 状态大卡（display 状态词+说明+按钮） |
| index 首页 | 刊头（HOME/问候语/待验收胶囊）→ hero-metric（本月净额+ROI+迷你柱）→ tile×2-4（任务池/验收[manager]/公告/邀请码[manager]）→ list-card（我的进行中）→ list-card（最新公告）；manager 快捷动作并入 tile |
| task/pool | 刊头（TASKS/任务池/在池数胶囊）→ 分段器 → TaskCard 列表 |
| task/detail | 刊头（TASK DETAIL）→ hero-action 摘要（标题+状态+奖励）→ 分区白卡 → 吸底主按钮 |
| roi/overview | 刊头（ROI/经营看板/月份胶囊）→ hero-metric（净额+收支）→ 图表白卡 → tile（明细入口） |
| roi/list, detail | 列表/详情模式套用 |
| club/home | 刊头（CLUB/社团名）→ hero 摘要（置顶公告白卡大标题版）→ tile×3（成员/公告/社规）→ 公告 list-card |
| club/members, announcement-* | 列表/详情模式 |
| me/profile | 刊头（ME/昵称/RoleBadge 胶囊）→ hero 摘要（头像+职务+社团白卡）→ tile 2×2（业绩/历史任务/设置/管理后台[manager]）→ 退出 ghost |
| me/performance, tasks, settings | hero-metric + 列表 / form-page |
| admin/home | 刊头（CONSOLE/管理台）→ tile×8（发布任务/录入 ROI/邀请码/验收/成员/公告/社设/入团申请），实底 ≤2 |
| admin 表单页（task-publish/roi-edit/announcements/club-settings） | form-page 模式 |
| admin 列表页（review/members/invites/join-requests）+ super/roles | 刊头 + 列表+操作模式 |

## 4. 工程影响

- `src/styles/tokens.scss` + `theme/light.scss`/`dark.scss`：§1 全部值
- `src/styles/helpers.scss`：文字类升级、btn-primary 墨紫、badge--brand 色基、tile-grid
- `src/components/ui.tsx|scss`：新增 MagHead/HeroBlock/Tile/TileGrid，Card/TaskCard/MetricCard 换肤
- `src/components/page-shell.tsx` + `nav-bar.tsx`：刊头 props；导航栏透明化仅保留返回/切题
- 30+ 页面按 §3 重排构图（业务逻辑与数据流不动，只动 JSX 结构与 class）
- tabbar 图标重生成；`taroify-overrides.scss` 色值同步
- `docs/DESIGN.md` 修订 §1.5 三处契约 + 新 token 表

## 5. 验收

- 沿用 DESIGN.md §9 清单，另加：每屏 ≤1 hero 块、≤2 实底 tile；刊头三件套齐全；
  light/dark 目视通过；`pnpm build:weapp` 通过。
