# rak-control「去 Mock + 五 Tab 体验重做」实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans。步骤用 `- [ ]` 跟踪。
> **设计真源**：`docs/superpowers/specs/2026-09-19-rak-full-upgrade-design.md`；API 真源：`rak-auth/docs/API.md`（先后端计划 Task 1 定稿后再动本计划 Task 2）
> **仓库**：`/home/xrak/Desktop/Shared/XRAK/team/rak-end/rak-control`

**Goal:** 删除全部 mock（local-db 及种子数据），services/store 直连 rak-auth 真实 API，并按五 Tab 信息架构 + 双主题设计系统重做全部页面体验。

**Architecture:** 分层不变：pages（装配）→ store（mobx 全局态）→ services（纯 request）→ utils/request（唯一 HTTP 出口）。设计系统：tokens.scss 双主题 CSS 变量 + Taroify 换肤 + 自绘品牌件。

**Tech Stack:** Taro 4.2.1 / React 18 / TS 5 / Sass / mobx / Taroify / pnpm；验证 = `pnpm build:weapp` + ESLint/Stylelint 0 error。

---

### Task 1: 契约类型与常量对齐

**Files:**
- Modify: `src/types/domain.ts`（全量重写，字段=API.md 定稿）
- Modify: `src/constants/index.ts`

- [ ] 1.1 `types/domain.ts`：删除本地 mock 专属物（`REPO_OPTIONS` 保留为 UI 常量迁到 constants）；新增 `roi.ts` 相关类型：

```ts
export interface RoiItem {
  id: string; title: string; category: 'activity' | 'project' | 'other'
  cost: number; revenue: number; participants: number
  periodStart: string | null; periodEnd: string | null
  status: 'PLANNING' | 'ACTIVE' | 'DONE' | 'CANCELLED'
  notes: string | null; roiRatio: number | null; createdBy: string; updatedAt: string
}
export interface RoiOverview {
  period: 'month' | 'quarter' | 'year' | 'all'
  totalCost: number; totalRevenue: number; net: number
  roiRatio: number | null; itemCount: number
  series: { label: string; cost: number; revenue: number }[]
}
export interface Page<T> { items: T[]; page: number; size: number; total: number }
export interface WechatLoginResult { bound: boolean; accessToken?: string; user?: UserProfile; club?: ClubInfo; clubRole?: ClubRole; permissions?: string[]; inviteRequired?: boolean }
```

`Task` 增加 `'REJECTED'` 语义修正（枚举已有，状态迁移函数重写）；`TaskQuery = { status?, category?, keyword?, assigneeId?, page?, size? }`。
- [ ] 1.2 `constants/index.ts`：删 `OWNER_USER_ID/OWNER_DISPLAY_NAME/TEAM_NAME/seeded/members/tasks/...` mock 键；ROUTES 新增 `taskPool:'/pages/task/pool'`、`roiOverview/roiList/roiDetail`、`joinStatus:'/pages/auth/join-status'`、`myPerformance:'/pages/me/performance'`、`adminRoiEdit:'/subpackage-admin/pages/admin/roi-edit'`；`API_BASE` 保持 env 注入
- [ ] 1.3 commit：`refactor: 契约类型与常量对齐 API.md`

### Task 2: services 全量换真 request（本计划核心机械片）

**Files:**
- Delete: `src/services/local-db.ts`
- Rewrite: `src/services/auth.ts` `task.ts` `club.ts` `member.ts`
- Create: `src/services/roi.ts` `src/services/http.ts`（可选薄封装 `get/post/put/del`）

- [ ] 2.1 `auth.ts` 完整实现（模式即其余文件样板——**所有 service 只用 request，禁止任何 Taro.getStorageSync 业务数据**）：

```ts
import Taro from '@tarojs/taro'
import { request, setToken } from '@/utils/request'
import type { MeResponse, WechatLoginResult, ClubRole } from '@/types/domain'

const UI = '/api/ui/wechat/miniprogram'

export async function wxLogin(): Promise<WechatLoginResult> {
  const { code } = await Taro.login()
  return request<WechatLoginResult>({ url: `${UI}/login`, method: 'POST', data: { code }, auth: false })
}
export async function bind(inviteCode: string, displayName?: string): Promise<WechatLoginResult> {
  const { code } = await Taro.login()
  return request({ url: `${UI}/bind`, method: 'POST', data: { code, inviteCode, displayName }, auth: false })
}
export async function submitJoin(input: { name: string; wechat: string; reason: string }): Promise<{ id: string; status: string }> {
  const { code } = await Taro.login()
  return request({ url: `${UI}/join-request`, method: 'POST', data: { code, applicantName: input.name, applicantWechat: input.wechat, reason: input.reason }, auth: false })
}
export async function fetchJoinStatus(): Promise<{ status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' }> {
  return request({ url: `${UI}/join-request` })
}
export async function fetchMe(): Promise<MeResponse> { return request({ url: `${UI}/me` }) }
export async function logout(): Promise<void> {
  try { await request({ url: '/auth/logout', method: 'POST' }) } finally { setToken('') }
}
/** clubRole → 权限数组仅缓存展示用；服务端为准 */
export const PERMISSIONS_BY_ROLE: Record<ClubRole, string[]> = { /* 与 API.md scope 表同源 */ }
```

