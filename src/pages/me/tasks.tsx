import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { TaskCard } from '@/components/ui'
import { ListState } from '@/components/states'
import { authStore } from '@/store'
import * as taskService from '@/services/task'
import { ROUTES } from '@/constants'
import type { Task } from '@/types/domain'
import './me.scss'

const SEGS = [
  { key: 'active', label: '进行中', status: 'CLAIMED,REJECTED' },
  { key: 'review', label: '待验收', status: 'SUBMITTED' },
  { key: 'done', label: '已完成', status: 'APPROVED,DONE' },
]

function MyTasks() {
  const initial = Taro.getCurrentInstance().router?.params?.seg
  const [seg, setSeg] = useState(SEGS.some((s) => s.key === initial) ? (initial as string) : 'active')
  const [tasks, setTasks] = useState<Task[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const uid = authStore.user?.id

  const load = async (p: number, replace: boolean) => {
    if (!uid) return
    setLoading(true)
    try {
      const cur = SEGS.find((s) => s.key === seg)
      const res = await taskService.fetchTasks({
        assigneeId: uid,
        status: cur?.status || '',
        page: p,
        size: 20,
      })
      setTasks(replace ? res.items : [...tasks, ...res.items])
      setTotal(res.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    const cur = SEGS.find((s) => s.key === seg)
    void (async () => {
      if (!uid) return
      setLoading(true)
      try {
        const res = await taskService.fetchTasks({ assigneeId: uid, status: cur?.status || '', page: 0, size: 20 })
        setTasks(res.items)
        setTotal(res.total)
        setPage(0)
      } finally {
        setLoading(false)
      }
    })()
  })

  usePullDownRefresh(async () => {
    const cur = SEGS.find((s) => s.key === seg)
    if (uid && cur) {
      const res = await taskService.fetchTasks({ assigneeId: uid, status: cur.status, page: 0, size: 20 })
      setTasks(res.items)
      setTotal(res.total)
      setPage(0)
    }
    Taro.stopPullDownRefresh()
  })

  useReachBottom(() => {
    if (tasks.length < total) {
      const cur = SEGS.find((s) => s.key === seg)
      if (uid && cur) {
        void (async () => {
          const res = await taskService.fetchTasks({ assigneeId: uid, status: cur.status, page: page + 1, size: 20 })
          setTasks((prev) => [...prev, ...res.items])
          setPage((p) => p + 1)
        })()
      }
    }
  })

  return (
    <PageShell title='我的任务' showBack>
      <View className='pool-seg'>
        {SEGS.map((s) => (
          <View
            key={s.key}
            className={`pool-seg__item pressable ${seg === s.key ? 'pool-seg__item--on' : ''}`}
            onClick={() => {
              setSeg(s.key)
              if (uid) {
                void (async () => {
                  setLoading(true)
                  try {
                    const res = await taskService.fetchTasks({ assigneeId: uid, status: s.status, page: 0, size: 20 })
                    setTasks(res.items)
                    setTotal(res.total)
                    setPage(0)
                  } finally {
                    setLoading(false)
                  }
                })()
              }
            }}
          >
            <Text>{s.label}</Text>
          </View>
        ))}
      </View>

      <ListState
        loading={loading && tasks.length === 0}
        error={null}
        empty={tasks.length === 0}
        onRetry={() => load(0, true)}
        emptyTitle='这个分组下还没有任务'
        emptyHint='去任务池认领一个？'
        emptyAction={
          <View
            className='btn-primary pressable'
            onClick={() => Taro.switchTab({ url: ROUTES.taskPool })}
          >
            <Text>去任务池</Text>
          </View>
        }
      >
        <View className='stack-gap'>
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onPress={() => Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })}
            />
          ))}
        </View>
      </ListState>
    </PageShell>
  )
}

export default observer(MyTasks)
