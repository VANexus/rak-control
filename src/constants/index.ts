export const APP_NAME = 'Rak'

export const STORAGE_PREFIX = 'rak-control:v2:'

export const STORAGE_KEYS = {
  accessToken: `${STORAGE_PREFIX}access_token`,
  theme: `${STORAGE_PREFIX}theme`,
} as const

export const API_BASE =
  (process.env.TARO_APP_API_BASE as string) || 'http://localhost:8080'

/** 微信小程序认证面（API.md §6） */
export const WECHAT_UI_BASE = '/api/ui/wechat/miniprogram'

/** club 业务面（API.md §7）；clubBase() 需登录后取 clubId */
export const CLUB_API_BASE = '/api/v1/clubs'

export const ROUTES = {
  index: '/pages/index/index',
  login: '/pages/auth/login',
  joinStatus: '/pages/auth/join-status',
  taskPool: '/pages/task/pool',
  taskDetail: '/pages/task/detail',
  roiOverview: '/pages/roi/overview',
  roiList: '/pages/roi/list',
  roiDetail: '/pages/roi/detail',
  clubHome: '/pages/club/home',
  announcements: '/pages/club/announcement-list',
  announcementDetail: '/pages/club/announcement-detail',
  members: '/pages/club/members',
  profile: '/pages/me/profile',
  myTasks: '/pages/me/tasks',
  myPerformance: '/pages/me/performance',
  settings: '/pages/me/settings',
  adminHome: '/subpackage-admin/pages/admin/home',
  adminTaskPublish: '/subpackage-admin/pages/admin/task-publish',
  adminReview: '/subpackage-admin/pages/admin/review',
  adminRoiEdit: '/subpackage-admin/pages/admin/roi-edit',
  adminAnnouncements: '/subpackage-admin/pages/admin/announcements',
  adminMembers: '/subpackage-admin/pages/admin/members',
  adminJoinRequests: '/subpackage-admin/pages/admin/join-requests',
  adminInvites: '/subpackage-admin/pages/admin/invites',
  adminClubSettings: '/subpackage-admin/pages/admin/club-settings',
  superRoles: '/subpackage-admin/pages/super/roles',
} as const

/** 任务发布表单的可选项（UI 常量，非契约） */
export const REPO_OPTIONS = [
  'rak-runtime',
  'rak-flowmind',
  'cross-dashboard',
  'Xra-space',
] as const
