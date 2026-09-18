import {
  getAnnouncements,
  setAnnouncements,
  getClub,
  setClub,
  getInvites,
  setInvites,
  uid,
} from '@/services/local-db'
import type { Announcement, ClubInfo, InviteCode } from '@/types/domain'

// TODO(rak-auth 接入后)：改为 request + API.md

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return getAnnouncements()
    .filter((a) => a.status === 'PUBLISHED')
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.publishedAt! < b.publishedAt! ? 1 : -1))
}

export async function fetchClub(): Promise<ClubInfo> {
  return getClub()
}

export async function updateClub(patch: Partial<ClubInfo>): Promise<ClubInfo> {
  const next = { ...getClub(), ...patch }
  setClub(next)
  return next
}

export async function publishAnnouncement(input: {
  title: string
  body: string
  authorId: string
  authorName: string
  pinned?: boolean
}): Promise<Announcement> {
  const item: Announcement = {
    id: uid('ann'),
    title: input.title,
    body: input.body,
    pinned: Boolean(input.pinned),
    publishedAt: new Date().toISOString(),
    authorId: input.authorId,
    authorName: input.authorName,
    status: 'PUBLISHED',
  }
  setAnnouncements([item, ...getAnnouncements()])
  return item
}

export async function fetchInvites(): Promise<InviteCode[]> {
  return getInvites()
}

export async function createInvite(): Promise<InviteCode> {
  const code = `FM${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const invite: InviteCode = {
    id: uid('inv'),
    code,
    maxUses: 10,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    revokedAt: null,
    qrPath: `/pages/auth/login?invite=${code}`,
  }
  setInvites([invite, ...getInvites()])
  return invite
}
