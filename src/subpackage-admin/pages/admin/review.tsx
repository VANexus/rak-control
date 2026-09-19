import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { TaskCard } from '@/components/ui'
import { Skeleton, EmptyView } from '@/components/states'
import * as taskService from '@/services/task'
import { ROUTES } from '@/constants'
import { relTime } from '@/utils/format'
import type { Task } from '@/types/domain'
import '../../admin.scss'

function Review() {
  const [list, setList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const reload = () =>
    taskService
      .fetchTasks({ status: 'SUBMITTED', size: 50 })
      .then((p) => setList(p.items))
      .finally(() => setLoading(false))

  useDidShow(() => {
    setLoading(true)
    void reload()
  })

  usePullDownRefresh(async () => {
    await reload()
    Taro.stopPullDownRefresh()
  })

  return (
    <PageShell title='任务验收' showBack requireRole='manage'>
      {loading ? (
        <Skeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyView title='没有待验收的任务' hint='成员提交后会出现在这里' art='search' />
      ) : (
        <View className='stack-gap fade-in'>
          <Text className='text-caption'>共 {list.length} 个等待验收 · 点进去评级或通过/驳回</Text>
          {list.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onPress={() => Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })}
            />
          ))}
          <Text className='text-caption' style={{ textAlign: 'center' }}>
            最近提交：{relTime(list[0]?.submittedAt)}
          </Text>
        </View>
      )}
    </PageShell>
  )
}

export default observer(Review)
