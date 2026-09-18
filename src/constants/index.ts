export const APP_NAME = 'Rak'
export const TEAM_NAME = 'flowmind 开发组'

/** 产品负责人本人，不在考核名册，不参与排名 */
export const OWNER_USER_ID = 'u-owner'
export const OWNER_DISPLAY_NAME = '产品负责人'

export const STORAGE_PREFIX = 'rak-control:v2:'

export const STORAGE_KEYS = {
  accessToken: `${STORAGE_PREFIX}access_token`,
  profile: `${STORAGE_PREFIX}profile`,
  club: `${STORAGE_PREFIX}club`,
  theme: `${STORAGE_PREFIX}theme`,
  members: `${STORAGE_PREFIX}members`,
  tasks: `${STORAGE_PREFIX}tasks`,
  joinRequests: `${STORAGE_PREFIX}joinRequests`,
  announcements: `${STORAGE_PREFIX}announcements`,
  invites: `${STORAGE_PREFIX}invites`,
  currentUserId: `${STORAGE_PREFIX}currentUserId`,
  seeded: `${STORAGE_PREFIX}seeded`,
} as const

export const API_BASE =
  process.env.TARO_APP_API_BASE || 'http://localhost:8080'

export const ROUTES = {
  index: '/pages/index/index',
  login: '/pages/auth/login',
  clubHome: '/pages/club/home',
  announcements: '/pages/club/announcement-list',
  announcementDetail: '/pages/club/announcement-detail',
  members: '/pages/club/members',
  myTasks: '/pages/my/tasks',
  taskDetail: '/pages/task/detail',
  taskJoin: '/pages/task/join',
  profile: '/pages/me/profile',
  settings: '/pages/me/settings',
  adminHome: '/subpackage-admin/pages/admin/home',
  adminAnnouncements: '/subpackage-admin/pages/admin/announcements',
  adminMembers: '/subpackage-admin/pages/admin/members',
  adminTaskPublish: '/subpackage-admin/pages/admin/task-publish',
  adminReview: '/subpackage-admin/pages/admin/review',
  adminJoinRequests: '/subpackage-admin/pages/admin/join-requests',
  adminInvites: '/subpackage-admin/pages/admin/invites',
  adminClubSettings: '/subpackage-admin/pages/admin/club-settings',
  superRoles: '/subpackage-admin/pages/super/roles',
} as const
