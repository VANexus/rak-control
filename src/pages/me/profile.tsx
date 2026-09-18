import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card, MetricCard, RoleBadge } from '@/components/ui'
import { authStore, taskStore, uiStore } from '@/store'
import { ROUTES } from '@/constants'
import { formatRoiRatio } from '@/utils/format'
import { roleLabel } from '@/utils/permission'

function Profile() {
  const uid = authStore.currentUserId

  useEffect(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    taskStore.loadTasks()
    taskStore.loadMyPerformance(uid)
    authStore.refreshMe()
  }, [uid])

  const p = taskStore.myPerformance
  const approvedList = taskStore.myTasks(uid).filter((t) => t.status === 'APPROVED')
  const initial = (authStore.displayName || 'R').slice(0, 1)

  return (
    <PageShell title='我的' subtitle={roleLabel(authStore.clubRole)}>
      <View className='stack-gap fade-in'>
        <Card>
          <View className='row-gap'>
            <View className='profile__avatar'>
              <View className='profile__avatar-text'>{initial}</View>
            </View>
            <View className='flex-1'>
              <View className='row-gap'>
                <View className='text-title'>
                  {authStore.displayName || '未登录'}
                </View>
                <RoleBadge role={authStore.clubRole} />
              </View>
              <View className='text-caption'>
                {authStore.duty || '—'} · {authStore.club?.name || ''}
              </View>
            </View>
          </View>
        </Card>

        <View className='metric-grid'>
          <MetricCard label='已认领' value={String(p?.claimedCount ?? 0)} />
          <MetricCard label='已通过' value={String(p?.approvedCount ?? 0)} tone='success' />
          <MetricCard label='完成率' value={formatRoiRatio(p?.completionRate ?? 0)} tone='brand' />
          <MetricCard label='综合分' value={String(p?.compositeScore ?? 0)} tone='brand' />
        </View>

        <View>
          <View className='section-label'>质量分明细</View>
          {approvedList.length === 0 ? (
            <Card>
              <View className='text-caption'>
                还没有已验收任务，综合分与完成率按 0 计。完成后会在这里列出评语。
              </View>
            </Card>
          ) : (
            <Card className='stack-gap'>
              {approvedList.map((t) => (
                <View
                  key={t.id}
                  className='list-row list-row--pressable'
                  onClick={() =>
                    Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })
                  }
                >
                  <View className='flex-1'>
                    <View className='text-card-title'>{t.title}</View>
                    <View className='text-caption'>{t.qualityNote || '无评语'}</View>
                  </View>
                  <View className='badge badge--success'>
                    <View>{t.qualityGrade || '—'}</View>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        <Card className='stack-gap'>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.myTasks })}
          >
            <View className='text-card-title'>任务进度</View>
            <View className='text-caption'>进行中 / 待验收 / 已完成</View>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.settings })}
          >
            <View className='text-card-title'>设置</View>
            <View className='text-caption'>
              主题 {uiStore.theme === 'light' ? '浅色' : '深色'}
            </View>
          </View>
          {authStore.isManager ? (
            <View
              className='list-row list-row--pressable'
              onClick={() => Taro.navigateTo({ url: ROUTES.adminHome })}
            >
              <View className='text-card-title text-brand'>管理面板</View>
              <View className='text-caption'>发布 / 验收 / 名册</View>
            </View>
          ) : null}
          {authStore.isSuper ? (
            <View
              className='list-row list-row--pressable'
              onClick={() => Taro.navigateTo({ url: ROUTES.superRoles })}
            >
              <View className='text-card-title text-brand'>超级后台</View>
              <View className='text-caption'>职责分配</View>
            </View>
          ) : null}
        </Card>
      </View>
    </PageShell>
  )
}

export default observer(Profile)
