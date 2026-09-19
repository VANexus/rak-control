import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { TaskCard, StatusPill } from '@/components/ui'
import { ListState } from '@/components/states'
import { authStore, taskStore } from '@/store'
import { ROUTES } from '@/constants'
import { TASK_CATEGORY_LABEL, type TaskCategory } from '@/types/domain'
import './pool.scss'

/** 分段器 → 后端 status 组（API.md §7.1 逗号多值） */
const SEGMENTS: { key: string; label: string; status: string }[] = [
  { key: 'all', label: '全部', status: '' },
  { key: 'open', label: '待认领', status: 'OPEN' },
  { key: 'mine', label: '我的', status: '' },
  { key: 'review', label: '待验收', status: 'SUBMITTED' },
  { key: 'done', label: '已完成', status: 'APPROVED,DONE' },
]

function TaskPool() {
  const [seg, setSeg] = useState('all')
  const [kw, setKw] = useState('')
  const [category, setCategory] = useState('')

  useDidShow(() => {
    if (authStore.status === 'LOADING') return
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    applyFilters(seg, category, kw)
  })

  usePullDownRefresh(async () => {
    await taskStore.refresh()
    Taro.stopPullDownRefresh()
  })

  useReachBottom(() => {
    void taskStore.loadMore()
  })

  const applyFilters = (s: string, c: string, k: string) => {
    taskStore.setFilters({
      status: s === 'mine' ? '' : SEGMENTS.find((x) => x.key === s)?.status || '',
      assigneeId: s === 'mine' ? authStore.user?.id || '' : '',
      category: c || '',
      keyword: k || '',
    })
  }

  const switchSeg = (key: string) => {
    setSeg(key)
    applyFilters(key, category, kw)
  }

  const toggleCategory = (c: string) => {
    const next = category === c ? '' : c
    setCategory(next)
    applyFilters(seg, next, kw)
  }

  const onSearch = () => applyFilters(seg, category, kw.trim())

  return (
    <PageShell
      kicker='TASKS'
      headTitle='任务池'
      headStatus={<StatusPill dot={seg === 'open' && taskStore.total > 0} text={`在池 ${taskStore.total} 个`} />}
    >
      {/* 分段器 */}
      <View className='pool-seg'>
        {SEGMENTS.map((s) => (
          <View
            key={s.key}
            className={`pool-seg__item pressable ${seg === s.key ? 'pool-seg__item--on' : ''}`}
            onClick={() => switchSeg(s.key)}
          >
            <Text>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 搜索 */}
      <View className='pool-search'>
        <Input
          className='pool-search__input'
          value={kw}
          placeholder='搜索标题 / 描述'
          confirmType='search'
          onInput={(e) => setKw(e.detail.value)}
          onConfirm={onSearch}
        />
        {kw ? (
          <Text
            className='pool-search__clear'
            onClick={() => {
              setKw('')
              applyFilters(seg, category, '')
            }}
          >
            清除
          </Text>
        ) : null}
      </View>

      {/* 分类 chips */}
      <ScrollViewX>
        {(Object.keys(TASK_CATEGORY_LABEL) as TaskCategory[]).map((c) => (
          <View
            key={c}
            className={`pool-chip pressable ${category === c ? 'pool-chip--on' : ''}`}
            onClick={() => toggleCategory(c)}
          >
            <Text>{TASK_CATEGORY_LABEL[c]}</Text>
          </View>
        ))}
      </ScrollViewX>

      <ListState
        loading={taskStore.loading && taskStore.tasks.length === 0}
        error={null}
        empty={taskStore.tasks.length === 0}
        onRetry={() => taskStore.refresh()}
        emptyTitle={kw || category || seg !== 'all' ? '没有符合条件的任务' : '任务池还是空的'}
        emptyHint={
          authStore.isManager && seg === 'all' && !kw && !category
            ? '点击下方按钮发布第一个任务'
            : '换个筛选条件试试'
        }
        emptyAction={
          authStore.isManager && seg === 'all' ? (
            <View
              className='btn-primary pressable'
              onClick={() => Taro.navigateTo({ url: ROUTES.adminTaskPublish })}
            >
              <Text>发布任务</Text>
            </View>
          ) : null
        }
      >
        <View className='stack-gap'>
          {taskStore.tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onPress={() => Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })}
            />
          ))}
          {taskStore.loadingMore ? (
            <Text className='pool-more'>加载中…</Text>
          ) : !taskStore.hasMore && taskStore.tasks.length > 0 ? (
            <Text className='pool-more'>— 到底了 —</Text>
          ) : null}
        </View>
      </ListState>
    </PageShell>
  )
}

/** 横向滚动分类条 */
function ScrollViewX({ children }: { children: React.ReactNode }) {
  return (
    <View className='pool-chips-wrap'>
      <View className='pool-chips'>{children}</View>
    </View>
  )
}

export default observer(TaskPool)
