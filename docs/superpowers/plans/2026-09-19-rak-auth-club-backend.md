# rak-auth「微信小程序认证 + club 业务域」实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans。步骤用 `- [ ]` 跟踪。
> **设计真源**：`rak-control/docs/superpowers/specs/2026-09-19-rak-full-upgrade-design.md`
> **仓库**：`/home/xrak/Desktop/Shared/XRAK/team/rak-end/rak-auth`（分支模型沿用该仓现状 main）

**Goal:** 在 rak-auth 同进程（:8080）内落地微信小程序认证链路与 club 业务 API（任务池/ROI/公告/邀请/申请/成员/绩效），契约先合入 API.md。

**Architecture:** 六边形现有分层不动：`core`（domain/port/service 接口）→ `infrastructure`（JPA entity/repo/adapter，TenantGucBinder + RLS）→ `api`（REST/UI controller + ProblemDetail）。新表落 `auth` schema（Flyway V6）。微信调用用 WxJava SDK。

**Tech Stack:** Java 25 / Spring Boot 3.5.16 / Spring Data JPA / Flyway / PostgreSQL(auth schema, RLS) / Nimbus JWT(现有 TokenService) / WxJava weixin-java-miniapp / 集成测试直连集群库（`source .env` 后 `mvn -pl rak-auth-app -am test`）。

**既有模式锚点（照抄结构，勿发明新模式）：**
- Controller：`api/ui/UiFlowController.java`（返回 Map/record；`BearerAuthenticationFilter.principalOf/requireScope`）
- Adapter：`infra/persistence/adapter/UserRepositoryAdapter.java`（每方法先 `tenantGucBinder.bindCurrentTransaction()`，类级 `@Transactional`）
- 异常：`core/exception/*`（`InvalidRequestException`400 / `ForbiddenException`403 / `ResourceNotFoundException`404 / `DuplicateResourceException`409，errorCode 即契约 code）
- 发 token：`TokenService.issue(new TokenRequest(sub, tenantId, userId, scopes, null, null, ttl))`
- 测试：`rak-auth-app/src/test/.../IntegrationTestBase`（集群 PG，`slug()/email()` 防撞）

---

### Task 1: 契约合入 API.md + 仓级 ADR（先文档后代码）

**Files:**
- Modify: `rak-auth/docs/API.md`（新增两章 + 错误码总表扩充）
- Create: `rak-auth/docs/adr/adr-XXXX-wechat-miniprogram-and-club-domain.md`（编号接现有最大号）

- [ ] 1.1 API.md 新增「微信小程序认证」章：从 `rak-control/docs/proposals/rak-auth-wechat-auth-contract.md` §3/§4/§5/§6 合入，并落实裁决：未绑定=200+`bound:false`；manager 可生成邀请码；无邮箱兜底；申请审批通道（`join-request` 端点，审批通过自动建 user+binding+club_member(member)）
- [ ] 1.2 API.md 新增「club 业务 API」章：端点总表 + DTO 字段（与设计 §2/§2.1/§2.2 一致；任务状态机图；绩效公式；错误码 `task_not_claimable`/`task_invalid_transition`/`roi_invalid_amount`/`join_request_pending`/`invite_invalid`/`invite_expired`/`invite_exhausted`/`invite_revoked`/`wechat_user_unbound`/`already_bound`）
- [ ] 1.3 ADR：背景（ECO-ADR-0014）/ 决策（auth schema 内 club_* 前缀表、scope 映射、WxJava 依赖）/ 后果（auth 混合加剧，club_ 前缀留迁出切口）。状态=已采纳
- [ ] 1.4 `cd rak-auth && git add docs && git commit -m "docs: 合入微信小程序认证与 club 业务 API 契约（ADR + API.md）"`

### Task 2: Flyway V6 迁移（8 表 + 播种）

**Files:**
- Create: `rak-auth-app/src/main/resources/db/migration/V6__wechat_bindings_and_club_domain.sql`

- [ ] 2.1 写迁移（以下为完整 DDL，全部 `CREATE TABLE ... ; CREATE INDEX ...; ENABLE+FORCE RLS + tenant_isolation 策略`，RLS 模式抄 V1，俱乐部表通过 `clubs.tenant_id` join 校验的除外）：

