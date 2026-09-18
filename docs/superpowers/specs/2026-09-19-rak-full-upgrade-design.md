# 设计：Rak 全面升级 —— 去 Mock + 后端落地 + 体验重做（2026-09-19）

> **状态**：已裁决（用户授权「全面开始，不再确认」，§3–§5 由架构侧按最优拍板）。
> **范围**：跨仓 —— rak-auth（后端，:8080 同进程）+ rak-control（微信小程序）。
> **硬约束**：不新增服务/端口；禁止自研 session；业务数据落 PG auth schema（ECO-ADR-0014）；
> 契约真源 = `rak-auth/docs/API.md`，先改契约再实现；有成熟库不造轮子。

---

## 0. 裁决基线

| 项 | 结论 |
|---|---|
| 范围 | 跨仓全做，代码中**不保留任何 mock**（`local-db.ts` 整体删除） |
| 产品 | 任务池 + ROI 财务**并存**，同轮并行做满 |
| 入驻 | 邀请码/扫码 **＋** 入队申请审批，双通道并存 |
| 导航 | 五 Tab：首页 · 任务 · ROI · 团队 · 我的；「任务进度」并入「我的」 |
| 风格 | 克制中性结构不变；双主题等价升级：light=白底 Linear 紫 `#5E6AD2`，dark=近黑分层 + Neon 青 `#22D3EE`（完整第二主题，非反色） |
| 节奏 | 契约先行 + 垂直切片：认证 → 任务池 → ROI → 公告/团队 → 管理/超级 |
| 提案 §9 拍板 | 未绑定=200+`bound:false`；manager 可生成邀请码；无邮箱兜底账号；super_admin Flyway 播种 |

---

## 1. 总体架构

```
rak-control (weapp)                        rak-auth :8080（同一进程、同一端口）
  Taro 4.2 · React 18 · mobx · Taroify       ├── 身份域（users/tenants/JWT/RLS，现状复用）
  pages + subpackage-admin                   ├── 新增 wechat 认证模块（code2session/bind/me）
  services/*（纯 request，无本地真源）         └── 新增 club 业务域
  store/{auth,ui,team,task} + roiStore            Java 新包 com.xrak.rakauth.club
  styles/tokens.scss（双主题）                     PG auth schema：Flyway V6/V7
```

- 微信侧调用（code2session、小程序码）引入 **WxJava weixin-java-miniapp**（成熟 SDK），
  AppId/AppSecret 仅存 rak-auth 环境变量（`WECHAT_MP_APPID` / `WECHAT_MP_SECRET` /
  `WECHAT_MP_ENABLED`），session_key 即抛不回传。
- 契约先行产物：① `rak-auth/docs/API.md` 合入微信认证 + club 业务两章；
  ② rak-auth 仓级 ADR（openid 绑定 + club 域落 auth schema）；
  ③ rak-control `types/domain.ts` 与 API.md 字段一一对齐。

## 2. 数据模型（Flyway V6，auth schema，沿用 RLS guard 模式）

V4 已将 `users.email/password_hash` 放宽为可空、唯一约束改租户内 —— 微信自动建号无障碍。

| 表 | 关键列 | 约束/说明 |
|---|---|---|
| `user_wechat_bindings` | user_id, platform, appid, openid, unionid | `UNIQUE(appid, openid)`；禁止自助换绑 |
| `clubs` | tenant_id, slug, name, logo_url, description, settings jsonb | `settings.memberDirectoryVisible` 等 |
| `club_members` | club_id, user_id, club_role, display_name, duty, status | `UNIQUE(club_id,user_id)`；duty=职务（契约新增，补提案缺口） |
| `club_invites` | club_id, code, created_by, max_uses, used_count, expires_at, revoked_at | 服务端计数防重放 |
| `club_announcements` | club_id, title(≤60), body, pinned, author_id, status, published_at | DRAFT/PUBLISHED/ARCHIVED |
| `club_tasks` | club_id, title(≤40), description, category, repo, acceptance_criteria, status, assignee_id, claimed_at, submitted_at, submit_note, approved_at, quality_grade, quality_note, rejected_at, reject_reason, created_by | 状态机服务端强制 |
| `club_roi_items` | club_id, title, category(`activity/project/other`), cost numeric(12,2), revenue numeric(12,2), participants, period_start, period_end, status(`PLANNING/ACTIVE/DONE/CANCELLED`), notes, created_by | roiRatio 仅服务端算；cost=0 → null |
| `club_join_requests` | club_id, applicant_name, applicant_wechat, reason, openid, user_id, status, reviewed_by, reviewed_at | 审批通过 → 自动建 user+binding+club_member(member) |

- 任务 category 枚举沿用现网：`cross-dashboard/content/ai-image/video-localize/infra/ops`。
- 初始数据：V6 播种 club（slug=flowmind）+ 产品所有者 super_admin 成员行
  （openid/userId 由配置注入，dev 可用占位）。
