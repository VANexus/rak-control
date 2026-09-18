import {
  getJoinRequests,
  setJoinRequests,
  getMembers,
  setMembers,
  uid,
} from '@/services/local-db'
import { OWNER_USER_ID } from '@/constants'
import type { ClubMember, JoinRequest } from '@/types/domain'

// TODO(rak-auth 接入后)：
//   把本文件所有函数体替换为 request({ url: '/api/v1/...', ... })
//   local-db.ts 仅作为离线缓存层，不再是真源。
//   字段名与 API.md 保持一致。

export async function fetchMembers(): Promise<ClubMember[]> {
  return getMembers()
}

export async function fetchJoinRequests(): Promise<JoinRequest[]> {
  return getJoinRequests().slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function submitJoinRequest(input: {
  name: string
  wechat: string
  reason: string
}): Promise<JoinRequest> {
  if (!input.name.trim() || !input.wechat.trim() || !input.reason.trim()) {
    throw new Error('请完整填写申请信息')
  }
  const req: JoinRequest = {
    id: uid('join'),
    applicantName: input.name.trim(),
    applicantWechat: input.wechat.trim(),
    reason: input.reason.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  }
  setJoinRequests([req, ...getJoinRequests()])
  return req
}

export async function approveJoinRequest(id: string): Promise<ClubMember> {
  const list = getJoinRequests()
  const req = list.find((r) => r.id === id)
  if (!req) throw new Error('申请不存在')
  if (req.status !== 'PENDING') throw new Error('申请已处理')

  const members = getMembers()
  const member: ClubMember = {
    userId: uid('m'),
    displayName: req.applicantName,
    duty: '新入册成员',
    clubRole: 'member',
    status: 'ACTIVE',
    joinedAt: new Date().toISOString(),
  }
  setMembers([...members, member])
  setJoinRequests(
    list.map((r) =>
      r.id === id
        ? {
            ...r,
            status: 'APPROVED' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: OWNER_USER_ID,
          }
        : r
    )
  )
  return member
}

export async function rejectJoinRequest(id: string): Promise<void> {
  const list = getJoinRequests()
  const req = list.find((r) => r.id === id)
  if (!req) throw new Error('申请不存在')
  if (req.status !== 'PENDING') throw new Error('申请已处理')
  setJoinRequests(
    list.map((r) =>
      r.id === id
        ? {
            ...r,
            status: 'REJECTED' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: OWNER_USER_ID,
          }
        : r
    )
  )
}

export async function setMemberRole(
  userId: string,
  clubRole: ClubMember['clubRole']
): Promise<ClubMember> {
  const members = getMembers()
  const idx = members.findIndex((m) => m.userId === userId)
  if (idx < 0) throw new Error('成员不存在')
  if (members[idx].userId === OWNER_USER_ID) {
    throw new Error('不能修改产品负责人角色')
  }
  if (clubRole === 'super_admin') {
    throw new Error('不能将他人升为超级管理员')
  }
  const next = { ...members[idx], clubRole }
  members[idx] = next
  setMembers(members)
  return next
}
