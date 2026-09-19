# rak-control 杂志 Bento 体验重做 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec `docs/superpowers/specs/2026-09-19-rak-control-bento-redesign-design.md` 完成全应用视觉换代：墨紫单强调 + 纸白纹理 + 刊头/Bento 布局模式，覆盖登录、5 Tab、全部子页与管理分包。

**Architecture:** 先改 token 层（全站自动换肤），再建布局模式库（MagHead/HeroBlock/Tile 三组件 + PageShell 刊头），最后逐页重排构图。业务逻辑、数据流、服务层零改动，只动 JSX 结构与 class。

**Tech Stack:** Taro 4.2.1 + React 18 + Sass（rpx）。无测试框架——验证 = `npx tsc --noEmit` + `pnpm build:weapp` 通过 + 目视清单。

**约定:** 每个 Task 结束必须 commit。颜色/圆角/字号只写在 tokens，页面禁止 hex 字面量。dark 主题强调色 = Neon 青（`--color-brand` 在 dark 已是 `#22d3ee`，实底块文字色用新 token `--color-on-accent` 自动切换）。

---

## Phase 1 · 基础层（Task 1–5）

### Task 1: tokens.scss 换代

**Files:** Modify `src/styles/tokens.scss`

- [ ] Step 1.1 light 块改值 + 新增 token：

```scss
page {
  --color-background: #f4f3ee;          /* 纸白底 */
  --color-foreground: #1a1a22;          /* 墨黑带蓝调 */
  --color-card: #ffffff;
  --color-card-foreground: #1a1a22;
  --color-muted: #efeee7;               /* 纸底深一档 */
  --color-muted-foreground: #6b6b76;
  --color-border: rgba(26, 26, 34, 0.08);
  --color-input: rgba(26, 26, 34, 0.14);
  --color-primary: #4752a8;             /* 主按钮 = 墨紫实底 */
  --color-primary-foreground: #ffffff;
  --color-primary-hover: #3a4490;
  --color-secondary: rgba(26, 26, 34, 0.06);
  --color-secondary-foreground: #1a1a22;
  --color-accent: rgba(71, 82, 168, 0.08);
  --color-brand: #4752a8;               /* 墨紫 */
  --color-brand-pressed: #3a4490;
  --color-brand-soft: rgba(71, 82, 168, 0.08);
  --color-on-accent: #ffffff;           /* 实底强调块上的文字 */
  --color-logo: #5e6ad2;
  --color-surface-1: #faf9f5;
  --color-surface-2: #efeee7;
  --color-success: #00c984;
  --color-warning: #e6a23c;
  --color-destructive: #e5484d;
  /* chart 1–5 不变 */
  --texture-line: rgba(26, 26, 34, 0.035);
  --texture-cell: 48rpx;
  --radius-sm: 8rpx;
  --radius-md: 12rpx;
  --radius-lg: 28rpx;                   /* 20 → 28 */
  --radius-xl: 40rpx;                   /* 新增：hero 块 */
  --radius-full: 9999rpx;
}
```

- [ ] Step 1.2 dark 块同步（保持 Neon 青，新增 on-accent/texture/pressed）：

```scss
page.theme-dark, .theme-dark {
  --color-background: #101014;
  --color-foreground: #fafafa;
  --color-card: #17171c;
  --color-card-foreground: #fafafa;
  --color-muted: #1f1f26;
  --color-muted-foreground: #a3a3ad;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-input: rgba(255, 255, 255, 0.16);
  --color-primary: #22d3ee;
  --color-primary-foreground: #0a0a0a;
  --color-primary-hover: #56dcef;
  --color-secondary: rgba(255, 255, 255, 0.1);
  --color-secondary-foreground: #fafafa;
  --color-accent: rgba(34, 211, 238, 0.12);
  --color-brand: #22d3ee;
  --color-brand-pressed: #56dcef;
  --color-brand-soft: rgba(34, 211, 238, 0.12);
  --color-on-accent: #0a0a0a;
  --color-logo: #5e6ad2;
  --color-surface-1: #121216;
  --color-surface-2: #17171c;
  --texture-line: rgba(255, 255, 255, 0.04);
  /* success/warning/destructive/chart 保持现值 */
}
```

- [ ] Step 1.3 `npx tsc --noEmit` 通过；commit `feat(tokens): 墨紫+纸白+方格纹理 token 换代`

### Task 2: helpers.scss 字体层级与纹理

**Files:** Modify `src/styles/helpers.scss`、`src/components/page.scss`

- [ ] Step 2.1 `.page` 背景叠方格纹理：

