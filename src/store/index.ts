import Taro from '@tarojs/taro'
import { makeAutoObservable, runInAction } from 'mobx'
import { API_BASE, ROUTES, STORAGE_KEYS, WECHAT_UI_BASE } from '@/constants'
import * as authService from '@/services/auth'
import * as taskService from '@/services/task'
import * as memberService from '@/services/member'
import * as clubService from '@/services/club'
import * as roiService from '@/services/roi'
import { setClubId } from '@/services/context'
import { ApiError, setToken } from '@/utils/request'
import { toast } from '@/utils/toast'
import type {
  Announcement,
  ClubBrief,
  ClubMember,
  ClubRole,
  InviteCode,
  JoinRequest,
  JoinStatusView,
  LoginOutcome,
  MemberPerformance,
  Paged,
  QualityGrade,
  RoiInput,
  RoiItem,
  RoiOverview,
  RoiPeriod,
  Task,
  TaskQuery,
  ThemeMode,
  UserInfo,
} from '@/types/domain'

/** 统一错误提示（契约 code → 文案） */
export function fail(e: unknown, fallbackMsg: string) {
  if (e instanceof ApiError) toast(e.userMessage)
  else toast((e as Error)?.message || fallbackMsg)
}

export type AuthStatus =
  | 'LOADING'
  | 'AUTHED'
  | 'UNBOUND'
  | 'JOIN_PENDING'
  | 'ERROR'

function loadTheme(): ThemeMode {
  return (Taro.getStorageSync(STORAGE_KEYS.theme) as ThemeMode) || 'light'
}

class AuthStore {
  status: AuthStatus = 'LOADING'
  user: UserInfo | null = null
  club: ClubBrief | null = null
  clubRole: ClubRole | null = null
  permissions: string[] = []
  joinStatus: JoinStatusView | null = null
  bootError: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get isLoggedIn() {
    return this.status === 'AUTHED' && !!this.user
  }

  get isManager() {
    return this.clubRole === 'manager' || this.clubRole === 'super_admin'
  }

  get isSuper() {
    return this.clubRole === 'super_admin'
  }

  /** 冷启动：静默登录 → 未绑定则探测申请进度（设计 §3） */
  async bootstrap() {
    runInAction(() => {
      this.status = 'LOADING'
      this.bootError = null
    })
    try {
      const out = await authService.wxLogin()
      if (out.bound) {
        await this.refreshMe()
        return
      }
      // 未绑定：看是否有待审批申请（403/失败按 UNBOUND 处理）
      try {
        const js = await authService.fetchJoinStatus()
        runInAction(() => {
          this.joinStatus = js
          this.status = js.status === 'PENDING' || js.status === 'APPROVED'
            ? 'JOIN_PENDING'
            : 'UNBOUND'
        })
      } catch {
        runInAction(() => {
          this.status = 'UNBOUND'
        })
      }
    } catch (e) {
      runInAction(() => {
        this.bootError =
          e instanceof ApiError ? e.userMessage : '无法连接服务器，请检查网络'
        this.status = 'ERROR'
      })
    }
  }

  /** 登录/绑定成功后统一落状态 */
  applyLoginOutcome(out: LoginOutcome) {
    if (out.bound && out.user && out.club) {
      runInAction(() => {
        this.user = out.user || null
        this.club = out.club || null
        this.clubRole = out.club?.clubRole || null
        this.status = 'AUTHED'
      })
      setClubId(out.club?.id || null)
      void this.refreshMe()
    }
  }

  async refreshMe() {
    try {
      const me = await authService.fetchMe()
      runInAction(() => {
        this.user = me.user
        this.club = me.club
        this.clubRole = me.club.clubRole
        this.permissions = me.permissions
        this.status = 'AUTHED'
      })
      setClubId(me.club.id)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        runInAction(() => {
          this.clear()
        })
        return
      }
      runInAction(() => {
        this.bootError = e instanceof ApiError ? e.userMessage : '加载身份失败'
      })
    }
  }

  setJoinStatus(view: JoinStatusView) {
    this.joinStatus = view
    this.status = view.status === 'PENDING' ? 'JOIN_PENDING' : this.status
  }

  clear() {
    this.user = null
    this.club = null
    this.clubRole = null
    this.permissions = []
    this.status = 'UNBOUND'
    setClubId(null)
    setToken('')
  }

  async logout() {
    await authService.logout()
    runInAction(() => this.clear())
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
    Taro.setStorageSync(STORAGE_KEYS.theme, mode)
    this.syncTabBarStyle()
  }

  toggleTheme() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light')
  }

  /** 原生 TabBar 不吃 CSS 变量，主题切换时同步配色（设计 §4） */
  syncTabBarStyle() {
    const dark = this.theme === 'dark'
    Taro.setTabBarStyle({
      color: dark ? '#A3A3A3' : '#737373',
      selectedColor: dark ? '#22D3EE' : '#5E6AD2',
      backgroundColor: dark ? '#0A0A0A' : '#FFFFFF',
      borderStyle: 'white',
    }).catch(() => {
      /* 非 tab 页调用会失败，忽略 */
    })
  }
}

