# 提案：rak-auth 微信小程序登录契约（供仓级 ADR + API.md 合入）

> **来源**：rak-control（ECO-ADR-0014）· **日期**：2026-09-18  
> **状态**：提案（待 rak-auth 侧立项实现；**未合入 `rak-auth/docs/API.md` 前，rak-control 不得上线认证**）  
> **方向依据**：ECO-ADR-0014 —— 微信 code2session → rak-auth；禁止自研 session；不新增服务/端口。  
> **关联**：[rak-control ADR-0004](../adr/adr-0004-wechat-auth-client.md) · [CONSTRUCTION.md](../CONSTRUCTION.md)

---

## 1. 为何必须改 rak-auth

1. 小程序无 `.xrak.top` HttpOnly cookie，无法走 Hydra 浏览器会话主路径。
2. WeChat `code2session` 必须服务端持有 **AppSecret**；密钥不得进小程序/前端仓库。
3. 生态身份唯一真源 = rak-auth；openid 绑定属**身份契约变更**（宪法 §2）。
4. 端口/服务不新增：本能力落在 rak-auth **:8080** 现有进程内。

---

## 2. 建议 rak-auth 仓级 ADR 标题

`ADR-XXXX：微信小程序 openid 绑定与 miniprogram 登录（rak-control）`

决策要点：
- 新增表/列：微信身份绑定（openid，可选 unionid）
- 新增 UI 流端点：miniprogram login / bind / invite
- JWT claim **不改语义**（仍用 §4.1.1：`sub/uid/tid/scope/jti...`），小程序只多消费业务侧 `clubRole`
- AppSecret 仅存在于 rak-auth 环境变量，禁止落库明文、禁止出现在日志

---

## 3. 数据模型（建议，auth schema）

### 3.1 绑定表（或 users 扩展列）

**推荐独立表**（避免污染 users 主表、便于审计与唯一约束）：

```sql
-- 示意 DDL，最终以 rak-auth Flyway 为准
CREATE TABLE auth.user_wechat_bindings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform      text NOT NULL DEFAULT 'wechat_miniprogram',
  appid         text NOT NULL,
  openid        text NOT NULL,
  unionid       text NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appid, openid)
);
```

约束：
- `(appid, openid)` 全局唯一 → 一个微信身份只绑一个 rak-auth 用户。
- `unionid` 可空：无开放平台绑定时拿不到；**不得**用 unionid 作为登录主键。
- 解绑/换绑策略：仅 `platform:admin` 或超管后台可操作；线上默认**禁止用户自助换绑**（防盗绑）。

### 3.2 社团业务（ECO-ADR-0014：落 auth schema）

单社团为主，建议：

```sql
CREATE TABLE auth.clubs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES auth.tenants(id),
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,
  logo_url     text NULL,
  description  text NULL,
  settings     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth.club_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid NOT NULL REFERENCES auth.clubs(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_role    text NOT NULL,  -- super_admin | manager | member
  display_name text NULL,      -- 社团内展示名，可空则回落 users.display_name
  status       text NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | LEFT | DISABLED
  joined_at    timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

CREATE TABLE auth.club_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid NOT NULL REFERENCES auth.clubs(id) ON DELETE CASCADE,
  code         text NOT NULL UNIQUE,
  created_by   uuid NOT NULL REFERENCES auth.users(id),
  max_uses     int  NOT NULL DEFAULT 1,
  used_count   int  NOT NULL DEFAULT 0,
  expires_at   timestamptz NULL,
  revoked_at   timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

**角色矩阵（产品裁决 2026-09-18）**

| club_role | 谁 | UI 可见性 | 能力（客户端裁剪 + 服务端强制） |
|---|---|---|---|
| `super_admin` | 仅产品所有者（初始 1 人） | **完整超级后台**（仅自己可见入口） | 管理层任免、社团设置、邀请码/码管理、全部管理能力、查看全部 |
| `manager` | super_admin 指定 | **仅管理面板**（成员/公告/ROI 录入等）；**不可见**超级后台与任免入口 | 公告 CRUD、成员只读/基础管理、ROI 录入/调整、社团运营设置（不含任免 super） |
| `member` | 邀请码/扫码入驻的普通成员 | **无任何管理入口**（路由与菜单双重隐藏） | 公告只读、成员目录（若开放）、ROI 概览只读、个人资料 |

规则：
- **对外不显式展示管理员面板**：member 端不得出现「管理」Tab/按钮/占位。
- 管理入口仅在 `manager` / `super_admin` 的 JWT/`me` 载荷返回后渲染。
- 服务端必须独立鉴权：member 直接调管理 API → 403。

---

## 4. 端点契约（草案，合入 API.md 时定稿）

> 错误格式：RFC 7807 + `code`（与现 §2 一致）。  
> 认证成功响应统一带 `access_token`（RS256，claim 同 §4.1.1）。

### 4.1 微信小程序登录

```
POST /api/ui/wechat/miniprogram/login
Content-Type: application/json

