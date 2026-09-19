import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import { authStore } from '@/store'
import { ROUTES } from '@/constants'
import { toast } from '@/utils/toast'
import type { ClubRole } from '@/types/domain'

export function canManage(role?: ClubRole | null): boolean {
  return role === 'manager' || role === 'super_admin'
}

export function isSuper(role?: ClubRole | null): boolean {
  return role === 'super_admin'
}

export function roleLabel(role?: ClubRole | null): string {
  switch (role) {
    case 'super_admin':
      return '超级管理员'
    case 'manager':
      return '管理层'
    case 'member':
      return '成员'
    default:
      return '未入驻'
  }
}

/**
 * 页面级守卫（设计 §3/§6.4）：未登录 → 登录页；越权深链 → 回首页 + toast。
 * 客户端显隐只是体验，服务端 club_role 强校验是最终防线（API.md §7）。
 */
export function useAuthGuard(need?: 'manage' | 'super') {
  useEffect(() => {
    const check = () => {
      const { status, clubRole } = authStore
      if (status === 'LOADING') return
      if (status !== 'AUTHED') {
        Taro.reLaunch({ url: ROUTES.login })
        return
      }
      if (need === 'manage' && !canManage(clubRole)) {
        toast('无管理权限')
        Taro.reLaunch({ url: ROUTES.index })
      }
      if (need === 'super' && !isSuper(clubRole)) {
        toast('仅超级管理员可见')
        Taro.reLaunch({ url: ROUTES.index })
      }
    }
    check()
  })

  const role = authStore.clubRole
  if (authStore.status !== 'AUTHED') return false
  if (need === 'manage') return canManage(role)
  if (need === 'super') return isSuper(role)
  return true
}