```scss
.page {
  min-height: 100vh;
  background:
    repeating-linear-gradient(0deg, var(--texture-line) 0 1px, transparent 1px var(--texture-cell)),
    repeating-linear-gradient(90deg, var(--texture-line) 0 1px, transparent 1px var(--texture-cell)),
    var(--color-background);
  color: var(--color-foreground);
  padding: var(--space-page);
  padding-bottom: calc(var(--space-page) + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
```

- [ ] Step 2.2 文字类升级 + 新增 kicker/display：

```scss
.text-title { font-size: 40rpx; font-weight: 700; letter-spacing: -1rpx; line-height: 1.3; }
.text-card-title { font-size: 32rpx; font-weight: 600; line-height: 1.4; }
.text-display { font-size: 56rpx; font-weight: 700; letter-spacing: -1.5rpx; line-height: 1.15; }
.text-display-mono {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 56rpx; font-weight: 700; letter-spacing: -1rpx; line-height: 1.15;
}
.text-kicker {
  font-size: 20rpx; font-weight: 600; letter-spacing: 2rpx;
  text-transform: uppercase; color: var(--color-muted-foreground);
}
```

- [ ] Step 2.3 `.badge--brand` 改 `background: var(--color-brand-soft); color: var(--color-brand);`；`.list-row` min-height 96→112rpx；`.page-shell` 删硬编码 hex 兜底行。commit `feat(styles): 字体层级 display 化 + 方格纹理底`

### Task 3: 布局模式组件（ui.tsx / ui.scss）

**Files:** Modify `src/components/ui.tsx`、`src/components/ui.scss`

- [ ] Step 3.1 `ui.tsx` 新增 MagHead / StatusPill / HeroBlock / TileGrid / Tile 五组件（现有导出不动）：

```tsx
export function MagHead({ kicker, title, status }: {
  kicker: string; title: ReactNode; status?: ReactNode
}) {
  return (
    <View className='mag-head'>
      <View className='flex-1'>
        <Text className='text-kicker'>{kicker}</Text>
        <Text className='mag-head__title'>{title}</Text>
      </View>
      {status ? <View className='mag-head__status'>{status}</View> : null}
    </View>
  )
}

export function StatusPill({ dot, text }: { dot?: boolean; text: string }) {
  return (
    <View className='status-pill'>
      {dot ? <View className='status-pill__dot' /> : null}
      <Text>{text}</Text>
    </View>
  )
}

export function HeroBlock({ variant = 'action', title, desc, onClick, children }: {
  variant?: 'action' | 'metric'; title?: ReactNode; desc?: ReactNode;
  onClick?: () => void; children?: ReactNode
}) {
  return (
    <View className={`hero-block hero-block--${variant} pressable`} onClick={onClick}>
      <View className='flex-1'>
        {title ? <View className='hero-block__title'>{title}</View> : null}
        {desc ? <View className='hero-block__desc'>{desc}</View> : null}
        {children}
      </View>
      {variant === 'action' ? <Text className='hero-block__arrow'>›</Text> : null}
    </View>
  )
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <View className='tile-grid stagger-in'>{children}</View>
}

export function Tile({ face = 'white', mark, title, desc, onClick, children }: {
  face?: 'solid' | 'white' | 'paper'; mark?: 'arrow' | 'check' | null;
  title: ReactNode; desc?: ReactNode; onClick?: () => void; children?: ReactNode
}) {
  return (
    <View className={`tile tile--${face} tile--pressable stagger-item`} onClick={onClick}>
      {mark ? (
        <View className={`tile__mark tile__mark--${mark}`}>
          <Text>{mark === 'check' ? '✓' : '›'}</Text>
        </View>
      ) : null}
      {children}
      <Text className='tile__title'>{title}</Text>
      {desc ? <View className='tile__desc'>{desc}</View> : null}
    </View>
  )
}
```

- [ ] Step 3.2 `ui.scss` 追加模式样式（全文见下，全部吃 token）：