{
  "code": "<wx.login code>",
  "appId": "<miniprogram appid>"   // 可选；缺省用服务端配置的 rak-control appid
}
```

**成功（已绑定）200：**

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "tenantId": "uuid",
    "displayName": "张三",
    "status": "ACTIVE"
  },
  "club": {
    "id": "uuid",
    "slug": "rak-club",
    "name": "Rak 社团",
    "role": "member"
  },
  "bound": true
}
```

**未绑定：** 建议 **200** + `bound: false`（小程序 UX 更顺；若 rak-auth 坚持 ProblemDetail 亦可，但须固定 code）：

```json
{
  "bound": false,
  "wechat": { "openidHint": "o***" },
  "inviteRequired": true
}
```

或 ProblemDetail：

```json
{
  "type": "about:blank",
  "title": "Unbound",
  "status": 403,
  "detail": "微信身份未绑定 Rak 账号",
  "code": "wechat_user_unbound"
}
```

**服务端步骤：**
1. 用 AppId/AppSecret 调微信 `jscode2session`，换取 `openid`（及可能的 `unionid`、`session_key`）。
2. **丢弃 session_key**（本方案不做微信解密手机号）；禁止返回给客户端。
3. 查 `user_wechat_bindings`：命中 → 取 user + club_member → 签发 JWT。
4. 未命中 → 返回未绑定信号（不自动建号，除非将来开放自助注册策略）。

### 4.2 邀请码 / 扫码绑定（入驻）

小程序扫码与手输邀请码共用同一绑定语义：**scene 只是来源，服务端只认 code**。

```
POST /api/ui/wechat/miniprogram/bind
Authorization: Bearer <弱会话或前置 login 得到的 bind_ticket>
// 若 login 未绑定时不发 access_token，则改为 body 携带 code + inviteCode 一次完成

Content-Type: application/json

{
  "code": "<wx.login code>",
  "inviteCode": "R7K2M9A",
  "displayName": "张三"          // 可选
}
```

**成功 200：** 与 §4.1 成功体相同（`bound: true`，`role: "member"`）。

**错误 code：**

| code | HTTP | 含义 | 小程序动作 |
|---|---|---|---|
| `wechat_user_unbound` | 403 | 仅 login 且未绑定 | 引导输码/扫码 |
| `invite_invalid` | 400 | 码不存在/格式错 | 重输 |
| `invite_revoked` | 400 | 已作废 | 重输 |
| `invite_expired` | 400 | 已过期 | 联系管理员 |
| `invite_exhausted` | 400 | 次数用尽 | 联系管理员 |
| `already_bound` | 409 | openid 已绑定 | 直接走 login |
| `club_not_found` | 404 | 社团不存在 | 错误页 |

**扫码场景：** 小程序码路径建议  
`/pages/auth/login?invite=R7K2M9A`  
解析 query 后调同一 bind 端点，**不要**另开扫码专用身份通道。

### 4.3 查询当前身份与社团角色（推荐）

```
GET /api/ui/wechat/miniprogram/me
Authorization: Bearer <access_token>
```

