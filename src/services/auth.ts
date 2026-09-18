import {
  getClub,
  getCurrentUserId,
  getMembers,
  setCurrentUserId,
  ensureSeeded,
} from '@/services/local-db'
import { OWNER_USER_ID } from '@/constants'
import type { ClubInfo, ClubMember, ClubRole } from '@/types/domain'

// TODO(rak-auth 接入后)：
//   把本文件所有函数体替换为 request({ url: '/api/v1/...', ... })
//   local-db.ts 仅作为离线缓存层，不再是真源。
//   字段名与 API.md 保持一致。

export async function fetchMe(): Promise<{
  user: { id: string; displayName: string; status: 'ACTIVE' }
  club: ClubInfo
  clubRole: ClubRole
  permissions: string[]
  duty?: string | null
}> {
  ensureSeeded()
  const id = getCurrentUserId()
  if (!id) {
    throw new Error('未登录')
  }
  const members = getMembers()
  const me = members.find((m) => m.userId === id)
  if (!me) {
    throw new Error('身份不存在，请重新选择')
  }
  return {
    user: { id: me.userId, displayName: me.displayName, status: 'ACTIVE' },
    club: getClub(),
    clubRole: me.clubRole,
    permissions: permissionsFor(me.clubRole),
    duty: me.duty || null,
  }
}

export function permissionsFor(role: ClubRole): string[] {
  if (role === 'member') {
    return ['task:read', 'task:claim', 'task:submit', 'performance:self']
  }
  if (role === 'manager') {
    return [
      'task:read',
      'task:claim',
      'task:submit',
      'task:publish',
      'task:review',
      'member:read',
      'performance:all',
      'join:read',
    ]
  }
  return [
    'task:read',
    'task:claim',
    'task:submit',
    'task:publish',
    'task:review',
    'member:read',
    'member:write',
    'performance:all',
    'join:read',
    'join:write',
    'club:admin',
  ]
}

/** 过渡期：本地选择身份后登录成功 */
export async function loginAs(userId: string): Promise<{
  user: { id: string; displayName: string; status: 'ACTIVE' }
  club: ClubInfo
  clubRole: ClubRole
  permissions: string[]
  duty?: string | null
}> {
  ensureSeeded()
  const members = getMembers()
  const me = members.find((m) => m.userId === userId)
  if (!me) {
    throw new Error('请选择有效身份')
  }
  setCurrentUserId(userId)
  return fetchMe()
}

export async function logout(): Promise<void> {
  setCurrentUserId(null)
}

export async function fetchMembers(): Promise<ClubMember[]> {
  return getMembers()
}

export function isOwner(userId?: string | null) {
  return userId === OWNER_USER_ID
}

export function findMember(userId: string | null | undefined): ClubMember | null {
  if (!userId) return null
  return getMembers().find((m) => m.userId === userId) || null
}