- [ ] 2.2 `task.ts`：`fetchTasks(q: TaskQuery): Promise<Page<Task>>`（GET `/clubs/{clubId}/tasks?status=&category=&keyword=&assigneeId=&page=&size=`）、`fetchTask(id)`、`publishTask(input)`、`claimTask(id)`、`submitTask(id, note)`、`approveTask(id, grade, note)`、`rejectTask(id, reason)`、`archiveTask(id)`；clubId 取自 `authStore.club.id`（模块内 getter `clubBase()`）
- [ ] 2.3 `roi.ts`：`fetchRoiItems(q)`、`fetchRoiOverview(period)`、`fetchRoiItem(id)`、`createRoiItem(input)`、`updateRoiItem(id, input)`、`deleteRoiItem(id)`
- [ ] 2.4 `club.ts`：公告（list/detail/create/update/pin/archive）、邀请（list/create({maxUses,expiresInDays})/revoke/qrPath 拼装 base64 图片 URL `/invites/{id}/qrcode`）、社团设置 GET/PATCH
- [ ] 2.5 `member.ts`：成员 list/patchStatus/setRole、绩效 fetchAllPerformance/fetchMyPerformance、申请 listJoinRequests/approve/reject
- [ ] 2.6 全局搜索 `local-db`，删除所有 import（含 `app.ts` 的 `ensureSeeded`）；`utils/request.ts`：401 静默重登重放：

```ts
let refreshing: Promise<boolean> | null = null
async function silentRelogin(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try { const r = await authWxLogin(); if (r.bound && r.accessToken) { setToken(r.accessToken); return true } return false }
      catch { return false } finally { /* noop */ }
    })().finally(() => { refreshing = null })
  }
  return refreshing
}
// request(): 401 && auth → if (await silentRelogin()) retry once; else recoverSession()
```

- [ ] 2.7 `pnpm build:weapp` 通过（页面报错在 Task 4–9 消除，此步允许先改 store 保编译）；commit：`feat: services 层全量接入 rak-auth 真实 API，删除 local-db`

### Task 3: store 重构（真会话 + 分页）

**Files:**
- Modify: `src/store/index.ts`
- Create: `src/store/roi.ts`（或并入 index，超过 400 行必须拆文件：`auth.ts/ui.ts/team.ts/task.ts/roi.ts` 五文件 + index 聚合导出）

- [ ] 3.1 `AuthStore.bootstrap()`：`wxLogin()` → bound ? `refreshMe()` : 状态 `UNBOUND`；新增 `status: 'LOADING'|'AUTHED'|'UNBOUND'|'JOIN_PENDING'`；login 成功若 `join-request` PENDING → JOIN_PENDING。删除 `loginAs`
- [ ] 3.2 `TaskStore`：分页游标（`page/hasMore/loadMore/filters`）、`claim/submit/approve/reject` 改真实调用 + 乐观更新失败回滚（保存快照 → `runInAction` 回滚 + toast）
- [ ] 3.3 新 `RoiStore`：overview(period)/items 分页/编辑动作；`TeamStore` 保持结构、去本地源
- [ ] 3.4 commit：`feat: mobx store 接入真实会话与分页`

### Task 4: 双主题设计系统与基础组件

**Files:**
- Modify: `src/styles/tokens.scss`、`src/styles/theme/light.scss`、`src/styles/theme/dark.scss`、`src/styles/theme/taroify-overrides.scss`、`src/app.scss`
- Create: `src/components/states.scss` + `src/components/states.tsx`（Skeleton/EmptyState/ErrorState）、`src/components/card.scss`
- Modify: `scripts/gen-tabbar-icons.py`（重绘五图标：首页/任务/ROI/团队/我的 × 选中/未选中 × 双主题色）

- [ ] 4.1 tokens：`--color-surface-1/2`、dark accent `#22D3EE`、`--color-chart-1..5` 双主题、动效 `--dur-fast/base --ease-expo`；`data-theme` 属性切类（沿用现有 uiStore.theme → PageShell 根类名机制）
- [ ] 4.2 `states.tsx`：

