import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { RoleBadge } from '@/components/ui'
import { authStore, taskStore, uiStore } from '@/store'
import * as taskService from '@/services/task'
import { ROUTES } from '@/constants'
import { roleLabel } from '@/utils/permission'
import { canManage, isSuper } from '@/utils/permission'
import './me.scss'

function Profile() {
  const [myCount, setMyCount] = useState<{ active: number; review: number } | null>(null)
  const uid = authStore.user?.id

  useDidShow(() => {
    if (authStore.status === 'LOADING') return
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    uiStore.syncTabBarStyle()
    void (async () => {
      try {
        const [active, review] = await Promise.all([
          taskService.fetchTasks({ assigneeId: uid, status: 'CLAIMED,REJECTED', size: 1 }),
          taskService.fetchTasks({ assigneeId: uid, status: 'SUBMITTED', size: 1 }),
        ])
        setMyCount({ active: active.total, review: review.total })
      } catch {
        setMyCount(null)
      }
    })()
  })

  const name = authStore.user?.displayName || '成员'

  return (
    <PageShell title='我的' subtitle={authStore.club?.name || ''}>
      <View className='stack-gap fade-in'>
        {/* 个人卡 */}
        <View className='surface-card me-hero pressable' onClick={() => Taro.navigateTo({ url: ROUTES.myPerformance })}>
          <View className='avatar-dot avatar-dot--lg'>
            <Text>{name.slice(0, 1)}</Text>
          </View>
          <View className='flex-1'>
            <View className='row-gap'>
              <Text className='text-title'>{name}</Text>
              <RoleBadge role={authStore.clubRole} />
            </View>
            <Text className='text-caption'>
              {authStore.user?.duty || roleLabel(authStore.clubRole)}
            </Text>
          </View>
          <Text className='text-caption'>›</Text>
        </View>

        {/* 任务速览 */}
        <View className='me-counts'>
          <View
            className='me-counts__item pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.myTasks })}
          >
            <Text className='club-stats__num'>{myCount ? myCount.active : '—'}</Text>
            <Text className='text-caption'>进行中</Text>
          </View>
          <View
            className='me-counts__item pressable'
            onClick={() => Taro.navigateTo({ url: `${ROUTES.myTasks}?seg=review` })}
          >
            <Text className='club-stats__num'>{myCount ? myCount.review : '—'}</Text>
            <Text className='text-caption'>待验收</Text>
          </View>
          <View
            className='me-counts__item pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.myPerformance })}
          >
            <Text className='club-stats__num text-brand'>绩效</Text>
            <Text className='text-caption'>我的考核</Text>
          </View>
        </View>

        {/* 入口组 */}
        <View className='surface-card'>
          <MeRow title='我的任务' onClick={() => Taro.navigateTo({ url: ROUTES.myTasks })} />
          <MeRow title='成员目录' onClick={() => Taro.navigateTo({ url: ROUTES.members })} />
          {canManage(authStore.clubRole) ? (
            <MeRow
              title='管理面板'
              hint='任务发布 · 验收 · ROI · 公告'
              brand
              onClick={() => Taro.navigateTo({ url: ROUTES.adminHome })}
            />
          ) : null}
          {isSuper(authStore.clubRole) ? (
            <MeRow
              title='超级后台'
              hint='任免 · 全量视图'
              brand
              onClick={() => Taro.navigateTo({ url: ROUTES.superRoles })}
            />
          ) : null}
          <MeRow
            title={uiStore.theme === 'dark' ? '切换到浅色' : '切换到深色'}
            onClick={() => uiStore.toggleTheme()}
          />
          <MeRow title='设置' onClick={() => Taro.navigateTo({ url: ROUTES.settings })} />
        </View>

        <View
          className='btn-secondary pressable'
          onClick={() => {
            Taro.showModal({ title: '退出登录', content: '确定退出 Rak？' }).then((r) => {
              if (r.confirm) void authStore.logout()
            })
          }}
        >
          <Text>退出登录</Text>
        </View>
      </View>
    </PageShell>
  )
}

function MeRow({
  title,
  hint,
  brand,
  onClick,
}: {
  title: string
  hint?: string
  brand?: boolean
  onClick: () => void
}) {
  return (
    <View className='list-row list-row--pressable' onClick={onClick}>
      <View className='flex-1'>
        <Text className={`text-card-title ${brand ? 'text-brand' : ''}`}>{title}</Text>
        {hint ? <Text className='text-caption'>{hint}</Text> : null}
      </View>
      <Text className='text-caption'>›</Text>
    </View>
  )
}

// 让 observer 追踪任务数（taskStore 引用防止 tree-shake 误删依赖）
void taskStore

export default observer(Profile)
