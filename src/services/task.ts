import {
  getTasks,
  setTasks,
  getMembers,
  uid,
} from '@/services/local-db'
import { OWNER_USER_ID } from '@/constants'
import {
  QUALITY_SCORE,
  type MemberPerformance,
  type QualityGrade,
  type Task,
  type TaskCategory,
} from '@/types/domain'

// TODO(rak-auth 接入后)：
//   把本文件所有函数体替换为 request({ url: '/api/v1/...', ... })
//   local-db.ts 仅作为离线缓存层，不再是真源。
//   字段名与 API.md 保持一致。

export async function fetchTasks(): Promise<Task[]> {
  return getTasks().slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export async function fetchTaskById(id: string): Promise<Task | null> {
  return getTasks().find((t) => t.id === id) || null
}

export interface CreateTaskInput {
  title: string
  description: string
  category: TaskCategory
  repo?: string | null
  acceptanceCriteria?: string | null
  createdBy: string
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString()
  const task: Task = {
    id: uid('task'),
    title: input.title.slice(0, 40),
    description: input.description,
    category: input.category,
    repo: input.repo || null,
    acceptanceCriteria: input.acceptanceCriteria || null,
    status: 'OPEN',
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
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  }
  setTasks([task, ...getTasks()])
  return task
}

function memberName(userId: string): string {
  return getMembers().find((m) => m.userId === userId)?.displayName || userId
}

export async function claimTask(taskId: string, userId: string): Promise<Task> {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) throw new Error('任务不存在')
  const task = tasks[idx]
  if (task.status !== 'OPEN') throw new Error('任务不可认领')
  const now = new Date().toISOString()
  const next: Task = {
    ...task,
    status: 'CLAIMED',
    assigneeId: userId,
    assigneeName: memberName(userId),
    claimedAt: now,
    updatedAt: now,
    rejectReason: null,
    rejectedAt: null,
  }
  tasks[idx] = next
  setTasks(tasks)
  return next
}

export async function submitTask(taskId: string, note?: string): Promise<Task> {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) throw new Error('任务不存在')
  const task = tasks[idx]
  if (task.status !== 'CLAIMED' && task.status !== 'REJECTED') {
    throw new Error('当前状态不可提交')
  }
  const now = new Date().toISOString()
  const next: Task = {
    ...task,
    status: 'SUBMITTED',
    submittedAt: now,
    submitNote: note || task.submitNote || null,
    updatedAt: now,
  }
  tasks[idx] = next
  setTasks(tasks)
  return next
}

export async function approveTask(
  taskId: string,
  grade: QualityGrade,
  note: string
): Promise<Task> {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) throw new Error('任务不存在')
  const task = tasks[idx]
  if (task.status !== 'SUBMITTED') throw new Error('仅待验收任务可通过')
  const now = new Date().toISOString()
  const next: Task = {
    ...task,
    status: 'APPROVED',
    qualityGrade: grade,
    qualityNote: note || null,
    approvedAt: now,
    updatedAt: now,
  }
  tasks[idx] = next
  setTasks(tasks)
  return next
}

export async function rejectTask(taskId: string, reason: string): Promise<Task> {
  if (!reason.trim()) throw new Error('请填写驳回理由')
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) throw new Error('任务不存在')
  const task = tasks[idx]
  if (task.status !== 'SUBMITTED') throw new Error('仅待验收任务可驳回')
  const now = new Date().toISOString()
  const next: Task = {
    ...task,
    status: 'CLAIMED',
    rejectedAt: now,
    rejectReason: reason.trim(),
    updatedAt: now,
  }
  tasks[idx] = next
  setTasks(tasks)
  return next
}

export async function archiveTask(taskId: string): Promise<Task> {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) throw new Error('任务不存在')
  const now = new Date().toISOString()
  const next: Task = { ...tasks[idx], status: 'DONE', updatedAt: now }
  tasks[idx] = next
  setTasks(tasks)
  return next
}

function isClaimedStatus(status: Task['status']) {
  return status === 'CLAIMED' || status === 'SUBMITTED' || status === 'APPROVED'
}

export function computePerformance(
  userId: string,
  displayName: string,
  duty: string | null | undefined,
  role: MemberPerformance['role'],
  tasks: Task[]
): MemberPerformance {
  const mine = tasks.filter((t) => t.assigneeId === userId)
  const claimed = mine.filter((t) => isClaimedStatus(t.status))
  const approved = mine.filter((t) => t.status === 'APPROVED')
  const rejected = mine.filter(
    (t) => Boolean(t.rejectedAt) && t.status !== 'APPROVED'
  )
  const inProgress = mine.filter(
    (t) => t.status === 'CLAIMED' || t.status === 'SUBMITTED'
  )
  const claimedCount = claimed.length
  const approvedCount = approved.length
  const completionRate = claimedCount === 0 ? 0 : approvedCount / claimedCount

  const graded = approved.filter((t) => t.qualityGrade)
  const avgQualityScore =
    graded.length === 0
      ? null
      : graded.reduce((s, t) => s + QUALITY_SCORE[t.qualityGrade as QualityGrade], 0) /
        graded.length

  const compositeScore =
    avgQualityScore === null ? 0 : Math.round(completionRate * avgQualityScore)

  return {
    userId,
    displayName,
    duty: duty || null,
    role,
    claimedCount,
    approvedCount,
    rejectedCount: rejected.length,
    inProgressCount: inProgress.length,
    completionRate,
    avgQualityScore,
    compositeScore,
  }
}

export async function fetchMemberPerformance(
  userId: string
): Promise<MemberPerformance> {
  const member = getMembers().find((m) => m.userId === userId)
  if (!member) throw new Error('成员不存在')
  return computePerformance(
    member.userId,
    member.displayName,
    member.duty,
    member.clubRole,
    getTasks()
  )
}

export async function fetchAllMemberPerformance(): Promise<
  MemberPerformance[]
> {
  const tasks = getTasks()
  return getMembers()
    .filter((m) => m.userId !== OWNER_USER_ID && m.status === 'ACTIVE')
    .map((m) =>
      computePerformance(m.userId, m.displayName, m.duty, m.clubRole, tasks)
    )
    .sort((a, b) => b.compositeScore - a.compositeScore)
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - diff)
  return d
}

export function countApprovedThisWeek(tasks: Task[], userId: string): number {
  const from = startOfWeek().getTime()
  return tasks.filter(
    (t) =>
      t.assigneeId === userId &&
      t.status === 'APPROVED' &&
      t.approvedAt &&
      new Date(t.approvedAt).getTime() >= from
  ).length
}

export function teamCompletionRate(tasks: Task[]): number {
  const claimed = tasks.filter((t) => isClaimedStatus(t.status)).length
  if (claimed === 0) return 0
  const approved = tasks.filter((t) => t.status === 'APPROVED').length
  return approved / claimed
}
