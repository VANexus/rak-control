import { CLUB_API_BASE } from '@/constants'
import { request, qs } from '@/utils/request'
import { currentClubId } from '@/services/context'
import type {
  Paged,
  RoiInput,
  RoiItem,
  RoiOverview,
  RoiPeriod,
} from '@/types/domain'

const base = () => `${CLUB_API_BASE}/${currentClubId()}/roi`

export async function fetchRoiItems(q: {
  status?: string
  category?: string
  keyword?: string
  page?: number
  size?: number
} = {}): Promise<Paged<RoiItem>> {
  return request<Paged<RoiItem>>({
    url: `${base()}/items${qs({
      status: q.status,
      category: q.category,
      keyword: q.keyword,
      page: q.page ?? 0,
      size: q.size ?? 20,
    })}`,
  })
}

export async function fetchRoiItem(id: string): Promise<RoiItem> {
  return request<RoiItem>({ url: `${base()}/items/${id}` })
}

export async function fetchRoiOverview(
  period: RoiPeriod = 'month'
): Promise<RoiOverview> {
  return request<RoiOverview>({ url: `${base()}/overview?period=${period}` })
}

export const createRoiItem = (input: RoiInput) =>
  request<RoiItem>({ url: `${base()}/items`, method: 'POST', data: { ...input } })

export const updateRoiItem = (id: string, input: RoiInput) =>
  request<RoiItem>({
    url: `${base()}/items/${id}`,
    method: 'PATCH',
    data: { ...input },
  })

export const deleteRoiItem = (id: string) =>
  request<void>({ url: `${base()}/items/${id}`, method: 'DELETE' })