```sql
CREATE TABLE user_wechat_bindings (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform varchar(32) NOT NULL DEFAULT 'wechat_miniprogram',
  appid varchar(64) NOT NULL, openid varchar(64) NOT NULL, unionid varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appid, openid)
);
CREATE TABLE clubs (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id),
  slug varchar(64) NOT NULL UNIQUE, name varchar(128) NOT NULL,
  logo_url text, description text, settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE club_members (
  id uuid PRIMARY KEY, club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_role varchar(16) NOT NULL, display_name varchar(64), duty varchar(64),
  status varchar(16) NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);
CREATE TABLE club_invites (
  id uuid PRIMARY KEY, club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  code varchar(16) NOT NULL UNIQUE, created_by uuid NOT NULL REFERENCES users(id),
  max_uses int NOT NULL DEFAULT 10, used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE club_announcements (
  id uuid PRIMARY KEY, club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title varchar(60) NOT NULL, body text NOT NULL, pinned boolean NOT NULL DEFAULT false,
  author_id uuid NOT NULL REFERENCES users(id), status varchar(16) NOT NULL DEFAULT 'DRAFT',
  published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE club_tasks (
  id uuid PRIMARY KEY, club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title varchar(40) NOT NULL, description text NOT NULL,
  category varchar(32) NOT NULL, repo varchar(64), acceptance_criteria text,
  status varchar(16) NOT NULL DEFAULT 'OPEN',
  assignee_id uuid REFERENCES users(id),
  claimed_at timestamptz, submitted_at timestamptz, submit_note text,
  approved_at timestamptz, quality_grade varchar(1), quality_note text,
  rejected_at timestamptz, reject_reason text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_club_tasks_status ON club_tasks (club_id, status);
CREATE INDEX idx_club_tasks_assignee ON club_tasks (assignee_id);
CREATE TABLE club_roi_items (
  id uuid PRIMARY KEY, club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title varchar(64) NOT NULL, category varchar(16) NOT NULL DEFAULT 'project',
  cost numeric(12,2) NOT NULL DEFAULT 0, revenue numeric(12,2) NOT NULL DEFAULT 0,
  participants int NOT NULL DEFAULT 0, period_start date, period_end date,
  status varchar(16) NOT NULL DEFAULT 'ACTIVE', notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE club_join_requests (
  id uuid PRIMARY KEY, club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  applicant_name varchar(64) NOT NULL, applicant_wechat varchar(64) NOT NULL,
  reason text NOT NULL, openid varchar(64) NOT NULL, appid varchar(64) NOT NULL,
  user_id uuid REFERENCES users(id),
  status varchar(16) NOT NULL DEFAULT 'PENDING',
  reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appid, openid) WHERE status = 'PENDING'  -- 部分唯一索引写法：CREATE UNIQUE INDEX ... WHERE status='PENDING'
);
```

（注：`UNIQUE ... WHERE` 不能内联，实现时写成 `CREATE UNIQUE INDEX uq_join_pending ON club_join_requests (appid, openid) WHERE status = 'PENDING';`）

- [ ] 2.2 播种（幂等，`ON CONFLICT DO NOTHING`）：默认 tenant 下 `clubs(slug='flowmind', name='flowmind 开发组')`；super_admin 成员行绑定 `rak.auth.club.owner-user-id`（配置注入；未配置则跳过播种，dev 用 bind 首人兜底为 super——**不采用**，宁缺毋滥：未配置时仅建 club，不建成员）
- [ ] 2.3 验证：`source .env && mvn -pl rak-auth-app -am package -DskipTests -q && java -jar rak-auth-app/target/*.jar --spring.profiles.active=dev` 启动日志 Flyway `Migrating schema "auth" to version "6"` 成功；Ctrl-C
- [ ] 2.4 commit：`git add rak-auth-app/src/main/resources/db/migration && git commit -m "feat: Flyway V6 微信绑定表与 club 业务域八表"`

### Task 3: WxJava 依赖与配置

**Files:**
- Modify: `pom.xml`（properties + dependencyManagement）、`rak-auth-infrastructure/pom.xml`
- Modify: `infra/config/RakAuthProperties.java`
- Create: `infra/wechat/WxMiniappConfig.java`
- Modify: `rak-auth-app/src/main/resources/application.yaml`（`rak.auth.wechat.*` 默认值）

- [ ] 3.1 依赖：`<weixin-java.version>4.7.9.B</weixin-java.version>`（以 Maven Central 最新稳定为准）→ `com.github.binarywang:weixin-java-miniapp`，放 infrastructure 模块
- [ ] 3.2 Properties：`rak.auth.wechat` → `enabled(false)/appid()/secret()/token-ttl(8h)`；env：`WECHAT_MP_APPID`、`WECHAT_MP_SECRET`、`WECHAT_MP_ENABLED`
- [ ] 3.3 `@Bean @ConditionalOnProperty("rak.auth.wechat.enabled") WxMaService`（`WxMaDefaultConfigImpl` 注入 appid/secret）；未启用时注入 `Optional<WxMaService>`，控制器报 `503 wechat_disabled`
- [ ] 3.4 commit

