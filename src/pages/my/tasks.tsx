import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState } from '@/components/ui'
import { authStore, taskStore } from '@/store'
import { ROUTES } from '@/constants'
import { formatDate } from '@/utils/format'
import {
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  type Task,
} from '@/types/domain'
import './tasks.scss'

type Filter = 'ACTIVE' | 'SUBMITTED' | 'DONE' | 'ALL'

const TABS: { key: Filter; label: string }[] = [
  { key: 'ACTIVE', label: '进行中' },
  { key: 'SUBMITTED', label: '待验收' },
  { key: 'DONE', label: '已完成' },
  { key: 'ALL', label: '全部' },
]

function badgeClass(status: Task['status']) {
  if (status === 'APPROVED') return 'badge badge--success'
  if (status === 'REJECTED') return 'badge badge--destructive'
  if (status === 'OPEN') return 'badge badge--brand'
  return 'badge badge--warning'
}

function MyTasks() {
  const uid = authStore.currentUserId
  const [tab, setTab] = useState<Filter>('ACTIVE')

  useEffect(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    taskStore.loadTasks()
  }, [])

  const mine = taskStore.myTasks(uid)
  const filtered = mine.filter((t) => {
    if (tab === 'ALL') return true
    if (tab === 'ACTIVE') return t.status === 'CLAIMED'
    if (tab === 'SUBMITTED') return t.status === 'SUBMITTED'
    return t.status === 'APPROVED' || t.status === 'DONE'
  })

  return (
    <PageShell title='任务进度' subtitle={authStore.displayName || ''}>
      <View className='stack-gap fade-in'>
        <View className='seg'>
          {TABS.map((t) => (
            <View
              key={t.key}
              className={`seg__item ${tab === t.key ? 'seg__item--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <View>{t.label}</View>
            </View>
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            title='这里还没有任务'
            description={tab === 'ACTIVE' ? '去任务池认领一条开始吧' : '换一个筛选看看'}
          />
        ) : (
          <Card className='stack-gap'>
            {filtered.map((t) => (
              <View
                key={t.id}
                className='list-row list-row--pressable'
                onClick={() =>
                  Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })
                }
              >
                <View className='flex-1'>
                  <View className='text-card-title'>{t.title}</View>
                  <View className='text-caption text-mono'>
                    {TASK_CATEGORY_LABEL[t.category]} · {formatDate(t.updatedAt)}
                  </View>
                </View>
                <View className={badgeClass(t.status)}>
                  <View>{TASK_STATUS_LABEL[t.status]}</View>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>
    </PageShell>
  )
}

export default observer(MyTasks)