- 金额单位：元，numeric(12,2)，前端展示千分位两位小数。

### 2.1 任务状态机（真源在服务端）

```
OPEN --claim--> CLAIMED --submit--> SUBMITTED --approve(grade)--> APPROVED --archive--> DONE
                                     <--reject(reason)--/   （REJECTED 可 re-submit 回 SUBMITTED）
```

纠偏现 mock bug：驳回不再回 `CLAIMED`，进 `REJECTED` 状态且保留可重提。

### 2.2 绩效口径（服务端 SQL/Java 固化，前端只渲染）

- `claimedCount` = claimed_at 非空的任务数
- `completionRate` = approved（含归档）/ claimedCount
- `avgQualityScore` = APPROVED 任务质量分均值（A90/B75/C60/D40；无评级 APPROVED 不计入分母）
- `compositeScore` = round(completionRate × avgQualityScore)，无数据 = 0
- `rejectedCount` = 历史上出现过 reject 事件的任务数（按 rejected_at 计）

## 3. 认证与会话链路（客户端）

```
冷启动 app.ts → authStore.bootstrap()
  → Taro.login() 取 code → POST /api/ui/wechat/miniprogram/login
     ├─ bound:true  → setToken + GET me（clubRole/permissions）→ 渲染五 Tab（角色化入口）
     ├─ bound:false → 登录页：输邀请码 bind / 提交入队申请 / 扫码 scene 回填 code
     └─ 申请中      → 只读「等待审批」状态页（GET join-request 按 openid 查本人进度）
业务请求 401 → request.ts 静默重登（重走 Taro.login，一次），成功重放原请求；
              再失败 → reLaunch 登录页。403 → toast + 回首页（防深链越权）。
登出 → POST /auth/logout（尽力）+ 清 token → reLaunch login。
权限唯一真源 = GET me 的 clubRole + permissions；客户端仅做入口显隐与深链守卫，
服务端对每个管理端点独立校验 club_role（双保险）。
```

- `TARO_APP_API_BASE`：dev=`http://localhost:8080`（devtools 勾「不校验合法域名」），
  prod= rak-auth HTTPS 域名（上线前提供，见 OPEN-QUESTIONS C2）。
- 存储键 `rak-control:v2:*` 保留 theme；token 键不变；**所有业务数据不再落本地**。

## 4. 前端信息架构（五 Tab + 分包）

```
主包
├── pages/index/index            首页驾驶舱：我的待办、待验收( mgr+ )、ROI 速览、置顶公告、快捷动作
├── pages/auth/login             登录/绑定：静默登录失败兜底 + 邀请码 + 申请入队（同屏分段）
├── pages/auth/join-status       申请进度页（PENDING/APPROVED/REJECTED）
├── pages/task/pool              任务池（分段器：全部/待认领/进行中/待验收/已完成 + 搜索 + 分类 chips）
├── pages/task/detail            任务详情 + 认领/提交/验收/驳回/归档动作面
├── pages/roi/overview           ROI 概览（期间切换 + 收支/净额/ROI% + series 趋势图）
├── pages/roi/list               ROI 项目列表（状态/分类筛选）
├── pages/roi/detail             单项明细
├── pages/club/home              团队：社团头卡 + 公告摘要 + 成员目录入口 + 绩效榜(mgr+)
├── pages/club/announcement-list / announcement-detail
├── pages/club/members           成员目录（角色徽章/duty；无管理操作）
├── pages/me/profile             我的（头像+展示名+duty+角色徽章、我的任务速览、我的绩效卡、
│                                管理入口(mgr+)、超级入口(super)、主题切换、登出）
└── pages/me/tasks, me/performance   我的任务 / 我的绩效（原「任务进度」Tab 迁入）

subpackage-admin（入口仅 mgr+ 渲染；页面服务端兜底 403）
├── pages/admin/home             管理面板（按角色区块）
├── pages/admin/task-publish     发布任务
├── pages/admin/review           待验收队列（grade A-D + note / 驳回理由）
├── pages/admin/roi-edit         ROI 录入/编辑（表单 + 金额键盘）
├── pages/admin/announcements    公告 CRUD
├── pages/admin/members          成员管理（status 变更）
├── pages/admin/join-requests    入队申请审批
├── pages/admin/invites          邀请码生成/列表/作废 + 小程序码展示与分享
├── pages/admin/club-settings    社团设置
└── pages/super/roles            仅 super_admin：manager/member 任免 + 全量视图
```

- TabBar 图标全部重制（含新增 首页/ROI/团队 语义），`scripts/gen-tabbar-icons.py` 生成。
- 主题切换时调 `Taro.setTabBarStyle` 同步原生 TabBar 配色（native TabBar 不吃 CSS 变量）。
- 主包体积守 1.5MB：图表用纯 CSS/SVG（view 拼接柱状 + 折线），不引 ECharts 类库
  （weapp 现成图表库体积/维护性价比低，自绘 200 行内搞定，属「更简单」例外）。