```tsx
export const Skeleton = ({ rows = 3 }: { rows?: number }) => (
  <View className='sk'>{Array.from({ length: rows }).map((_, i) => (
    <View key={i} className='sk-line' style={{ width: `${88 - i * 6}%` }} />))}</View>)
export const EmptyState = ({ title, hint, action }: {...}) => (...)   // CSS 绘制图形位 + 文案 + 主按钮
export const ErrorState = ({ onRetry }: {...}) => (...)               // 内联错误卡 + 重试
```

- [ ] 4.3 动效类：`.rise-in`（translateY+opacity，nth-child stagger ≤6）、`.pressable:active{transform:scale(.98)}`、`.shimmer`；theme 切换处调用 `Taro.setTabBarStyle`（light: `#ffffff/#737373/#5E6AD2`，dark: `#0A0A0A/#A3A3A3/#22D3EE`）
- [ ] 4.4 重新生成 TabBar 图标并核对主包体积；commit：`feat: 双主题设计系统升级（token/状态组件/动效/图标）`

### Task 5: 配置与导航骨架（五 Tab + 路由守卫）

**Files:**
- Modify: `src/app.config.ts`、`src/utils/permission.ts`、`src/components/page-shell.tsx`、`src/components/nav-bar.tsx`
- Create: 新页面壳文件（pool/roi 三页/join-status/me-performance）

- [ ] 5.1 app.config：pages 数组改设计 §4 清单（tabBar 五项：index/task/pool/roi/overview/club/home/me/profile；图标按 4.4；`selectedColor` 用 light 值，dark 靠 setTabBarStyle）；pages 顺序第一项保持 `pages/auth/login`（首帧守卫接管）
- [ ] 5.2 `permission.ts`：`useAuthGuard(need?: 'manager'|'super')` hook —— onShow 校验 `authStore.status/clubRole`，未登录 reLaunch login，越权 reLaunch index + toast；管理分包每页接入
- [ ] 5.3 commit

### Task 6: 登录/绑定/申请页（真实认证链）

**Files:**
- Rewrite: `src/pages/auth/login.tsx|login.scss|login.config.ts`
- Create: `src/pages/auth/join-status.tsx|config.ts`

- [ ] 6.1 login 页：进入即 `authStore.bootstrap()`（品牌页 loading 态）；UNBOUND → 分段控件「有邀请码 / 申请加入」；邀请码输入自动大写、粘贴友好、扫码 scene 回填（`Taro.getEnterOptionsSync().query.invite`）；错误按 code 分支文案（`invite_expired`→「邀请码已过期，请联系管理员」）
- [ ] 6.2 JOIN_PENDING → join-status 页：状态时间线（提交→审核中→结果）+ REJECTED 可重新提交
- [ ] 6.3 commit：`feat: 微信认证真实链路（静默登录/邀请码/扫码/申请审批）`

### Task 7: 首页驾驶舱（pages/index/index 重写）

- [ ] 7.1 区块（角色化）：问候行（displayName+duty+角色徽章）→「我的进行中」卡列表（≤3，跳详情）→ 待验收队列（mgr+，红点角标）→ ROI 速览卡（period=month：net + roiRatio + 迷你柱图，跳 roi/overview）→ 置顶公告卡（跳列表）→ 快捷动作行（发任务/录 ROI/生成邀请码，mgr+）
- [ ] 7.2 数据：useDidShow 并行 `taskStore.loadTasks({page:0,size:10})` + `roiStore.loadOverview('month')` + `teamStore.loadAnnouncements()`；骨架屏→内容 fade；下拉刷新
- [ ] 7.3 commit

### Task 8: 任务池与任务详情

**Files:**
- Modify: `src/pages/task/detail.tsx`（重写动作面与视觉）
- Create: `src/pages/task/pool.tsx|pool.config.ts|pool.scss`（取代 index 兼任列表的角色；index 变驾驶舱）

- [ ] 8.1 pool：Taroify Tabs 分段（全部/待认领/进行中/待验收/已完成→映射 status 组）+ 搜索条 + 分类 chips（TASK_CATEGORY_LABEL）；任务卡：左侧 3px 状态色条 + 标题 + 分类 chip + 认领人行（头像点+名+时间相对化 `format.ts` 补 `relTime()`）；触底 `loadMore`；空态「暂无任务，下拉看看 / 去发布」（mgr 见发布按钮）
- [ ] 8.2 detail：状态徽弹动效；按状态渲染主操作（claim 确认 sheet → submit Dialog 备注 → approve grade 选择器 A-D + note → reject 必填理由）；REJECTED 显示驳回原因卡 + assignee 可 re-submit；验收历史时间线
- [ ] 8.3 commit：`feat: 任务池与任务详情体验重做`

### Task 9: ROI 三页（新）

**Files:**
- Create: `src/pages/roi/overview.tsx|list.tsx|detail.tsx|roi.scss|*.config.ts`

