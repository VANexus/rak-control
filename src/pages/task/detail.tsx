import { View, Text, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState } from '@/components/ui'
import { authStore, taskStore } from '@/store'
import { ROUTES } from '@/constants'
import {
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  type QualityGrade,
  type Task,
} from '@/types/domain'
import './detail.scss'

function statusBadgeClass(status: Task['status']) {
  if (status === 'APPROVED') return 'badge badge--success'
  if (status === 'OPEN') return 'badge badge--brand'
  if (status === 'REJECTED') return 'badge badge--destructive'
  return 'badge badge--warning'
}

function TaskDetailPage() {
  const router = useRouter()
  const id = String(router.params.id || '')
  const uid = authStore.currentUserId
  const task = taskStore.tasks.find((t) => t.id === id) || null
  const [note, setNote] = useState('')
  const [grade, setGrade] = useState<QualityGrade>('A')
  const [reviewNote, setReviewNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    taskStore.loadTasks()
  }, [id])

  const isMine = task?.assigneeId === uid
  const canReview = Boolean(authStore.isManager && task?.status === 'SUBMITTED')

  return (
    <PageShell title='任务详情' showBack>
      {!task ? (
        <EmptyState title='任务不存在或加载中' description='返回任务池看看其他任务' />
      ) : (
        <View className='stack-gap fade-in'>
          <Card className='stack-gap'>
            <View className='row-gap'>
              <View className={statusBadgeClass(task.status)}>
                <Text>{TASK_STATUS_LABEL[task.status]}</Text>
              </View>
              <View className='badge'>
                <Text>{TASK_CATEGORY_LABEL[task.category]}</Text>
              </View>
              {task.repo ? (
                <View className='badge'>
                  <Text className='text-mono'>{task.repo}</Text>
                </View>
              ) : null}
            </View>
            <Text className='text-title'>{task.title}</Text>
            <Text className='text-caption'>
              {task.assigneeName
                ? `认领人：${task.assigneeName}`
                : '尚未认领 · 名册成员均可认领'}
            </Text>
          </Card>

          <Card className='stack-gap'>
            <Text className='section-label'>任务说明</Text>
            <Text className='text-body detail__text'>{task.description}</Text>
            {task.acceptanceCriteria ? (
              <>
                <Text className='section-label mt-16'>验收标准</Text>
                <Text className='text-body detail__text'>{task.acceptanceCriteria}</Text>
              </>
            ) : null}
          </Card>

          {task.status === 'APPROVED' ? (
            <Card className='stack-gap'>
              <Text className='section-label'>验收结果</Text>
              <View className='row-gap'>
                <View className='badge badge--success'>
                  <Text>质量 {task.qualityGrade}</Text>
                </View>
              </View>
              <Text className='text-caption'>{task.qualityNote || '无评语'}</Text>
            </Card>
          ) : null}

          {task.status === 'CLAIMED' && task.rejectReason ? (
            <Card className='stack-gap'>
              <Text className='section-label text-destructive'>上次驳回原因</Text>
              <Text className='text-body'>{task.rejectReason}</Text>
            </Card>
          ) : null}

          {task.status === 'SUBMITTED' ? (
            <Card className='stack-gap'>
              <Text className='section-label'>交付说明</Text>
              <Text className='text-body'>{task.submitNote || '（未填写）'}</Text>
            </Card>
          ) : null}

          {task.status === 'OPEN' ? (
            <View
              className='btn-primary'
              onClick={() =>
                Taro.showModal({
                  title: '确认认领',
                  content: '认领后请在 7 天内提交验收。',
                  confirmText: '认领',
                  success: async (res) => {
                    if (!res.confirm || !uid) return
                    try {
                      await taskStore.claim(task.id, uid)
                      Taro.showToast({ title: '已认领', icon: 'success' })
                    } catch (e) {
                      Taro.showToast({
                        title: (e as Error).message || '认领失败',
                        icon: 'none',
                      })
                    }
                  },
                })
              }
            >
              <Text>一键认领</Text>
            </View>
          ) : null}

          {isMine && task.status === 'CLAIMED' ? (
            <Card className='stack-gap'>
              <Text className='section-label'>提交验收</Text>
              <Textarea
                className='detail__textarea'
                value={note}
                maxlength={200}
                placeholder='交付链接 / 说明（简要即可）'
                placeholderClass='text-muted'
                onInput={(e) => setNote(String(e.detail.value))}
              />
              <View
                className='btn-primary'
                onClick={async () => {
                  if (!note.trim()) {
                    Taro.showToast({ title: '请填写交付说明', icon: 'none' })
                    return
                  }
                  if (!uid) return
                  try {
                    await taskStore.submit(task.id, note.trim(), uid)
                    Taro.showToast({ title: '已提交，等待验收', icon: 'success' })
                    setNote('')
                  } catch (e) {
                    Taro.showToast({
                      title: (e as Error).message || '提交失败',
                      icon: 'none',
                    })
                  }
                }}
              >
                <Text>提交验收</Text>
              </View>
            </Card>
          ) : null}

          {isMine && task.status === 'SUBMITTED' && !canReview ? (
            <View className='btn-primary btn-primary--disabled'>
              <Text>已提交，等待验收…</Text>
            </View>
          ) : null}

          {canReview ? (
            <Card className='stack-gap'>
              <Text className='section-label'>管理员验收</Text>
              <View className='row-gap'>
                {(['A', 'B', 'C', 'D'] as QualityGrade[]).map((g) => (
                  <View
                    key={g}
                    className={`badge ${grade === g ? 'badge--brand' : ''}`}
                    onClick={() => setGrade(g)}
                  >
                    <Text>{g}</Text>
                  </View>
                ))}
              </View>
              <Textarea
                className='detail__textarea'
                value={reviewNote}
                maxlength={120}
                placeholder='验收评语（一句即可）'
                placeholderClass='text-muted'
                onInput={(e) => setReviewNote(String(e.detail.value))}
              />
              <View
                className='btn-primary'
                onClick={async () => {
                  try {
                    await taskStore.approve(task.id, grade, reviewNote.trim())
                    Taro.showToast({ title: '已通过', icon: 'success' })
                    setReviewNote('')
                  } catch (e) {
                    Taro.showToast({
                      title: (e as Error).message || '失败',
                      icon: 'none',
                    })
                  }
                }}
              >
                <Text>通过（{grade}）</Text>
              </View>
              <Textarea
                className='detail__textarea'
                value={rejectReason}
                maxlength={120}
                placeholder='驳回理由（驳回时必填）'
                placeholderClass='text-muted'
                onInput={(e) => setRejectReason(String(e.detail.value))}
              />
              <View
                className='btn-secondary'
                onClick={async () => {
                  try {
                    await taskStore.reject(task.id, rejectReason)
                    Taro.showToast({ title: '已驳回，任务退回', icon: 'success' })
                    setRejectReason('')
                  } catch (e) {
                    Taro.showToast({
                      title: (e as Error).message || '失败',
                      icon: 'none',
                    })
                  }
                }}
              >
                <Text>驳回并退回</Text>
              </View>
            </Card>
          ) : null}
        </View>
      )}
    </PageShell>
  )
}

export default observer(TaskDetailPage)