class TaskStore {
  tasks: Task[] = []
  page = 0
  total = 0
  hasMore = true
  loading = false
  loadingMore = false
  filters: Pick<TaskQuery, 'status' | 'category' | 'keyword' | 'assigneeId'> = {}
  submitting = false

  constructor() {
    makeAutoObservable(this)
  }

  get openTasks() {
    return this.tasks.filter((t) => t.status === 'OPEN')
  }

  get pendingReview() {
    return this.tasks.filter((t) => t.status === 'SUBMITTED')
  }

  myTasks(userId: string | null) {
    if (!userId) return []
    return this.tasks.filter((t) => t.assigneeId === userId)
  }

  get myActive() {
    return this.myTasks(authStore.user?.id || null).filter(
      (t) => t.status === 'CLAIMED' || t.status === 'SUBMITTED' || t.status === 'REJECTED'
    )
  }

  setFilters(f: Partial<TaskStore['filters']>) {
    this.filters = { ...this.filters, ...f }
    void this.load({ reset: true })
  }

  resetFilters() {
    this.filters = {}
    void this.load({ reset: true })
  }

  async load(opts: { reset?: boolean } = {}) {
    if (opts.reset) {
      this.page = 0
      this.hasMore = true
    }
    if (!this.page && !opts.reset) return
    runInAction(() => {
      this.loading = this.page === 0
      this.loadingMore = this.page > 0
    })
    try {
      const p: Paged<Task> = await taskService.fetchTasks({
        ...this.filters,
        page: this.page,
        size: 20,
      })
      runInAction(() => {
        this.tasks = this.page === 0 ? p.items : [...this.tasks, ...p.items]
        this.total = p.total
        this.hasMore = this.tasks.length < p.total
      })
    } catch (e) {
      fail(e, '加载任务失败')
    } finally {
      runInAction(() => {
        this.loading = false
        this.loadingMore = false
      })
    }
  }

  async loadMore() {
    if (!this.hasMore || this.loading || this.loadingMore) return
    this.page += 1
    await this.load()
  }

  async refresh() {
    this.page = 0
    await this.load({ reset: true })
  }

  /** 动作统一模式：执行 → 刷新列表；失败回滚由服务端真源保证（设计 §5.2-6） */
  private async action(fn: () => Promise<unknown>, okMsg?: string) {
    if (this.submitting) throw new Error('操作进行中')
    runInAction(() => {
      this.submitting = true
    })
    try {
      await fn()
      if (okMsg) toast(okMsg, 'success')
      await this.refresh()
    } catch (e) {
      fail(e, '操作失败')
      throw e
    } finally {
      runInAction(() => {
        this.submitting = false
      })
    }
  }

  claim(id: string) {
    return this.action(() => taskService.claimTask(id), '已认领')
  }
  submit(id: string, note: string) {
    return this.action(() => taskService.submitTask(id, note), '已提交，等待验收')
  }
  approve(id: string, grade: QualityGrade, note: string) {
    return this.action(() => taskService.approveTask(id, grade, note), '验收通过')
  }
  reject(id: string, reason: string) {
    return this.action(() => taskService.rejectTask(id, reason), '已驳回')
  }
  archive(id: string) {
    return this.action(() => taskService.archiveTask(id), '已归档')
  }
  publish(input: taskService.PublishTaskInput) {
    return this.action(() => taskService.publishTask(input), '任务已发布')
  }

  async fetchOne(id: string): Promise<Task | null> {
    try {
      return await taskService.fetchTask(id)
    } catch (e) {
      fail(e, '任务不存在')
      return null
    }
  }
}

class RoiStore {
  overview: RoiOverview | null = null
  period: RoiPeriod = 'month'
  items: RoiItem[] = []
  page = 0
  total = 0
  hasMore = true
  loading = false
  filters: { status?: string; category?: string; keyword?: string } = {}

  constructor() {
    makeAutoObservable(this)
  }

  setPeriod(p: RoiPeriod) {
    this.period = p
    void this.loadOverview()
  }

  async loadOverview() {
    try {
      const ov = await roiService.fetchRoiOverview(this.period)
      runInAction(() => {
        this.overview = ov
      })
    } catch (e) {
      fail(e, '加载 ROI 概览失败')
    }
  }

  setFilters(f: Partial<RoiStore['filters']>) {
    this.filters = { ...this.filters, ...f }
    void this.loadItems({ reset: true })
  }

