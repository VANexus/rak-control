export default defineAppConfig({
  pages: [
    'pages/auth/login',
    'pages/index/index',
    'pages/club/home',
    'pages/my/tasks',
    'pages/me/profile',
    'pages/me/settings',
    'pages/club/announcement-list',
    'pages/club/announcement-detail',
    'pages/club/members',
    'pages/task/detail',
    'pages/task/join',
  ],
  subPackages: [
    {
      root: 'subpackage-admin',
      pages: [
        'pages/admin/home',
        'pages/admin/task-publish',
        'pages/admin/review',
        'pages/admin/members',
        'pages/admin/join-requests',
        'pages/admin/invites',
        'pages/admin/announcements',
        'pages/admin/club-settings',
        'pages/super/roles',
      ],
    },
  ],
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['subpackage-admin'],
    },
  },
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'Rak',
    navigationBarTextStyle: 'black',
    backgroundColor: '#ffffff',
  },
  tabBar: {
    color: '#737373',
    selectedColor: '#5E6AD2',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '任务',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/club/home',
        text: '团队',
        iconPath: 'assets/tabbar/club.png',
        selectedIconPath: 'assets/tabbar/club-active.png',
      },
      {
        pagePath: 'pages/me/profile',
        text: '我的',
        iconPath: 'assets/tabbar/roi.png',
        selectedIconPath: 'assets/tabbar/roi-active.png',
      },
      {
        pagePath: 'pages/my/tasks',
        text: '任务进度',
        iconPath: 'assets/tabbar/me.png',
        selectedIconPath: 'assets/tabbar/me-active.png',
      },
    ],
  },
})