### Task 4: core 层（domain records + ports + service 接口）

**Files:**
- Create: `rak-auth-core/.../core/domain/club/`：`WechatBinding.java` `Club.java` `ClubMember.java` `ClubRole.java`(enum) `ClubTask.java` `TaskStatus.java`(enum+合法迁移表) `RoiItem.java` `Announcement.java` `InviteCode.java` `JoinRequest.java` `MemberPerformance.java`(record)
- Create: `rak-auth-core/.../core/repository/`：`WechatBindingRepositoryPort` `ClubRepositoryPort` `ClubMemberRepositoryPort` `ClubTaskRepositoryPort` `RoiItemRepositoryPort` `AnnouncementRepositoryPort` `ClubInviteRepositoryPort` `JoinRequestRepositoryPort`
- Create: `rak-auth-core/.../core/service/`：`WechatAuthService` `ClubService` `ClubTaskService` `RoiService` `AnnouncementService` `ClubInviteService` `JoinRequestService` `MemberPerformanceService`（接口 + 默认实现类都放 core/service/impl，照现有 RoleService/UserService 的接口-实现分离风格；若现有实现散在别处则跟随）

- [ ] 4.1 关键领域逻辑（完整实现要求）：
  - `TaskStatus.canTransit(from,to)`：OPEN→CLAIMED；CLAIMED→SUBMITTED；SUBMITTED→APPROVED|REJECTED；REJECTED→SUBMITTED；APPROVED→DONE；其余 false，违反抛 `InvalidRequestException("task_invalid_transition")`（DomainException 增加带 code 构造或新建 `TaskTransitionException`）
  - 绩效聚合 SQL 放 `ClubTaskRepositoryPort.performance(clubId)` 由 infra 实现：`claimed=claimed_at NOT NULL 计数；approved=status IN (APPROVED,DONE)；completion=approved::numeric/NULLIF(claimed,0)；avg_quality=AVG(CASE quality_grade A90/B75/C60/D40)；composite=ROUND(completion*avg_quality)`；`rejectedCount=rejected_at NOT NULL 去重任务数`
  - `RoiService.overview(clubId, period)`：`SUM(cost/revenue)`、net、`roiRatio=(rev-cost)/cost`（cost=0→null）、按 `date_trunc('month', COALESCE(period_start, created_at::date))` 分组 series（近 6 桶）
  - `WechatAuthService.login(code)`：WxJava `jsCode2Session` → openid → binding 命中？签发 token：命中取 user+club_member（`status=ACTIVE`），scope=clubRole 映射（member:`openid club:read profile:read task:claim task:submit performance:self roi:read announcement:read`；manager:+`task:publish task:review roi:write announcement:write member:read performance:all invite:write join:read join:write`；super:+`club:admin member:write`）+ `effectivePermissions` 并集；未命中返回 `bound:false`
  - `bind(code, inviteCode, displayName)`：重取 openid → 已绑定抛 `already_bound`(409) → 校验邀请码（存在/未废/未过期/未满 → 各自 code）→ **无账号自动建号**（复用 SMS-OTP/JIT 的无密码建号路径；email=null）→ 建 binding + club_member(member, display_name) → used_count+1（条件 UPDATE `WHERE used_count<max_uses` 防超发）→ 签发 token
  - `joinRequest(code, applicantName, applicantWechat, reason)`：openid 无 pending 申请（否则 `join_request_pending`）→ 落库；`approve(reqId, reviewer)`：建 user+binding+club_member(member) → 回写 req；`reject(reqId)`
- [ ] 4.2 commit：`feat: club 领域模型与端口`

### Task 5: infrastructure 持久化适配

**Files:**
- Create: `infra/persistence/entity/`：8 个 @Entity（照 UserEntity 风格，UUID 主键应用侧 `UUID.randomUUID()` 生成——沿用现库无 sequence 的现状）
- Create: `infra/persistence/repo/`：8 个 `JpaXxxRepository extends JpaRepository`（派生查询：`findByAppidAndOpenid`、`findByClubIdAndStatus`、分页 `Page<TaskEntity> findByClubIdAndStatusIn(...)` 等）
- Create: `infra/persistence/adapter/`：8 个 Adapter（每方法先 bind GUC；performance/overview 用 `entityManager.createNativeQuery` 写 §4.1 SQL）