```scss
.mag-head { display: flex; align-items: flex-start; gap: 16rpx; margin-bottom: 32rpx; }
.mag-head__title { display: block; font-size: 56rpx; font-weight: 700; letter-spacing: -1.5rpx; line-height: 1.15; margin-top: 8rpx; }
.mag-head__status { margin-top: 28rpx; flex-shrink: 0; }
.status-pill {
  display: inline-flex; align-items: center; gap: 10rpx; height: 48rpx; padding: 0 20rpx;
  border-radius: var(--radius-full); background: var(--color-card);
  border: var(--hairline) solid var(--color-border); font-size: 22rpx; color: var(--color-muted-foreground);
}
.status-pill__dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: var(--color-success); }

.hero-block {
  display: flex; align-items: center; gap: 24rpx; width: 100%; box-sizing: border-box;
  padding: 40rpx; border-radius: var(--radius-xl);
  background: var(--color-brand); color: var(--color-on-accent);
  transition: transform var(--duration-fast) var(--ease-expo);
}
.hero-block:active { transform: scale(0.98); background: var(--color-brand-pressed); }
.hero-block__title { font-size: 44rpx; font-weight: 700; letter-spacing: -1rpx; line-height: 1.25; }
.hero-block__desc { font-size: 24rpx; opacity: 0.75; margin-top: 8rpx; line-height: 1.5; }
.hero-block__arrow { font-size: 64rpx; font-weight: 700; line-height: 1; opacity: 0.9; }
.hero-block--metric { align-items: flex-start; }

.tile-grid { display: flex; flex-wrap: wrap; gap: var(--space-gap); }
.tile {
  position: relative; box-sizing: border-box; width: calc((100% - var(--space-gap)) / 2);
  min-height: 320rpx; padding: 28rpx; border-radius: var(--radius-lg);
  display: flex; flex-direction: column; justify-content: flex-end;
  transition: transform var(--duration-fast) var(--ease-expo);
}
.tile--pressable:active { transform: scale(0.97); }
.tile--white { background: var(--color-card); border: var(--hairline) solid var(--color-border); color: var(--color-card-foreground); }
.tile--solid { background: var(--color-brand); color: var(--color-on-accent); }
.tile--paper {
  background:
    repeating-linear-gradient(0deg, var(--texture-line) 0 1px, transparent 1px var(--texture-cell)),
    repeating-linear-gradient(90deg, var(--texture-line) 0 1px, transparent 1px var(--texture-cell)),
    var(--color-card);
  border: var(--hairline) solid var(--color-border); color: var(--color-card-foreground);
}
.tile__title { font-size: 34rpx; font-weight: 700; line-height: 1.3; letter-spacing: -0.5rpx; }
.tile__desc { font-size: 22rpx; opacity: 0.65; margin-top: 8rpx; line-height: 1.5; }
.tile__mark {
  position: absolute; top: 28rpx; right: 28rpx; width: 56rpx; height: 56rpx;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 700;
}
.tile__mark--arrow { background: var(--color-brand); color: var(--color-on-accent); }
.tile--solid .tile__mark--arrow { background: var(--color-on-accent); color: var(--color-brand); }
.tile__mark--check { background: var(--color-brand-soft); color: var(--color-brand); }
.tile--solid .tile__mark--check { background: var(--color-on-accent); color: var(--color-brand); }
```

- [ ] Step 3.3 `.metric-card__value` 字号 40→48rpx。commit `feat(ui): 刊头/hero/tile 布局模式组件`

### Task 4: PageShell 刊头 + NavBar 透明化

**Files:** Modify `src/components/page-shell.tsx`、`src/components/nav-bar.tsx`、`src/components/nav-bar.scss`

- [ ] Step 4.1 PageShell 新增 props `kicker?: string`、`headTitle?: ReactNode`、`headStatus?: ReactNode`；任一存在时渲染 `<MagHead kicker={kicker ?? ''} title={headTitle ?? title} status={headStatus} />` 于 children 前，且 NavBar `title` 传空串。
- [ ] Step 4.2 `.nav-bar` 背景 `transparent`、去底边线，仅留返回‹与主题切换。commit `feat(shell): PageShell 刊头模式 + 透明导航`

### Task 5: tabBar 与 Taroify 色值同步

**Files:** Modify `src/app.config.ts`、`src/styles/theme/taroify-overrides.scss`、`src/assets/tabbar/*-active.png`

- [ ] Step 5.1 app.config：`selectedColor '#4752A8'`、`color '#6B6B76'`、`window` 两处背景 `'#F4F3EE'`。
- [ ] Step 5.2 读 `scripts/gen-tabbar-icons.py`，active 色参数改 `#4752A8` 后重跑生成图标。
- [ ] Step 5.3 taroify-overrides 中 `#5e6ad2` → `#4752a8`。
- [ ] Step 5.4 `pnpm build:weapp` 通过。commit `feat(tabbar): 墨紫选中态与主题色同步`

---

## Phase 2 · 主包页面（Task 6–12）

