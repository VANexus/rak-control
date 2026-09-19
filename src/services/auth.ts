import Taro from '@tarojs/taro'
import { WECHAT_UI_BASE } from '@/constants'
import { request, setToken } from '@/utils/request'
import type { JoinStatusView, LoginOutcome, MeView } from '@/types/domain'

/** 微信静默登录（API.md §6.1）：成功即持有 token 并返回身份摘要 */
export async function wxLogin(): Promise<LoginOutcome> {
  const { code } = await Taro.login()
  const out = await request<LoginOutcome>({
    url: `${WECHAT_UI_BASE}/login`,
    method: 'POST',
    data: { code },
    auth: false,
  })
  if (out.bound && out.accessToken) setToken(out.accessToken)
  else if (!out.bound) setToken('')
  return out
}

/** 邀请码/扫码绑定入驻（§6.2） */
export async function bind(
  inviteCode: string,
  displayName?: string
): Promise<LoginOutcome> {
  const { code } = await Taro.login()
  const out = await request<LoginOutcome>({
    url: `${WECHAT_UI_BASE}/bind`,
    method: 'POST',
    data: { code, inviteCode, displayName: displayName || undefined },
    auth: false,
  })
  if (out.bound && out.accessToken) setToken(out.accessToken)
  return out
}

/** 提交入队申请（§6.3 无码通道） */
export async function submitJoinRequest(input: {
  name: string
  wechat: string
  reason: string
}): Promise<{ id: string; status: string }> {
  const { code } = await Taro.login()
  return request({
    url: `${WECHAT_UI_BASE}/join-request`,
    method: 'POST',
    data: {
      code,
      applicantName: input.name,
      applicantWechat: input.wechat,
      reason: input.reason,
    },
    auth: false,
  })
}

/** 本人申请进度（§6.3） */
export async function fetchJoinStatus(): Promise<JoinStatusView> {
  const { code } = await Taro.login()
  return request<JoinStatusView>({
    url: `${WECHAT_UI_BASE}/join-request`,
    method: 'GET',
    data: { code },
    auth: false,
  })
}

/** 当前身份与权限（§6.4） */
export async function fetchMe(): Promise<MeView> {
  return request<MeView>({ url: `${WECHAT_UI_BASE}/me` })
}

/** 登出：吊销 JWT（尽力），必清本地 token */
export async function logout(): Promise<void> {
  try {
    await request({ url: '/auth/logout', method: 'POST' })
  } catch {
    /* 尽力而为 */
  } finally {
    setToken('')
  }
}
