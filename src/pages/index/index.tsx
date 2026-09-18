import { View } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import Taro from '@tarojs/taro'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState, MetricCard } from '@/components/ui'
import { authStore, taskStore } from '@/store'
import { ROUTES } from '@/constants'
import {
  countApprovedThisWeek,
  teamCompletionRate,
} from '@/services/task'
import { formatRoiRatio } from '@/utils/format'
import {
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  type Task,
} from '@/types/domain'
import './index.scss'

function statusBadgeClass(status: Task['status']) {
  if (status === 'APPROVED') return 'badge badge--success'
  if (status === 'OPEN') return 'badge badge--brand'
  if (status === 'REJECTED') return 'badge badge--destructive'
  return 'badge badge--warning'
}

function Index() {
  const uid = authStore.currentUserId
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useLoad(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    taskStore.loadTasks()
    taskStore.loadMyPerformance(uid)
  })

  if (!authStore.isLoggedIn) {
    return (
      <PageShell title='Rak' subtitle='任务池'>
        <EmptyState
          title='尚未登录'
          description='请先选择身份进入任务池'
        />
        <View
          className='btn-primary'
          onClick={() => Taro.reLaunch({ url: ROUTES.login })}
        >
          <View>去登录</View>
        </View>
      </PageShell>
    )
  }

  const open = taskStore.openTasks
  const mineActive = taskStore.myActive(uid)
  const weekApproved = countApprovedThisWeek(taskStore.tasks, uid || '')
  const teamRate = teamCompletionRate(taskStore.tasks)

  return (
    <PageShell title='任务' subtitle={authStore.club?.name || 'flowmind 开发组'}>
      <View className='stack-gap fade-in'>
        <View className='home-hero surface-card'>
          <View className='text-title'>你好，{authStore.displayName || '成员'}</View>
          <View className='text-caption home-hero__sub'>
            认领任务 → 交付验收 → 积累综合分
          </View>
        </View>

        <View className='metric-grid'>
          <MetricCard label='待认领' value={String(open.length)} tone='brand' />
          <MetricCard label='我进行中' value={String(mineActive.length)} />
          <MetricCard label='本周已通过' value={String(weekApproved)} tone='success' />
          <MetricCard label='团队完成率' value={formatRoiRatio(teamRate)} tone='muted' />
        </View>

        <View>
          <View className='section-label'>待认领任务</View>
          {open.length === 0 ? (
            <EmptyState
              title='任务池暂时为空'
              description='等管理员发布新任务，或去「我的任务」看看进度'
            />
          ) : (
            <View className='stack-gap'>
              {open.map((t) => (
                <View key={t.id} className='surface-card task-card fade-in'>
                  <View
                    className='task-card__main'
                    onClick={() =>
                      Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })
                    }
                  >
                    <View className='row-gap mb-8'>
                      <View className={statusBadgeClass(t.status)}>
                        <View>{TASK_STATUS_LABEL[t.status]}</View>
                      </View>
                      <View className='badge'>
                        <View>{TASK_CATEGORY_LABEL[t.category]}</View>
                      </View>
                      {t.repo ? (
                        <View className='badge'>
                          <View className='text-mono'>{t.repo}</View>
                        </View>
                      ) : null}
                    </View>
                    <View className='text-card-title task-card__title'>{t.title}</View>
                    <View className='text-caption task-card__desc'>
                      {t.description.slice(0, 48)}
                      {t.description.length > 48 ? '…' : ''}
                    </View>
                  </View>
                  <View
                    className={`btn-primary task-card__action ${
                      claimingId === t.id ? 'btn-primary--disabled' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation?.()
                      if (!uid || claimingId) return
                      Taro.showModal({
                        title: '确认认领',
                        content: '认领后请在 7 天内提交验收。',
                        confirmText: '认领',
                        cancelText: '再想想',
                        success: async (res) => {
                          if (!res.confirm) return
                          setClaimingId(t.id)
                          try {
                            await taskStore.claim(t.id, uid)
                            Taro.showToast({ title: '已认领', icon: 'success' })
                          } catch (err) {
                            Taro.showToast({
                              title: (err as Error).message || '认领失败',
                              icon: 'none',
                            })
                          } finally {
                            setClaimingId(null)
                          }
                        },
                      })
                    }}
                  >
                    <View>一键认领</View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View>
          <View className='section-label'>我进行中</View>
          {mineActive.length === 0 ? (
            <Card>
              <View className='text-caption'>暂无进行中的任务，去上面认领一条吧</View>
            </Card>
          ) : (
            <Card className='stack-gap'>
              {mineActive.map((t) => (
                <View
                  key={t.id}
                  className='list-row list-row--pressable'
                  onClick={() =>
                    Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })
                  }
                >
                  <View className='flex-1'>
                    <View className='text-card-title'>{t.title}</View>
                    <View className='text-caption'>
                      {TASK_CATEGORY_LABEL[t.category]} · {TASK_STATUS_LABEL[t.status]}
                    </View>
                  </View>
                  <View className={statusBadgeClass(t.status)}>
                    <View>{TASK_STATUS_LABEL[t.status]}</View>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      </View>
    </PageShell>
  )
}

export default observer(Index)
