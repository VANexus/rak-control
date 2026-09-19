import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, RoleBadge } from '@/components/ui'
import { Skeleton } from '@/components/states'
import { authStore, taskStore } from '@/store'
import * as taskService from '@/services/task'
import { ApiError } from '@/utils/request'
import { toast } from '@/utils/toast'
import { formatDateTime } from '@/utils/format'
import { TASK_CATEGORY_LABEL, TASK_STATUS_LABEL } from '@/types/domain'
import type { QualityGrade, Task } from '@/types/domain'
import './detail.scss'

function TaskDetail() {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const id = Taro.getCurrentInstance().router?.params?.id || ''

  const refresh = async () => {
    try {
      const t = await taskService.fetchTask(id)
      setTask(t)
    } catch (e) {
      toast(e instanceof ApiError ? e.userMessage : '任务不存在')
      setTimeout(() => Taro.navigateBack(), 800)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    void refresh()
  })

  if (loading || !task) {
    return (
      <PageShell title='任务详情' showBack>
        <Skeleton rows={3} />
      </PageShell>
    )
  }

  const isMine = task.assigneeId === authStore.user?.id
  const mgr = authStore.isManager
  const canSubmit = isMine && (task.status === 'CLAIMED' || task.status === 'REJECTED')

  const runAction = async (fn: Promise<unknown>, after?: () => void) => {
    try {
      await fn
      await refresh()
      await taskStore.refresh().catch(() => null)
      after?.()
    } catch {
      /* taskStore.action 内部已 toast；服务直调失败提示 */
    }
  }

  const onClaim = async () => {
    const r = await Taro.showModal({ title: '认领任务', content: `确定认领「${task.title}」？` })
    if (r.confirm) await runAction(taskStore.claim(task.id))
  }

  const onSubmit = async () => {
    const r = await Taro.showModal({
      title: '提交任务',
      editable: true,
      placeholderText: '交付说明（做了什么、产出在哪）',
    })
    if (r.confirm) {
      const note = (r.content || '').trim()
      if (!note) {
        toast('请填写交付说明')
        return
      }
      await runAction(taskStore.submit(task.id, note))
    }
  }

  const onApprove = async () => {
    const pick = await Taro.showActionSheet({
      itemList: ['A · 优秀（90）', 'B · 良好（75）', 'C · 合格（60）', 'D · 待改进（40）'],
    }).catch(() => null)
    if (!pick) return
    const grade = (['A', 'B', 'C', 'D'] as QualityGrade[])[pick.tapIndex]
    const r = await Taro.showModal({
      title: `验收通过 · ${grade}`,
      editable: true,
      placeholderText: '评语（可选）',
    })
    if (r.confirm) await runAction(taskStore.approve(task.id, grade, (r.content || '').trim()))
  }

  const onReject = async () => {
    const r = await Taro.showModal({
      title: '驳回任务',
      editable: true,
      placeholderText: '驳回理由（必填，指出问题与期望）',
    })
    if (!r.confirm) return
    const reason = (r.content || '').trim()
    if (!reason) {
      toast('驳回必须填写理由')
      return
    }
    await runAction(taskStore.reject(task.id, reason))
  }

  const onArchive = async () => {
    const r = await Taro.showModal({ title: '归档任务', content: '归档后不再计入进行中统计' })
    if (r.confirm) await runAction(taskStore.archive(task.id))
  }

  return (
    <PageShell title='任务详情' showBack>
      <View className='stack-gap fade-in'>
        <Card>
          <Text className='text-title'>{task.title}</Text>
          <View className='row-gap detail-tags'>
            <View className='chip'>
              <Text>{TASK_CATEGORY_LABEL[task.category] || task.category}</Text>
            </View>
            {task.repo ? <Text className='text-caption text-mono'>@{task.repo}</Text> : null}
            <View key={task.status} className={`badge badge--${tone(task.status)} rise-in`}>
              <Text>{TASK_STATUS_LABEL[task.status]}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text className='section-label'>任务描述</Text>
          <Text className='text-body'>{task.description}</Text>
        </Card>

        {task.acceptanceCriteria ? (
          <Card>
            <Text className='section-label'>验收标准</Text>
            <Text className='text-body'>{task.acceptanceCriteria}</Text>
          </Card>
        ) : null}

        {/* 交付信息 */}
        {task.submitNote || task.qualityGrade || task.rejectReason ? (
          <Card>
            <Text className='section-label'>交付记录</Text>
            {task.submitNote ? (
              <View className='detail-block'>
                <Text className='text-caption'>交付说明</Text>
                <Text className='text-body'>{task.submitNote}</Text>
              </View>
            ) : null}
            {task.status === 'APPROVED' || task.status === 'DONE' ? (
              <View className='detail-block'>
                <Text className='text-caption'>
                  验收：
                  <Text className='text-success'>评级 {task.qualityGrade || '—'}</Text>
                </Text>
                {task.qualityNote ? <Text className='text-body'>{task.qualityNote}</Text> : null}
              </View>
            ) : null}
            {task.status === 'REJECTED' ? (
              <View className='detail-block detail-block--danger'>
                <Text className='text-caption'>驳回原因</Text>
                <Text className='text-body'>{task.rejectReason}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* 状态时间线 */}
        <Card>
          <Text className='section-label'>流转记录</Text>
          <Timeline name='发布' time={`${task.createdByName || ''} ${formatDateTime(task.createdAt)}`} />
          {task.claimedAt ? <Timeline name='认领' time={formatDateTime(task.claimedAt)} /> : null}
          {task.submittedAt ? <Timeline name='提交' time={formatDateTime(task.submittedAt)} /> : null}
          {task.approvedAt ? <Timeline name='通过' time={formatDateTime(task.approvedAt)} /> : null}
          {task.rejectedAt ? <Timeline name='驳回' time={formatDateTime(task.rejectedAt)} danger /> : null}
          {task.status === 'DONE' ? <Timeline name='归档' time={formatDateTime(task.updatedAt)} /> : null}
          {task.assigneeName ? (
            <View className='row-between detail-assignee'>
              <Text className='text-caption'>当前负责人</Text>
              <Text className='text-card-title'>{task.assigneeName}</Text>
            </View>
          ) : (
            <Text className='text-caption'>尚未有人认领</Text>
          )}
        </Card>

        {/* 动作面（按状态与角色渲染；服务端仍是最终防线） */}
        <View className='detail-actions'>
          {task.status === 'OPEN' ? (
            <View className='btn-primary pressable' onClick={onClaim}>
              <Text>认领任务</Text>
            </View>
          ) : null}
          {canSubmit ? (
            <View className='btn-primary pressable' onClick={onSubmit}>
              <Text>{task.status === 'REJECTED' ? '修改后重新提交' : '提交验收'}</Text>
            </View>
          ) : null}
          {mgr && task.status === 'SUBMITTED' ? (
            <View className='stack-gap'>
              <View className='btn-primary pressable' onClick={onApprove}>
                <Text>验收通过</Text>
              </View>
              <View className='btn-secondary btn-danger-text pressable' onClick={onReject}>
                <Text>驳回</Text>
              </View>
            </View>
          ) : null}
          {mgr && task.status === 'APPROVED' ? (
            <View className='btn-secondary pressable' onClick={onArchive}>
              <Text>归档</Text>
            </View>
          ) : null}
          {authStore.clubRole && !isMine && task.status !== 'OPEN' ? (
            <View className='row-between'>
              <Text className='text-caption'>
                {task.assigneeName ? `由 ${task.assigneeName} 负责` : ''}
              </Text>
              <RoleBadge role={authStore.clubRole} />
            </View>
          ) : null}
        </View>
      </View>
    </PageShell>
  )
}

function Timeline({ name, time, danger }: { name: string; time: string; danger?: boolean }) {
  return (
    <View className='timeline-step'>
      <View className={`timeline-dot ${danger ? 'timeline-dot--danger' : 'timeline-dot--done'}`} />
      <View className='timeline-step__body'>
        <Text className='text-card-title'>{name}</Text>
        <Text className='text-caption'>{time}</Text>
      </View>
    </View>
  )
}

function tone(status: Task['status']): string {
  switch (status) {
    case 'OPEN':
    case 'SUBMITTED':
      return 'brand'
    case 'CLAIMED':
      return 'warning'
    case 'APPROVED':
    case 'DONE':
      return 'success'
    case 'REJECTED':
      return 'destructive'
    default:
      return ''
  }
}

export default observer(TaskDetail)
