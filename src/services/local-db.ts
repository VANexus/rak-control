import Taro from '@tarojs/taro'
import {
  OWNER_DISPLAY_NAME,
  OWNER_USER_ID,
  STORAGE_KEYS,
  TEAM_NAME,
} from '@/constants'
import type {
  Announcement,
  ClubInfo,
  ClubMember,
  InviteCode,
  JoinRequest,
  Task,
  TaskCategory,
} from '@/types/domain'

// TODO(rak-auth 接入后)：
//   把 service 层函数体替换为 request({ url: '/api/v1/...', ... })
//   local-db.ts 仅作为离线缓存层，不再是真源。
//   字段名与 API.md 保持一致。

function read<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key)
    if (raw === '' || raw === null || raw === undefined) return fallback
    return raw as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  try {
    Taro.setStorageSync(key, value)
  } catch (e) {
    console.error('[local-db] write failed', key, e)
  }
}

export const defaultClub = (): ClubInfo => ({
  id: 'club-flowmind',
  slug: 'flowmind',
  name: TEAM_NAME,
  description: 'Vaneuxs 全仓库任务与考核',
})

export const seedMembers = (): ClubMember[] => [
  {
    userId: OWNER_USER_ID,
    displayName: OWNER_DISPLAY_NAME,
    duty: '产品负责人',
    clubRole: 'super_admin',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    userId: 'm1',
    displayName: '陈梓谦',
    duty: '考核负责人 / 数据采集',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm2',
    displayName: '黄嘉林',
    duty: '价值评估',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm3',
    displayName: '陈煜林',
    duty: '普通成员',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm4',
    displayName: '周慧玲',
    duty: '成本核算',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm5',
    displayName: '郭子康',
    duty: '普通成员',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm6',
    displayName: '李炫锋',
    duty: '任务发布',
    clubRole: 'manager',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm7',
    displayName: '肖希诗',
    duty: '质量审核',
    clubRole: 'manager',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
  {
    userId: 'm8',
    displayName: '张佳欣',
    duty: '普通成员',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T08:00:00.000Z',
  },
]

interface SeedTaskSpec {
  title: string
  category: TaskCategory
  description: string
  acceptanceCriteria: string
}

const SEED_TASKS: SeedTaskSpec[] = [
  {
    title: '短视频热词分离：TikTok 与亚马逊',
    category: 'cross-dashboard',
    description:
      '将 TikTok 热词与亚马逊热词在情报面板中分开展示，避免混在同一列表里。明确数据来源标签与筛选维度。',
    acceptanceCriteria: '可演示分开展示；有数据来源说明文档',
  },
  {
    title: '爆款视频：爬取 vs 外链对比调研',
    category: 'cross-dashboard',
    description:
      '调研「直接爬视频」与「跳转外链」两种方案的成本、稳定性、合规风险，产出对比结论与推荐路径。',
    acceptanceCriteria: '有对比结论文档；给出推荐方案',
  },
  {
    title: '选品模块：选品 API 接入调研',
    category: 'cross-dashboard',
    description:
      '作为辅助能力调研选品 API 接入方案，覆盖数据字段、调用限制、费用与 fallback 策略。',
    acceptanceCriteria: '有调研文档；列出候选 API 与字段',
  },
  {
    title: '重点类目市场调研报告模板',
    category: 'cross-dashboard',
    description:
      '产出一份类目调研报告模板，覆盖市场规模、竞品、价格带、内容打法，便于后续复用。',
    acceptanceCriteria: '有可复用模板文档；至少填一份示例',
  },
  {
    title: '一键切换国内/国外面板',
    category: 'cross-dashboard',
    description:
      '在 cross-dashboard 顶部增加国内/国外面板切换开关，切换后数据视图与导航同步变化。',
    acceptanceCriteria: '可演示切换；状态可记忆',
  },
  {
    title: '国内板块实操发布流程',
    category: 'cross-dashboard',
    description:
      '参考晨星，跑通国内账号内容发布流程，沉淀步骤清单与截图说明。',
    acceptanceCriteria: '有流程文档；可按文档复现',
  },
  {
    title: '国外板块竞品功能清单',
    category: 'cross-dashboard',
    description:
      '参考 cloud data / 出海匠等产品，整理国外板块竞品功能清单与差异点。',
    acceptanceCriteria: '有功能对照表文档',
  },
  {
    title: 'TikTok 短视频制作对标 Tago AI',
    category: 'cross-dashboard',
    description:
      '对 Tago AI 等工具做短视频制作对标拆解，输出功能、工作流与可借鉴点。',
    acceptanceCriteria: '有拆解文档与借鉴清单',
  },
  {
    title: '内容创作中心：标题生成提示词',
    category: 'content',
    description:
      '完善内容创作中心内置提示词（标题生成），覆盖多场景、可复用、可版本化。',
    acceptanceCriteria: '有提示词文档；界面可选用',
  },
  {
    title: '爆款对标作品链接整理',
    category: 'content',
    description:
      '整理当前爆款对标作品链接并归纳总结，给出可执行的内容方向结论。',
    acceptanceCriteria: '有链接清单；有方向总结',
  },
  {
    title: '文案多版本供选择',
    category: 'content',
    description:
      '内容创作流程每次产出 3 个文案版本供选择，界面支持切换与对比。',
    acceptanceCriteria: '可演示三版本对比',
  },
  {
    title: '画布：小红书真实界面对比模块',
    category: 'ai-image',
    description:
      '在 AI 作图画布上添加小红书真实界面对比模块，便于出图时对照版式与信息密度。',
    acceptanceCriteria: '画布可展示对比模块',
  },
  {
    title: '画布：提示词库按场景分类',
    category: 'ai-image',
    description:
      '在画布侧列出提示词库，按场景分类，支持快速填入当前作图任务。',
    acceptanceCriteria: '有分类列表；可一键填入',
  },
  {
    title: '口播中文翻译多语言流程',
    category: 'video-localize',
    description:
      '口播中文拍摄后翻译为其他语言，跑通从成片到多语言版本的完整流程。',
    acceptanceCriteria: '可演示一条多语言成片；有流程说明',
  },
  {
    title: '真人出镜对口型方案调研',
    category: 'video-localize',
    description:
      '调研剪映开源方案等真人出镜对口型能力，评估接入成本与效果。',
    acceptanceCriteria: '有调研结论与接入建议',
  },
  {
    title: '账号方案取代 VPN/手机攻关',
    category: 'infra',
    description:
      '当前标记为「已解决」但实际未解决，重新攻关账号方案，目标是直接取代 VPN/手机链路。',
    acceptanceCriteria: '有真实可用方案或明确阻塞说明',
  },
  {
    title: '各板块案例库结构',
    category: 'infra',
    description:
      '为每个板块补案例库结构：分类、字段、检索方式；案例很重要，先定结构再灌数据。',
    acceptanceCriteria: '有案例库结构文档；至少一个板块有样例',
  },
  {
    title: '搜索结果分类与数据来源',
    category: 'infra',
    description:
      '搜索结果按类型分类展示，并标明数据来源，避免用户无法判断可信度。',
    acceptanceCriteria: '结果有分类与来源标识',
  },
  {
    title: 'Slogan 宣传打包',
    category: 'ops',
    description:
      'Slogan 与宣传物料打包：先跨境再国内，统一口径与可用素材清单。',
    acceptanceCriteria: '有 slogan 清单与物料包',
  },
  {
    title: 'UI 小红书来源视觉规范',
    category: 'ops',
    description:
      'UI 像小红书：让人一眼知道来源是小红书，输出视觉规范（色板、版式、组件用法）。',
    acceptanceCriteria: '有视觉规范文档；界面可对照落地',
  },
]

function seedTasks(): Task[] {
  const now = new Date().toISOString()
  return SEED_TASKS.map((spec, index) => ({
    id: `task-seed-${index + 1}`,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    repo: null,
    acceptanceCriteria: spec.acceptanceCriteria,
    status: 'OPEN' as const,
    assigneeId: null,
    assigneeName: null,
    claimedAt: null,
    submittedAt: null,
    submitNote: null,
    approvedAt: null,
    qualityGrade: null,
    qualityNote: null,
    rejectedAt: null,
    rejectReason: null,
    createdBy: OWNER_USER_ID,
    createdAt: now,
    updatedAt: now,
  }))
}

export function ensureSeeded() {
  try {
    if (read(STORAGE_KEYS.seeded, false) === true) {
      if (!read<ClubInfo | null>(STORAGE_KEYS.club, null)) {
        write(STORAGE_KEYS.club, defaultClub())
      }
      return
    }
    write(STORAGE_KEYS.members, seedMembers())
    write(STORAGE_KEYS.club, defaultClub())
    write(STORAGE_KEYS.tasks, seedTasks())
    write<Announcement[]>(STORAGE_KEYS.announcements, [
      {
        id: 'ann-1',
        title: '欢迎使用 flowmind 任务考核',
        body: '任务池已开放认领。认领后请在 7 天内提交验收。未入册请先「申请加入」。',
        pinned: true,
        publishedAt: new Date().toISOString(),
        authorId: OWNER_USER_ID,
        authorName: OWNER_DISPLAY_NAME,
        status: 'PUBLISHED',
      },
    ])
    write<JoinRequest[]>(STORAGE_KEYS.joinRequests, [])
    write<InviteCode[]>(STORAGE_KEYS.invites, [])
    write(STORAGE_KEYS.seeded, true)
  } catch (e) {
    console.error('[local-db] ensureSeeded failed', e)
  }
}

export function getClub(): ClubInfo {
  ensureSeeded()
  return read(STORAGE_KEYS.club, defaultClub())
}

export function setClub(club: ClubInfo) {
  write(STORAGE_KEYS.club, club)
}

export function getMembers(): ClubMember[] {
  ensureSeeded()
  return read<ClubMember[]>(STORAGE_KEYS.members, seedMembers()).filter(
    (m) => m.status !== 'LEFT'
  )
}

export function setMembers(members: ClubMember[]) {
  write(STORAGE_KEYS.members, members)
}

export function getTasks(): Task[] {
  ensureSeeded()
  return read<Task[]>(STORAGE_KEYS.tasks, [])
}

export function setTasks(tasks: Task[]) {
  write(STORAGE_KEYS.tasks, tasks)
}

export function getJoinRequests(): JoinRequest[] {
  ensureSeeded()
  return read<JoinRequest[]>(STORAGE_KEYS.joinRequests, [])
}

export function setJoinRequests(list: JoinRequest[]) {
  write(STORAGE_KEYS.joinRequests, list)
}

export function getAnnouncements(): Announcement[] {
  ensureSeeded()
  return read<Announcement[]>(STORAGE_KEYS.announcements, [])
}

export function setAnnouncements(list: Announcement[]) {
  write(STORAGE_KEYS.announcements, list)
}

export function getInvites(): InviteCode[] {
  ensureSeeded()
  return read<InviteCode[]>(STORAGE_KEYS.invites, [])
}

export function setInvites(list: InviteCode[]) {
  write(STORAGE_KEYS.invites, list)
}

export function getCurrentUserId(): string | null {
  ensureSeeded()
  return read<string | null>(STORAGE_KEYS.currentUserId, null)
}

export function setCurrentUserId(id: string | null) {
  if (id) write(STORAGE_KEYS.currentUserId, id)
  else Taro.removeStorageSync(STORAGE_KEYS.currentUserId)
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
}