## 5. 设计系统与体验升级

### 5.1 Token（唯一真源 `src/styles/tokens.scss`）

- 语义名对齐 Xra-space；新增分层 surface：`--color-bg / --color-surface-1 / --color-surface-2`。
- **light**：白底、`#0A0A0A` 正文、hairline `rgba(0,0,0,.08)`、brand `#5E6AD2`、success `#00C984`。
- **dark**：`#0A0A0A` 底 + `#141414/#1F1F1F` 分层、正文 `#FAFAFA`、hairline `rgba(255,255,255,.10)`、
  accent 切 Neon 青 `#22D3EE`（选中态/链接/数据高亮）、success `#00E599`。
  dark 的 brand 紫降为仅 logo 使用 —— 两套主题各自有强调体系，结构语言（圆角/间距/边框/密度）一致。
- 图表序列 `--color-chart-1..5` 双主题各配一组，顺序固定同指标跨图同色。
- 动效 token：`--dur-fast 120ms / --dur-base 200ms / --ease-expo cubic-bezier(.16,1,.3,1)`。

### 5.2 体验升级点（全页面统一执行）

1. **加载**：列表页骨架屏（卡片轮廓 shimmer），禁用全屏 spinner 白屏。
2. **空态**：每个列表定义专属空态插画位（CSS 绘制）+ 一句引导 + 主行动按钮。
3. **错误**：网络失败 = 内联错误卡 + 「重试」，不再只 toast。
4. **下拉刷新 + 触底分页**：任务池/ROI 列表/公告/成员全量启用（`enablePullDownRefresh` + 分页游标）。
5. **动效**（CSS transition，ADR-0003）：卡片入场 stagger（≤6 项）、Tab 内容淡入、
   主按钮按压缩放 0.98、ROI 数字滚动上屏、状态变更徽弹。
6. **即时反馈**：认领/提交/审批等操作乐观更新失败回滚 + toast；危险操作（作废/驳回/删除）
   统一确认 ActionSheet。
7. **表单**：错误内联提示（非 toast）、金额右对齐等宽数字、邀请码大写等宽、聚焦态 brand 描边。
8. **数字与金额**：千分位、两位小数、`roiRatio` 百分比一位小数、cost=0 显示 `—`。
9. 触控热区 ≥88rpx、底部 safe-area、滚动区 bounce 关闭。

### 5.3 Taroify 策略

继续使用 Taroify 行为组件（Button/Field/Dialog/Toast/Tabs/SwipeTo… ），皮肤全部走
`taroify-overrides.scss` token 化；卡片/任务卡/统计块等品牌件自绘（token 约束，禁硬编码色）。

## 6. 测试与验收

- **rak-auth**：每个新模块 Testcontainers/内嵌 PG 集成测试（状态机非法迁移 422/400、
  角色越权 403、邀请码过期/用尽、RLS 生效）；`mvn verify` 绿。
- **rak-control**：`pnpm build:weapp` 0 error；ESLint/Stylelint 0 error；无 `local-db` 引用残留。
- **端到端（dev）**：本机起 rak-auth → devtools 真码 flow：新 openid → 申请 → 审批 →
  重进绑定 → member 五 Tab 无管理入口；邀请码 bind；mgr 录 ROI/审任务；super 任免。
- **回归重点**：401 静默续登重放；深链进 admin 页拦截；双主题全页面走查。

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| 本机没有可跑的 rak-auth dev 库（mesh 直连集群） | 计划里先验证 `run-dev.sh`；不行则 local PG + `--spring.datasource` 覆盖 |
| 微信登录在 devtools 需真实 AppID+网络 | `WECHAT_MP_ENABLED` + dev-only `mockCode` 通道**不进生产代码路径**（服务端 profile 隔离），真机为准 |
| 契约中途变更 | 切片小步合入；API.md 每次变更同 PR 更新 `types/domain.ts` |
| 主包体积 | 分包预加载 preloadRule 保留；图标压缩；不引重依赖 |
| auth schema 混合加剧（ECO-ADR-0014 后果段） | 表前缀 `club_*` 边界清晰，为将来第 7 域迁出留切口 |

## 8. 文档回写（属本设计交付物）

- `rak-auth/docs/API.md`：§微信认证（新章）+ §club 业务 API（新章）+ 错误码总表扩充
- `rak-auth/docs/adr/`：openid 绑定 + club 域 ADR（采纳状态）
- `rak-control/docs/CONSTRUCTION.md`：产品改「任务池 + ROI 并存」、五 Tab、双通道入驻、字段表更新
- `rak-control/docs/DESIGN.md`：双主题规范（Neon dark）、图表色、体验规范（骨架/空态/动效）
- `rak-control/docs/adr/ADR-0004`：转采纳；提案文档标记已合入
