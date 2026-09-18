export type ClubRole = 'super_admin' | 'manager' | 'member'

export type ThemeMode = 'light' | 'dark'

export interface UserProfile {
  id: string
  displayName: string
  email?: string | null
  avatarUrl?: string | null
  status: 'ACTIVE' | 'DISABLED'
  duty?: string | null
}

export interface ClubInfo {
  id: string
  slug: string
  name: string
  description?: string | null
  logoUrl?: string | null
}

export interface ClubMember {
  userId: string
  displayName: string
  duty?: string | null
  avatarUrl?: string | null
  clubRole: ClubRole
  status: 'ACTIVE' | 'LEFT' | 'DISABLED'
  joinedAt: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  pinned: boolean
  publishedAt: string | null
  authorId: string
  authorName?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export interface InviteCode {
  id: string
  code: string
  maxUses: number
  usedCount: number
  expiresAt: string | null
  revokedAt: string | null
  qrPath: string
}

export interface MeResponse {
  user: UserProfile
  club: ClubInfo
  clubRole: ClubRole
  permissions: string[]
}

export interface LoginResult {
  bound: boolean
  accessToken?: string
  user?: UserProfile
  club?: ClubInfo | null
  clubRole?: ClubRole
  permissions?: string[]
  inviteRequired?: boolean
}

/** ===== 任务池 ===== */
export type TaskStatus =
  | 'OPEN'
  | 'CLAIMED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DONE'

export type TaskCategory =
  | 'cross-dashboard'
  | 'content'
  | 'ai-image'
  | 'video-localize'
  | 'infra'
  | 'ops'

export type QualityGrade = 'A' | 'B' | 'C' | 'D'

export const QUALITY_SCORE: Record<QualityGrade, number> = {
  A: 90,
  B: 75,
  C: 60,
  D: 40,
}

export interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  repo?: string | null
  acceptanceCriteria?: string | null
  status: TaskStatus
  assigneeId: string | null
  assigneeName?: string | null
  claimedAt: string | null
  submittedAt: string | null
  submitNote?: string | null
  approvedAt: string | null
  qualityGrade?: QualityGrade | null
  qualityNote?: string | null
  rejectedAt: string | null
  rejectReason?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MemberPerformance {
  userId: string
  displayName: string
  duty?: string | null
  role: ClubRole
  claimedCount: number
  approvedCount: number
  rejectedCount: number
  inProgressCount: number
  completionRate: number
  avgQualityScore: number | null
  compositeScore: number
}

export interface JoinRequest {
  id: string
  applicantName: string
  applicantWechat: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedAt: string | null
  reviewedBy: string | null
}

export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  'cross-dashboard': '跨境情报',
  content: '内容创作',
  'ai-image': 'AI 作图',
  'video-localize': '视频本地化',
  infra: '基础设施',
  ops: '运营品牌',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: '待认领',
  CLAIMED: '进行中',
  SUBMITTED: '待验收',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  DONE: '已归档',
}

export const REPO_OPTIONS = [
  'rak-runtime',
  'rak-flowmind',
  'cross-dashboard',
  'Xra-space',
] as const