> 通用手法：① PageShell 传 `kicker/headTitle/headStatus` 得刊头；② 主数据/主操作 → `HeroBlock`；③ 入口组 → `TileGrid`+`Tile`（实底 ≤2）；④ 列表 → 现有 `Card`+`list-row`。业务逻辑与数据加载一律不动。每页 `npx tsc --noEmit`，Phase 末 build + commit。

### Task 6: auth/login
刊头 `RAK WORKSPACE`；主登录 → `HeroBlock action`（若微信授权需 `Button openType='getPhoneNumber'`/`onGetUserProfile`，保留 Button 事件，套 hero 视觉 class）；邀请码加入 / 加入进度 → TileGrid（solid + white）；login.scss 字面量清退为 token。

### Task 7: pages/index（首页）
刊头 `HOME` + 问候语 + StatusPill（manager 待验收）；hero-metric：净额 `.text-display-mono` + ROI 率 + MiniBars（柱色 on-accent 半透明），整块点击进看板；TileGrid：任务池(solid)、任务验收[manager](white/check)、公告(paper)、邀请码[manager](white)；list-card：我的进行中、最新公告；删 home-actions 灰按钮段与 home-foot 文案。

### Task 8: task/pool + task/detail
pool：刊头 `TASKS` + StatusPill 在池数；分段器与列表保留。detail：刊头 `TASK DETAIL`；hero 摘要（标题+状态+奖励 display-mono）；分区白卡；底部按钮逻辑不动。

### Task 9: roi/overview + roi/list + roi/detail
overview：刊头 `ROI` + 月份胶囊；hero-metric 净额+ROI；图表白卡保留；明细入口 Tile(solid)。list/detail：刊头 + 套用模式；金额 display-mono/metric 48rpx。

### Task 10: club 四页
home：刊头 `CLUB` + 社团名；置顶公告 → HeroBlock action；TileGrid：成员(solid)、公告(white)、社规(paper)；公告 list-card。members：刊头 `MEMBERS` + 头像 list-row。announcement-list/detail：刊头 + 模式套用。

### Task 11: me 四页
profile：刊头 `ME` + 昵称 + RoleBadge 胶囊；信息白卡；TileGrid 2×2：业绩(solid)、历史任务(white)、设置(white)、管理后台[manager]（全页实底 ≤2，第四个用 white）；退出 btn-secondary。performance：刊头 + hero-metric + 列表。tasks：刊头 `MY TASKS` + 分段器 + TaskCard。settings：刊头 + 分组白卡 list-row。

### Task 12: auth/join-status + Phase 2 验收
join-status：刊头 `STATUS` + 状态 display 大字 + 说明 + btn-primary。`pnpm build:weapp`；commit `feat(pages): 主包页面杂志 Bento 重排`

---

## Phase 3 · 管理分包（Task 13–15）

### Task 13: admin/home
刊头 `CONSOLE` + 「管理台」+ StatusPill 待验收；TileGrid 8 格：发布任务(solid)、任务验收(solid/check)、录入 ROI(white)、邀请码(white)、成员管理(white)、公告发布(white)、社团设置(paper)、入团申请(paper)——实底恰好 2。

### Task 14: admin 表单页 ×4
task-publish/roi-edit/announcements/club-settings：刊头（`PUBLISH TASK`/`ROI ENTRY`/`ANNOUNCEMENT`/`CLUB SETTINGS`）+ 分组白卡 + form.scss 输入框纸底 96rpx（focus 描 `var(--color-brand)`）+ btn-primary 全宽吸底。

### Task 15: admin 列表页 ×4 + super/roles
review/members/invites/join-requests：刊头（`REVIEW`/`ROSTER`/`INVITES`/`REQUESTS`）+ 计数胶囊 + list-card + 行内 btn-secondary。super/roles：刊头 `ACCESS`。commit `feat(admin): 管理分包 Bento 重排`

---

## Phase 4 · 契约与终验（Task 16–17）

### Task 16: DESIGN.md 修订
§2.2 色彩表、§2.3 字体表、§4 圆角表按 spec §1 更新；§1 原则补「主角块」定义；§3 增纹理条目；§8 Don't 改为「禁渐变/玻璃拟态/glow，允许品牌实底块与 ≤4% 方格纹理」；§7 主操作原则 → 「每屏一个主角块」。

### Task 17: 终验
- [ ] `pnpm build:weapp` + `npx tsc --noEmit` 零错误
- [ ] 页面目录 grep 无新增 hex 字面量（tokens/overrides 除外）
- [ ] 每屏 ≤1 hero、≤2 实底 tile、刊头三件套齐全
- [ ] light/dark 逐 Tab 目视（微信开发者工具，用户侧）
- [ ] commit + push origin main