- [ ] 9.1 overview：期间切换（月/季/年/全部）；三指标行（总收入/总成本/净额 等宽数字滚动动效 `useCountUp` 自绘 hook，CSS transition 实现）；ROI% 大数字（cost=0→`—`）；series 趋势 = 纯 view 双柱图（成本/收益并排，chart-1/2 色，高度百分比映射）+ 图例；ITEMCOUNT 说明行
- [ ] 9.2 list：状态筛选 + 分页；行卡：title + ¥金额千分位（右对齐 tabular）+ ROI 徽章（正绿负红→success/danger token）+ 期间
- [ ] 9.3 detail：字段全展示 + 构成条（cost/revenue 占比条）+ 编辑入口（mgr+ 跳 admin roi-edit?mode=edit&id）
- [ ] 9.4 commit

### Task 10: 团队 Tab 与我的 Tab

**Files:**
- Modify: `src/pages/club/home.tsx` `announcement-list.tsx` `announcement-detail.tsx` `members.tsx`；`src/pages/me/profile.tsx` `settings.tsx` `src/pages/my/tasks.tsx`
- Create: `src/pages/me/performance.tsx|config.ts`

- [ ] 10.1 club/home：社团头卡（名称/简介/统计行 成员数·进行中任务·本月 ROI）→ 公告最新 3 条（pinned 徽标）→ 成员目录入口 → 绩效榜区块（mgr+：compositeScore 排序条 + grade 分布）
- [ ] 10.2 announcement-detail：正文排版（行高 1.7、段距）、发布时间/作者；列表下拉刷新分页
- [ ] 10.3 me/profile：个人卡（首字母圆头像+duty+角色徽章）；「我的进行中 N / 待验收 N」速览跳；我的绩效卡（compositeScore 圆环 CSS conic-gradient）；管理面板/超级后台入口（角色渲染，member 零残留）；主题切换开关（触发 setTabBarStyle）；设置页保留关于/登出
- [ ] 10.4 my/tasks → 并入「我的任务」列表（segment：进行中/待验收/已完成）；my/performance 新页：五项指标卡 + 历史通过列表
- [ ] 10.5 commit：`feat: 团队与我的 Tab 体验重做`

### Task 11: 管理分包 + 超级后台

**Files:**
- Rewrite: `src/subpackage-admin/pages/**`（10 页）
- Create: `src/subpackage-admin/pages/admin/roi-edit.tsx|config.ts|admin.scss`

- [ ] 11.1 统一模板：`AdminPageShell`（返回导航 + 区块卡）；所有页接 `useAuthGuard('manager')`，super/roles 用 `useAuthGuard('super')`
- [ ] 11.2 task-publish：表单（标题≤40 计数、描述、分类 chips、repo 下拉、验收标准）+ 内联校验；review：待验收队列（滑动切组？保持点击）→ 详情抽屉 grade A-D 单选 + note；join-requests：卡片审批流（通过即自动建号提示文案）；invites：生成（maxUses/有效天）→ 列表（used/max、过期徽标）→ 详情弹层显示 `<Image src={qrDataUrl}>` 小程序码 + 复制码；announcements：列表 + 编辑器（DRAFT 发布两按钮）+ pin；members：role 徽章 + status 变更；club-settings：name/description/settings 开关；super/roles：任免 picker（仅 super 可见，服务端 403 兜底）
- [ ] 11.3 roi-edit：新建/编辑复用（query.id 判模式）；金额 digit 键盘、participants 整型、期间日期选择（Taroify DatetimePicker）
- [ ] 11.4 commit：`feat: 管理与超级分包接入真实 API 并重做体验`

### Task 12: 文档回写 + 终验

**Files:**
- Modify: `docs/CONSTRUCTION.md`（产品=任务池+ROI 并存、五 Tab、双通道入驻、字段表、里程碑 M2/M3/M4 状态）
- Modify: `docs/DESIGN.md`（双主题完整规范、图表色、体验规范九条）、`docs/adr/adr-0004-*`（转采纳）、`docs/proposals/*`（标记已合入）、`docs/OPEN-QUESTIONS.md`
- [ ] 12.1 `grep -rn "local-db\|loginAs\|ensureSeeded" src/` 必须零命中
- [ ] 12.2 `pnpm build:weapp` + lint 0 error；主包体积 <1.5MB 检查（build 日志）
- [ ] 12.3 联调清单执行（后端起 dev，weapp devtools 关域名校验）：新 openid→申请→审批→重登；邀请码 bind；mgr 全链；super 任免；401 续登；双主题走查
- [ ] 12.4 commit + push origin main

---

**依赖顺序：** Task 1–3（数据管道）与 Task 4（设计系统）可并行；Task 5–11 依赖 1–4；每 Task 独立 commit。**后端计划（rak-auth）Task 1–7 完成前，前端 Task 2 起无法联调，但可先按 API.md 定稿契约开发。**
