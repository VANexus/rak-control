# ADR-0004：微信登录客户端架构 —— code2session → rak-auth

- **日期**：2026-09-18 · **状态**：草案（依赖 rak-auth 契约落地；被 ECO-ADR-0014 锁定方向）  
  产品侧入驻/角色裁决已于 2026-09-18 回写；完整服务端契约见
  [提案](../proposals/rak-auth-wechat-auth-contract.md)。
- **背景**：
  1. ECO-ADR-0014：认证走「微信 code2session → rak-auth」；**禁止自研 session**；
     openid 绑定属身份契约变更，须 rak-auth 仓级 ADR + 同步 `rak-auth/docs/API.md`。
  2. 小程序取不到 `.xrak.top` 浏览器 cookie，不能走 rak 现有 Hydra cookie 主路径。
  3. 生态不新增服务/端口；code2session 必须由 **rak-auth** 服务端完成，appsecret 不得进入小程序。
  4. 用户裁决（2026-09-18）：入驻 = **邀请码 + 扫码**；品牌 = **Rak**；管理员分层见下。
- **决策**：
  1. **客户端职责仅限**：`Taro.login` 取 `code` → 调 rak-auth login/bind → 保存 JWT → Bearer 调业务 API。
  2. **入驻（双通道，服务端同一 bind 语义）**：
     - 邀请码：`/pages/auth/login?invite=CODE` 或手输；
     - 扫码：小程序码路径同上，解析 query 后调 bind；
     - **禁止**扫码专用身份通道 / 本地「已注册」伪造。
  3. **草案端点**（最终以 `rak-auth/docs/API.md` 为准）：
     - `POST /api/ui/wechat/miniprogram/login` `{ code }` → 已绑定发 token；未绑定 `bound:false` 或 `wechat_user_unbound`
     - `POST /api/ui/wechat/miniprogram/bind` `{ code, inviteCode, displayName? }`
     - `GET /api/ui/wechat/miniprogram/me` → user + club + clubRole + permissions
  4. **角色与入口可见性（产品裁决）**：

     | club_role | 谁 | 客户端 UI |
     |---|---|---|
     | `super_admin` | 仅产品所有者 | 可见**完整超级后台**（任免管理层、社团设置、邀请码） |
     | `manager` | super_admin 指定 | 仅见**管理面板**（公告/成员运营/ROI 录入等）；**不见**超级后台与任免 |
     | `member` | 邀请码/扫码入驻 | **不出现任何管理入口**（菜单/路由双重隐藏） |

     服务端必须独立鉴权；前端隐藏只是体验层。
  5. **Token 保管**：内存优先；Storage 键 `rak-control:access_token`；**永不**存 appsecret/session_key。
  6. **过期恢复**：重新 `Taro.login` 静默续期；无 refresh token 除非契约明确提供。
  7. **登出**：调 `POST /auth/logout`（若可）+ 清本地状态。
  8. **品牌**：小程序对外名 **Rak**；导航/登录视觉用 DESIGN.md token（brand 点缀默认 `#5E6AD2`，可微调）。
- **后果**：
  - rak-auth 契约未合入前，小程序可做 UI/权限裁剪样板，**不得**宣称认证完成；
  - 字段名以 API.md 真源为准；
  - 初始 super_admin 播种、manager 能否发邀请码等细节以提案 §9 待确认项为准。
