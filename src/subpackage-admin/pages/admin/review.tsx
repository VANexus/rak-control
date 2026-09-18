import { View, Text, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState } from '@/components/ui'
import { taskStore } from '@/store'
import { toast } from '@/utils/toast'
import { formatDateTime } from '@/utils/format'
import {
  TASK_CATEGORY_LABEL,
  type QualityGrade,
  type Task,
} from '@/types/domain'

function AdminReview() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [grade, setGrade] = useState<QualityGrade>('A')
  const [note, setNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    taskStore.loadTasks()
  }, [])

  const queue = taskStore.tasks.filter((t) => t.status === 'SUBMITTED')

  return (
    <PageShell title='任务验收' showBack requireRole='manage'>
      <View className='stack-gap fade-in'>
        <Text className='section-label'>待验收 {queue.length} 条</Text>
        {queue.length === 0 ? (
          <EmptyState title='没有待验收任务' description='成员提交后会出现在这里' />
        ) : (
          queue.map((t: Task) => (
            <Card key={t.id} className='stack-gap'>
              <View
                className='list-row--pressable'
                onClick={() => setOpenId(openId === t.id ? null : t.id)}
              >
                <View className='flex-1'>
                  <Text className='text-card-title'>{t.title}</Text>
                  <Text className='text-caption'>
                    {t.assigneeName || '—'} · {formatDateTime(t.submittedAt)} ·{' '}
                    {TASK_CATEGORY_LABEL[t.category]}
                  </Text>
                  <Text className='text-caption mt-8'>{t.submitNote || '（无交付说明）'}</Text>
                </View>
                <Text className='text-caption'>{openId === t.id ? '收起' : '处理'}</Text>
              </View>

              {openId === t.id ? (
                <>
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
                    className='form__textarea'
                    value={note}
                    maxlength={120}
                    placeholder='验收评语'
                    placeholderClass='text-muted'
                    onInput={(e) => setNote(String(e.detail.value))}
                  />
                  <View
                    className='btn-primary'
                    onClick={async () => {
                      try {
                        await taskStore.approve(t.id, grade, note.trim())
                        toast('已通过', 'success')
                        setOpenId(null)
                        setNote('')
                      } catch (e) {
                        toast((e as Error).message || '失败')
                      }
                    }}
                  >
                    <Text>通过（{grade}）</Text>
                  </View>
                  <Textarea
                    className='form__textarea'
                    value={rejectReason}
                    maxlength={120}
                    placeholder='驳回理由（必填）'
                    placeholderClass='text-muted'
                    onInput={(e) => setRejectReason(String(e.detail.value))}
                  />
                  <View
                    className='btn-secondary'
                    onClick={async () => {
                      try {
                        await taskStore.reject(t.id, rejectReason)
                        toast('已驳回', 'success')
                        setOpenId(null)
                        setRejectReason('')
                      } catch (e) {
                        toast((e as Error).message || '失败')
                      }
                    }}
                  >
                    <Text>驳回</Text>
                  </View>
                </>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </PageShell>
  )
}

export default observer(AdminReview)
