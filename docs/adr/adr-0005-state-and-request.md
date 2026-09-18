# ADR-0005：状态管理与请求层 —— 单出口、薄 Store、契约驱动

- **日期**：2026-09-18 · **状态**：✅ 采纳（用户裁决 2026-09-18：状态库 = mobx）
- **背景**：
  1. 生态 HTTP client 在 web 仓已分叉（ky/axios/SWR），§4 规定「新前端用宿主风格」；本仓独立小程序，需自有裁决。
  2. rak-auth 契约要求 RFC 7807 + `code` 分支，禁止消费方解析文案。
  3. 业务数据权威源在 rak-auth/PG，小程序只做消费与缓存，不能变成第二数据中心。
- **决策**：
  1. **请求层**：`src/utils/request.ts` 为唯一 HTTP 出口；基于 `Taro.request` 封装 baseURL、超时、`Authorization`、统一错误对象 `{ status, code, detail }`、401/403 登录恢复。业务分支 **只认 `code`**。
  2. **API 定义**：`src/services/*.ts` 只描述路径、DTO、调用函数；不直接操作 UI。
  3. **全局状态**：只放登录态、当前社团、主题等**客户端跨页状态**；服务端列表/ROI 不进全局 store 当第二真源。
  4. **状态库：`mobx`**（2026-09-18 用户裁决）。不引入 zustand/Redux/Jotai 等第二套。
     - store 文件放 `src/store/`；页面用 observer 消费；
     - store 不直接拼 HTTP 细节，调用 `services/*`；
     - 单社团模型下 `clubStore` 只保留「当前社团元数据 + 我的角色」，不做多社团切换队列。
  5. **缓存**：可对 GET 结果做页面级/Storage 短 TTL 缓存；写操作后失效相关缓存；禁止双写。
  6. **不采用**：SWR/React Query 进 weapp（非默认路径，若未来强需求另立 ADR）。
- **后果**：
  - 所有接口调用可追踪到 services + request 两层；
  - 错误处理与登录过期行为全站一致；
  - M1 安装 `mobx` + `mobx-react-lite`（或生态等价 React 绑定），并提供 `authStore` / `clubStore` 样板。