- [ ] 5.1 实现全部 adapter；`ClubMemberRepositoryPort.findByUserId` 需跨租户视角（登录时按 user 找 club）→ 该查询走 system GUC（`TenantContext.setSystem()` 语义由 binder 支持，参照现有实现）
- [ ] 5.2 编译：`mvn -q -pl rak-auth-infrastructure -am compile`
- [ ] 5.3 commit

### Task 6: 微信认证控制器（/api/ui/wechat/miniprogram/*）

**Files:**
- Create: `rak-auth-api/.../api/ui/WechatMiniProgramController.java`

- [ ] 6.1 端点（对齐 API.md）：`POST login`、`POST bind`、`POST join-request`、`GET join-request`（按 Bearer 前登票据/openid 查本人进度）、`GET me`（Bearer；user+club+clubRole+permissions）、`POST logout` 复用现有 `/auth/logout`；响应字段蛇形↔驼峰按 API.md 定稿（DTO record 直接放 `api/dto/Dtos.java` 新内嵌组 `Wechat*`）
- [ ] 6.2 `GET me` 的 permissions 由 clubRole 映射数组返回（与 scope 同源），JWT 只当会话
- [ ] 6.3 手动冒烟（服务起 :8080）：无 SDK 环境时用 `WECHAT_MP_ENABLED=false` → login 返回 503 `wechat_disabled`，证明开关生效
- [ ] 6.4 commit

### Task 7: club 业务控制器（/api/v1/clubs/{clubId}/**）

**Files:**
- Create: `rak-auth-api/.../api/rest/club/ClubTaskController.java` `ClubRoiController.java` `ClubAnnouncementController.java` `ClubMemberController.java` `ClubInviteController.java` `ClubJoinRequestController.java` `ClubController.java` `ClubPerformanceController.java`
- Create: `api/rest/club/ClubAccess.java`（helper：从 principal 取 userId → `club_members` 查 `club_role`；`require(clubId, role...)` 不满足抛 ForbiddenException —— **服务端唯一鉴权真源**，scope 只做粗闸）

- [ ] 7.1 端点全表见设计 §2.3；分页统一 `?page=0&size=20` 返回 `{items,page,size,total}`；任务动作端点 `POST tasks/{id}/claim|submit|approve|reject|archive`（body 按契约）
- [ ] 7.2 邀请码 QR：`GET invites/{id}/qrcode` → WxJava `getQrcodeService().createWxaCodeUnlimitBytes(scene=code, page="pages/auth/login")` → `image/png` 字节流（enabled=false 时 503）
- [ ] 7.3 commit

### Task 8: 集成测试（TDD 补充片，跑集群库）

**Files:**
- Create: `rak-auth-app/src/test/java/com/xrak/rakauth/app/ClubDomainIntegrationTest.java`（extends IntegrationTestBase）
- Create: `.../WechatAuthProfileTest.java`

- [ ] 8.1 用例（每例先 TestRestTemplate/直调 service，数据用 `slug()` 隔离并 @AfterEach 清理 club 级联）：
  1. 任务状态机：OPEN→claim→submit→approve(A)→archive 全链 + 非法迁移 `task_invalid_transition`
  2. 驳回重提：approve 前 reject→REJECTED→submit→approve；绩效 rejectedCount=1
  3. 绩效公式：构造 2 approved(A,B)+1 claimed → completion=1/2、avg=82.5、composite=41
  4. ROI：cost=0 → roiRatio null；overview 聚合正确
  5. 邀请码：过期/用尽/作废三种失败 code；used_count 并发条件更新不超发
  6. 角色矩阵：member 调 `POST tasks`→403；manager 调 `PUT members/role`→403；super 放行
  7. join-request：PENDING 唯一约束；approve 后自动建 user+binding+member
- [ ] 8.2 `source .env && mvn -pl rak-auth-app -am test` 全绿；失败必修
- [ ] 8.3 commit + `git push origin main`

### Task 9: 交付验证

- [ ] 9.1 `mvn -q package -DskipTests` 产出 jar；`run-dev.sh` 起服务，`curl :8080/actuator/health` UP
- [ ] 9.2 契约抽查：login 未启用→503；bind 假码→400 `invite_invalid`；无 Bearer 调 club API→401/403 语义正确
- [ ] 9.3 API.md 若实现中字段有出入，**以改文档回写实现**收尾（同 PR），最终 commit push