```json
{
  "user": { "id": "uuid", "displayName": "张三", "email": null, "status": "ACTIVE" },
  "club": { "id": "uuid", "name": "Rak 社团", "slug": "rak-club" },
  "clubRole": "manager",
  "permissions": ["announcement:read", "announcement:write", "roi:write", "member:read"]
}
```

用途：冷启动恢复 UI；**权限以服务端返回为准**，小程序只做入口显隐。

### 4.4 生成邀请码（管理）

```
POST /api/v1/clubs/{clubId}/invites
Authorization: Bearer <access_token>
// scope/clubRole: super_admin 或 manager（策略可配置，默认仅 super_admin + manager）

{
  "maxUses": 10,
  "expiresInDays": 30
}
```

```json
{
  "id": "uuid",
  "code": "R7K2M9A",
  "maxUses": 10,
  "usedCount": 0,
  "expiresAt": "2026-10-18T00:00:00Z",
  "qrPath": "/pages/auth/login?invite=R7K2M9A"
}
```

### 4.5 角色任免（仅 super_admin）

```
PUT /api/v1/clubs/{clubId}/members/{userId}/role
Authorization: Bearer <access_token>
// 必须 clubRole=super_admin；manager 调用 → 403

{ "clubRole": "manager" }   // manager | member（不可将他人升为 super_admin，除非平台管理员）
```

### 4.6 登出（对齐现有注销）

```
POST /auth/logout
Authorization: Bearer <jwt>
```

→ `{"revoked": true}`（幂等）。

---

## 5. JWT / Scope 建议

- 继续 RS256，JWKS `/.well-known/jwks.json` 不变。
- claim：`sub` / `uid` / `tid` / `jti` / `iat` / `exp` / `scope`（空格分隔）照旧。
- `scope` 建议最小集（club 业务可再并入角色权限）：
  - member: `openid club:read profile:read`
  - manager: 上者 + `club:write announcement:write roi:write member:read`
  - super_admin: 上者 + `club:admin member:write invite:write`
- **业务 API 鉴权**以 `club_members.club_role` + scope 双重校验；不要只信客户端隐藏入口。

---

## 6. 配置（rak-auth env，建议）

| 变量 | 说明 |
|---|---|
| `WECHAT_MP_APPID` | rak-control 小程序 AppID |
| `WECHAT_MP_SECRET` | AppSecret（Vault/集群 Secret，禁止进 git） |
| `WECHAT_MP_ENABLED` | 功能开关，便于灰度 |

多小程序预留：`WECHAT_MP_<NAME>_APPID/SECRET`；本提案首期只启用 rak-control。

---

## 7. 实施顺序（建议尽早）

| 步骤 | 仓 | 产出 |
|---|---|---|
| 1 | rak-auth | 仓级 ADR 采纳本提案 |
| 2 | rak-auth | Flyway：bindings + clubs + club_members + club_invites |
| 3 | rak-auth | 实现 §4 端点 + 审计日志 |
| 4 | rak-auth | **同步 `docs/API.md` 真源**（合入前不得对小程序宣称契约完成） |
| 5 | rak-control | 接真 API，去掉 mock 登录 |
| 6 | 双方 | 真机 code2session 联调（dev → 体验版） |

---

## 8. 安全与反模式

- 小程序**永不**持有 AppSecret；不在前端做 code2session。
- 不把 `session_key` 回传客户端或写入业务日志。
- 邀请码使用次数/过期/作废必须服务端计数，防重放。
- 管理接口服务端强制 `club_role`，禁止只靠前端隐藏。
- 契约字段名以最终 API.md 为准；rak-control 侧 `services/auth.ts` 只认 API.md。

---

## 9. 待 rak-auth 侧确认的细节

1. 未绑定返回 200+`bound:false` 还是 403+`wechat_user_unbound`（推荐前者，可改）。
2. 邀请码能否由 `manager` 生成（默认推荐可以，仅 `super_admin` 可任免角色）。
3. 是否需要邮箱/手机号兜底账号（当前：**微信绑定即成员身份**，无邮箱也可）。
4. 初始 `super_admin` 如何播种：Flyway/运维脚本绑定首个用户 openid 或 userId（产品所有者）。
