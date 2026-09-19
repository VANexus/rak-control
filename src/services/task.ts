import { CLUB_API_BASE } from '@/constants'
import { request, qs } from '@/utils/request'
import { currentClubId } from '@/services/context'
import type {
  MemberPerformance,
  Paged,
  QualityGrade,
  Task,
  TaskQuery,
} from '@/types/domain'

const base = () => `${CLUB_API_BASE}/${currentClubId()}`

export async function fetchTasks(q: TaskQuery = {}): Promise<Paged<Task>> {
  return request<Paged<Task>>({
    url: `${base()}/tasks${qs({
      status: q.status,
      category: q.category,
      keyword: q.keyword,
      assigneeId: q.assigneeId,
      page: q.page ?? 0,
      size: q.size ?? 20,
    })}`,
  })
}

export async function fetchTask(id: string): Promise<Task> {
  return request<Task>({ url: `${base()}/tasks/${id}` })
}

export interface PublishTaskInput {
  title: string
  description: string
  category: string
  repo?: string | null
  acceptanceCriteria?: string | null
}

export async function publishTask(input: PublishTaskInput): Promise<Task> {
  return request<Task>({
    url: `${base()}/tasks`,
    method: 'POST',
    data: { ...input },
  })
}

export async function updateTask(
  id: string,
  input: PublishTaskInput
): Promise<Task> {
  return request<Task>({
    url: `${base()}/tasks/${id}`,
    method: 'PATCH',
    data: { ...input },
  })
}

export const claimTask = (id: string) =>
  request<Task>({ url: `${base()}/tasks/${id}/claim`, method: 'POST' })

export const submitTask = (id: string, note: string) =>
  request<Task>({
    url: `${base()}/tasks/${id}/submit`,
    method: 'POST',
    data: { note },
  })

export const approveTask = (id: string, grade: QualityGrade, note: string) =>
  request<Task>({
    url: `${base()}/tasks/${id}/approve`,
    method: 'POST',
    data: { grade, note: note || undefined },
  })

export const rejectTask = (id: string, reason: string) =>
  request<Task>({
    url: `${base()}/tasks/${id}/reject`,
    method: 'POST',
    data: { reason },
  })

export const archiveTask = (id: string) =>
  request<Task>({ url: `${base()}/tasks/${id}/archive`, method: 'POST' })

/** 全员绩效排行（manager+，§7.2） */
export async function fetchAllMemberPerformance(): Promise<
  MemberPerformance[]
> {
  return request<MemberPerformance[]>({ url: `${base()}/performance` })
}

/** 单人绩效（本人或 manager+） */
export async function fetchMemberPerformance(
  userId: string
): Promise<MemberPerformance | null> {
  const list = await request<MemberPerformance[]>({
    url: `${base()}/members/${userId}/performance`,
  })
  return list[0] || null
}
