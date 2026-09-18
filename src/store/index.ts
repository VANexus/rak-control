import Taro from '@tarojs/taro'
import { makeAutoObservable, runInAction } from 'mobx'
import { ROUTES } from '@/constants'
import * as authService from '@/services/auth'
import * as taskService from '@/services/task'
import * as memberService from '@/services/member'
import * as clubService from '@/services/club'
import {
  getCurrentUserId,
  ensureSeeded,
  setCurrentUserId,
  getClub,
} from '@/services/local-db'
import { toast } from '@/utils/toast'
import type {
  Announcement,
  ClubInfo,
  ClubMember,
  ClubRole,
  InviteCode,
  JoinRequest,
  MemberPerformance,
  QualityGrade,
  Task,
  ThemeMode,
} from '@/types/domain'

function loadTheme(): ThemeMode {
  return (Taro.getStorageSync('rak-control:v2:theme') as ThemeMode) || 'light'
}

class AuthStore {
  currentUserId: string | null = null
  displayName = ''
  duty: string | null = null
  clubRole: ClubRole | null = null
  club: ClubInfo | null = null
  ready = false

  constructor() {
    makeAutoObservable(this)
    this.hydrate()
  }

  get isLoggedIn() {
    return Boolean(this.currentUserId)
  }

  get isManager() {
    return this.clubRole === 'manager' || this.clubRole === 'super_admin'
  }

  get isSuper() {
    return this.clubRole === 'super_admin'
  }

  hydrate() {
    try {
      ensureSeeded()
    } catch (e) {
      console.error('[store] seed', e)
    }
    const id = getCurrentUserId()
    runInAction(() => {
      this.currentUserId = id
      try {
        this.club = getClub()
      } catch {
        this.club = null
      }
      this.ready = true
    })
    if (id) void this.refreshMe()
  }

  async refreshMe() {
    if (!this.currentUserId) return
    try {
      const me = await authService.fetchMe()
      runInAction(() => {
        this.displayName = me.user.displayName
        this.duty = me.duty || null
        this.clubRole = me.clubRole
        this.club = me.club
        this.currentUserId = me.user.id
      })
    } catch {
      setCurrentUserId(null)
      runInAction(() => {
        this.currentUserId = null
        this.clubRole = null
        this.displayName = ''
      })
    }
  }

  async loginAs(userId: string) {
    const me = await authService.loginAs(userId)
    runInAction(() => {
      this.currentUserId = me.user.id
      this.displayName = me.user.displayName
      this.duty = me.duty || null
      this.clubRole = me.clubRole
      this.club = me.club
    })
  }

  async logout() {
    await authService.logout()
    runInAction(() => {
      this.currentUserId = null
      this.displayName = ''
      this.duty = null
      this.clubRole = null
    })
    await Taro.reLaunch({ url: ROUTES.login })
  }
}

class UiStore {
  theme: ThemeMode = 'light'

  constructor() {
    makeAutoObservable(this)
    this.theme = loadTheme()
  }

  setTheme(mode: ThemeMode) {
    this.theme = mode
    Taro.setStorageSync('rak-control:v2:theme', mode)
  }

  toggleTheme() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light')
  }
}

class TeamStore {
  members: ClubMember[] = []
  announcements: Announcement[] = []
  joinRequests: JoinRequest[] = []
  invites: InviteCode[] = []
  allPerformance: MemberPerformance[] = []
  loading = false

  constructor() {
    makeAutoObservable(this)
  }

  async loadMembers() {
    runInAction(() => {
      this.loading = true
    })
    try {
      const list = await memberService.fetchMembers()
      runInAction(() => {
        this.members = list
      })
    } catch (e) {
      toast((e as Error).message || '加载成员失败')
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async loadAnnouncements() {
    try {
      const list = await clubService.fetchAnnouncements()
      runInAction(() => {
        this.announcements = list
      })
    } catch (e) {
      toast((e as Error).message || '加载公告失败')
    }
  }

  async loadPerformance() {
    try {
      const list = await taskService.fetchAllMemberPerformance()
      runInAction(() => {
        this.allPerformance = list
      })
    } catch (e) {
      toast((e as Error).message || '加载考核失败')
    }
  }

  async loadJoinRequests() {
    try {
      const list = await memberService.fetchJoinRequests()
      runInAction(() => {
        this.joinRequests = list
      })
    } catch (e) {
      toast((e as Error).message || '加载申请失败')
    }
  }

  async loadInvites() {
    try {
      const list = await clubService.fetchInvites()
      runInAction(() => {
        this.invites = list
      })
    } catch (e) {
      toast((e as Error).message || '加载邀请码失败')
    }
  }

  async createInvite() {
    const inv = await clubService.createInvite()
    runInAction(() => {
      this.invites = [inv, ...this.invites]
    })
    return inv
  }

  async approveJoin(id: string) {
    await memberService.approveJoinRequest(id)
    await this.loadJoinRequests()
    await this.loadMembers()
  }

  async rejectJoin(id: string) {
    await memberService.rejectJoinRequest(id)
    await this.loadJoinRequests()
  }

  async setRole(userId: string, role: ClubMember['clubRole']) {
    await memberService.setMemberRole(userId, role)
    await this.loadMembers()
    await this.loadPerformance()
  }
}

class TaskStore {
  tasks: Task[] = []
  myPerformance: MemberPerformance | null = null
  loading = false

  constructor() {
    makeAutoObservable(this)
  }

  get openTasks() {
    return this.tasks.filter((t) => t.status === 'OPEN')
  }

  myTasks(userId: string | null) {
    if (!userId) return []
    return this.tasks.filter((t) => t.assigneeId === userId)
  }

  myActive(userId: string | null) {
    return this.myTasks(userId).filter(
      (t) => t.status === 'CLAIMED' || t.status === 'SUBMITTED'
    )
  }

  async loadTasks() {
    runInAction(() => {
      this.loading = true
    })
    try {
      const list = await taskService.fetchTasks()
      runInAction(() => {
        this.tasks = list
      })
    } catch (e) {
      toast((e as Error).message || '加载任务失败')
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async loadMyPerformance(userId: string | null) {
    if (!userId) {
      runInAction(() => {
        this.myPerformance = null
      })
      return
    }
    try {
      const p = await taskService.fetchMemberPerformance(userId)
      runInAction(() => {
        this.myPerformance = p
      })
    } catch (e) {
      toast((e as Error).message || '加载我的考核失败')
    }
  }

  async claim(taskId: string, userId: string) {
    await taskService.claimTask(taskId, userId)
    await this.loadTasks()
    await this.loadMyPerformance(userId)
  }

  async submit(taskId: string, note: string, userId: string | null) {
    await taskService.submitTask(taskId, note)
    await this.loadTasks()
    await this.loadMyPerformance(userId)
  }

  async approve(taskId: string, grade: QualityGrade, note: string) {
    await taskService.approveTask(taskId, grade, note)
    await this.loadTasks()
  }

  async reject(taskId: string, reason: string) {
    await taskService.rejectTask(taskId, reason)
    await this.loadTasks()
  }

  async publish(input: {
    title: string
    description: string
    category: Task['category']
    repo?: string | null
    acceptanceCriteria?: string | null
    createdBy: string
  }) {
    await taskService.createTask(input)
    await this.loadTasks()
  }
}

export const authStore = new AuthStore()
export const uiStore = new UiStore()
export const teamStore = new TeamStore()
export const taskStore = new TaskStore()