  async loadItems(opts: { reset?: boolean } = {}) {
    if (opts.reset) {
      this.page = 0
      this.hasMore = true
    }
    runInAction(() => {
      this.loading = true
    })
    try {
      const p = await roiService.fetchRoiItems({
        ...this.filters,
        page: this.page,
        size: 20,
      })
      runInAction(() => {
        this.items = this.page === 0 ? p.items : [...this.items, ...p.items]
        this.total = p.total
        this.hasMore = this.items.length < p.total
      })
    } catch (e) {
      fail(e, '加载 ROI 列表失败')
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async loadMore() {
    if (!this.hasMore || this.loading) return
    this.page += 1
    await this.loadItems()
  }

  async fetchOne(id: string): Promise<RoiItem | null> {
    try {
      return await roiService.fetchRoiItem(id)
    } catch (e) {
      fail(e, 'ROI 项目不存在')
      return null
    }
  }

  async create(input: RoiInput) {
    try {
      await roiService.createRoiItem(input)
      toast('已录入', 'success')
    } catch (e) {
      fail(e, '录入失败')
      throw e
    }
  }

  async update(id: string, input: RoiInput) {
    try {
      await roiService.updateRoiItem(id, input)
      toast('已保存', 'success')
    } catch (e) {
      fail(e, '保存失败')
      throw e
    }
  }

  async remove(id: string) {
    try {
      await roiService.deleteRoiItem(id)
      toast('已删除', 'success')
      await this.loadItems({ reset: true })
    } catch (e) {
      fail(e, '删除失败')
    }
  }
}

class TeamStore {
  members: ClubMember[] = []
  announcements: Announcement[] = []
  annTotal = 0
  invites: InviteCode[] = []
  joinRequests: JoinRequest[] = []
  allPerformance: MemberPerformance[] = []
  loading = false

  constructor() {
    makeAutoObservable(this)
  }

  async loadMembers() {
    try {
      const list = await memberService.fetchMembers()
      runInAction(() => {
        this.members = list
      })
    } catch (e) {
      fail(e, '加载成员失败')
    }
  }

  /** includeDrafts 仅 manager+ 生效（服务端裁剪） */
  async loadAnnouncements(page = 0) {
    try {
      const p = await clubService.fetchAnnouncements(page, 20)
      runInAction(() => {
        this.announcements = page === 0 ? p.items : [...this.announcements, ...p.items]
        this.annTotal = p.total
      })
    } catch (e) {
      fail(e, '加载公告失败')
    }
  }

  async loadPerformance() {
    try {
      const list = await taskService.fetchAllMemberPerformance()
      runInAction(() => {
        this.allPerformance = list
      })
    } catch (e) {
      fail(e, '加载考核失败')
    }
  }

  async loadJoinRequests() {
    try {
      const list = await memberService.fetchJoinRequests('PENDING')
      runInAction(() => {
        this.joinRequests = list
      })
    } catch (e) {
      fail(e, '加载申请失败')
    }
  }

  async approveJoin(id: string) {
    try {
      await memberService.approveJoinRequest(id)
      toast('已通过，成员下次进入小程序即生效', 'success')
      await this.loadJoinRequests()
      await this.loadMembers()
    } catch (e) {
      fail(e, '审批失败')
    }
  }

  async rejectJoin(id: string) {
    try {
      await memberService.rejectJoinRequest(id)
      await this.loadJoinRequests()
    } catch (e) {
      fail(e, '操作失败')
    }
  }

  async setRole(userId: string, role: ClubRole) {
    try {
      await memberService.setMemberRole(userId, role)
      toast('任免已生效', 'success')
      await this.loadMembers()
      await this.loadPerformance()
    } catch (e) {
      fail(e, '任免失败')
    }
  }

  async setMemberStatus(userId: string, status: string) {
    try {
      await memberService.setMemberStatus(userId, status)
      await this.loadMembers()
    } catch (e) {
      fail(e, '更新成员状态失败')
    }
  }

  async loadInvites() {
    try {
      const list = await clubService.fetchInvites()
      runInAction(() => {
        this.invites = list
      })
    } catch (e) {
      fail(e, '加载邀请码失败')
    }
  }

  async createInvite() {
    try {
      const inv = await clubService.createInvite()
      runInAction(() => {
        this.invites = [inv, ...this.invites]
      })
      return inv
    } catch (e) {
      fail(e, '生成邀请码失败')
      throw e
    }
  }

  async revokeInvite(id: string) {
    try {
      await clubService.revokeInvite(id)
      await this.loadInvites()
    } catch (e) {
      fail(e, '作废失败')
    }
  }
}

export const authStore = new AuthStore()
export const uiStore = new UiStore()
export const taskStore = new TaskStore()
export const roiStore = new RoiStore()
export const teamStore = new TeamStore()

export { API_BASE, WECHAT_UI_BASE }
