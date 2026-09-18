import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import NavBar from '@/components/nav-bar'
import { uiStore, authStore } from '@/store'
import { canManage, isSuper } from '@/utils/permission'
import { toast } from '@/utils/toast'
import { ROUTES } from '@/constants'
import './page.scss'

interface PageShellProps {
  title?: string
  showBack?: boolean
  subtitle?: string
  children: ReactNode
  requireRole?: 'manage' | 'super' | null
  bare?: boolean
}

function PageShell({
  title,
  showBack,
  subtitle,
  children,
  requireRole = null,
  bare = false,
}: PageShellProps) {
  const role = authStore.clubRole

  useEffect(() => {
    if (requireRole === 'manage' && authStore.isLoggedIn && !canManage(role)) {
      toast('无管理权限')
      Taro.reLaunch({ url: ROUTES.index })
    }
    if (requireRole === 'super' && authStore.isLoggedIn && !isSuper(role)) {
      toast('仅产品负责人可见')
      Taro.reLaunch({ url: ROUTES.index })
    }
  }, [requireRole, role, authStore.isLoggedIn])

  const blocked =
    (requireRole === 'manage' && authStore.isLoggedIn && !canManage(role)) ||
    (requireRole === 'super' && authStore.isLoggedIn && !isSuper(role))

  return (
    <View className={`page-shell theme-${uiStore.theme}`}>
      <NavBar title={title} showBack={showBack} subtitle={subtitle} />
      <View className={bare ? 'page page--flush' : 'page'}>
        {blocked ? (
          <View className='empty-state'>
            <View className='text-card-title'>无访问权限</View>
            <View className='text-caption'>正在返回…</View>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  )
}

export default observer(PageShell)
