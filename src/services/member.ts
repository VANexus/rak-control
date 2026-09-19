import { CLUB_API_BASE } from '@/constants'
import { request } from '@/utils/request'
import { currentClubId } from '@/services/context'
import type { ClubMember, ClubRole, JoinRequest } from '@/types/domain'

const base = () => `${CLUB_API_BASE}/${currentClubId()}`

/** 成员目录（API.md §7.5；全员可读，受 settings.memberDirectoryVisible） */
export async function fetchMembers(): Promise<ClubMember[]> {
  return request<ClubMember[]>({ url: `${base()}/members` })
}

export const setMemberStatus = (userId: string, status: string) =>
  request<ClubMember>({
    url: `${base()}/members/${userId}`,
    method: 'PATCH',
    data: { status },
  })

/** 任免（仅 super_admin，§7.5） */
export const setMemberRole = (userId: string, clubRole: ClubRole) =>
  request<ClubMember>({
    url: `${base()}/members/${userId}/role`,
    method: 'PUT',
    data: { clubRole },
  })

/** 入队申请（manager+，§7.5） */
export async function fetchJoinRequests(
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<JoinRequest[]> {
  return request<JoinRequest[]>({
    url: `${base()}/join-requests${status ? `?status=${status}` : ''}`,
  })
}

export const approveJoinRequest = (id: string) =>
  request<JoinRequest>({
    url: `${base()}/join-requests/${id}/approve`,
    method: 'POST',
  })

export const rejectJoinRequest = (id: string) =>
  request<JoinRequest>({
    url: `${base()}/join-requests/${id}/reject`,
    method: 'POST',
  })
