import { API_BASE, CLUB_API_BASE, STORAGE_KEYS } from '@/constants'
import { readToken, request, qs } from '@/utils/request'
import { currentClubId } from '@/services/context'
import type {
  Announcement,
  ClubInfo,
  InviteCode,
  Paged,
} from '@/types/domain'

const base = () => `${CLUB_API_BASE}/${currentClubId()}`

/** ===== 公告（API.md §7.4） ===== */
export async function fetchAnnouncements(
  page = 0,
  size = 20
): Promise<Paged<Announcement>> {
  return request<Paged<Announcement>>({
    url: `${base()}/announcements${qs({ page, size })}`,
  })
}

export async function fetchAnnouncement(id: string): Promise<Announcement> {
  return request<Announcement>({ url: `${base()}/announcements/${id}` })
}

export const createAnnouncement = (input: {
  title: string
  body: string
  pinned: boolean
}) =>
  request<Announcement>({
    url: `${base()}/announcements`,
    method: 'POST',
    data: { ...input },
  })

export const updateAnnouncement = (
  id: string,
  input: { title?: string; body?: string; pinned?: boolean }
) =>
  request<Announcement>({
    url: `${base()}/announcements/${id}`,
    method: 'PATCH',
    data: { ...input },
  })

export const publishAnnouncement = (id: string) =>
  request<Announcement>({
    url: `${base()}/announcements/${id}/publish`,
    method: 'POST',
  })

export const archiveAnnouncement = (id: string) =>
  request<Announcement>({ url: `${base()}/announcements/${id}`, method: 'DELETE' })

/** ===== 邀请码（API.md §7.6） ===== */
export async function fetchInvites(): Promise<InviteCode[]> {
  return request<InviteCode[]>({ url: `${base()}/invites` })
}

export const createInvite = (input?: {
  maxUses?: number
  expiresInDays?: number
}) =>
  request<InviteCode>({
    url: `${base()}/invites`,
    method: 'POST',
    data: { maxUses: input?.maxUses ?? 10, expiresInDays: input?.expiresInDays ?? 30 },
  })

export const revokeInvite = (id: string) =>
  request<InviteCode>({ url: `${base()}/invites/${id}`, method: 'DELETE' })

/** 小程序码图片地址（<Image src> 直用；服务端 PNG 流，需 Bearer —— weapp Image 不支持
 *  自定义头，故走下载方案：以 js 拉流转 base64 dataURL 缓存展示） */
const qrMemoryCache = new Map<string, string>()

export async function fetchInviteQrDataUrl(inv: InviteCode): Promise<string> {
  const url = `${base()}/invites/${inv.id}/qrcode`
  const hit = qrMemoryCache.get(url)
  if (hit) return hit
  const res = await Taro_requestArrayBuffer(url)
  const dataUrl = `data:image/png;base64,${arrayBufferToBase64(res)}`
  qrMemoryCache.set(url, dataUrl)
  return dataUrl
}

async function Taro_requestArrayBuffer(url: string): Promise<ArrayBuffer> {
  const Taro = (await import('@tarojs/taro')).default
  const res = await Taro.request({
    url: `${API_BASE}${url}`,
    method: 'GET',
    responseType: 'arraybuffer',
    header: { Authorization: `Bearer ${readToken()}` },
  })
  if (res.statusCode !== 200) throw new Error('小程序码生成失败')
  return res.data as ArrayBuffer
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  // 小程序环境无 btoa 保证；用 weapp 兼容实现
  return base64Encode(binary)
}

const B64CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64Encode(binary: string): string {
  let out = ''
  for (let i = 0; i < binary.length; i += 3) {
    const c0 = binary.charCodeAt(i)
    const c1 = binary.charCodeAt(i + 1)
    const c2 = binary.charCodeAt(i + 2)
    out += B64CHARS[c0 >> 2]
    out += B64CHARS[((c0 & 3) << 4) | ((isNaN(c1) ? 0 : c1) >> 4)]
    out += isNaN(c1) ? '=' : B64CHARS[((c1 & 15) << 2) | ((isNaN(c2) ? 0 : c2) >> 6)]
    out += isNaN(c2) ? '=' : B64CHARS[c2 & 63]
  }
  return out
}

/** ===== 社团设置（API.md §7.6） ===== */
export async function fetchClub(): Promise<ClubInfo> {
  return request<ClubInfo>({ url: `${base()}` })
}

export const updateClub = (input: {
  name?: string
  description?: string
  logoUrl?: string
  settings?: Record<string, unknown>
}) =>
  request<ClubInfo>({
    url: `${base()}`,
    method: 'PATCH',
    data: {
      name: input.name,
      description: input.description,
      logoUrl: input.logoUrl,
      settings: input.settings,
    },
  })

export const storageKeys = STORAGE_KEYS
