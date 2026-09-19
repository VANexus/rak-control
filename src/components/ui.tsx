import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { relTime } from '@/utils/format'
import { TASK_CATEGORY_LABEL, TASK_STATUS_LABEL, type Task } from '@/types/domain'
import './ui.scss'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <View className={`surface-card ${className}`}>{children}</View>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <View className='section-label'>
      <Text>{children}</Text>
    </View>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <View className='empty-state'>
      <Text className='text-card-title'>{title}</Text>
      {description ? <Text className='text-caption'>{description}</Text> : null}
    </View>
  )
}

export function RoleBadge({ role }: { role?: string | null }) {
  if (role === 'super_admin') {
    return (
      <View className='badge badge--brand'>
        <Text>超管</Text>
      </View>
    )
  }
  if (role === 'manager') {
    return (
      <View className='badge badge--success'>
        <Text>管理层</Text>
      </View>
    )
  }
  return (
    <View className='badge'>
      <Text>成员</Text>
    </View>
  )
}

export function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success' | 'warning' | 'brand' | 'muted'
}) {
  return (
    <View className='metric-card'>
      <Text className='metric-card__label'>{label}</Text>
      <Text
        className={`metric-card__value ${
          tone === 'success'
            ? 'text-success'
            : tone === 'warning'
              ? 'text-warning'
              : tone === 'brand'
                ? 'text-brand'
                : ''
        }`}
      >
        {value}
      </Text>
    </View>
  )
}

/** 任务卡（全站统一：池/首页/我的/验收队列） */
export function TaskCard({
  task,
  onPress,
  compact = false,
}: {
  task: Task
  onPress?: () => void
  compact?: boolean
}) {
  return (
    <View
      className={`task-card pressable task-card--${task.status.toLowerCase()}`}
      onClick={onPress}
    >
      <View className='task-card__strip' />
      <View className='task-card__body'>
        <View className='row-between'>
          <Text className='text-card-title task-card__title'>{task.title}</Text>
          <View className={`badge badge--${statusTone(task.status)}`}>
            <Text>{TASK_STATUS_LABEL[task.status]}</Text>
          </View>
        </View>
        {!compact ? (
          <Text className='text-caption task-card__desc'>
            {task.description.length > 44
              ? `${task.description.slice(0, 44)}…`
              : task.description}
          </Text>
        ) : null}
        <View className='row-between task-card__meta'>
          <View className='row-gap'>
            <View className='chip'>
              <Text>{TASK_CATEGORY_LABEL[task.category] || task.category}</Text>
            </View>
            {task.repo ? (
              <Text className='text-caption text-mono'>@{task.repo}</Text>
            ) : null}
          </View>
          <Text className='text-caption'>
            {task.assigneeName
              ? `${task.assigneeName} · ${relTime(task.claimedAt)}`
              : relTime(task.updatedAt)}
          </Text>
        </View>
      </View>
    </View>
  )
}

function statusTone(status: Task['status']): string {
  switch (status) {
    case 'OPEN':
      return 'brand'
    case 'CLAIMED':
      return 'warning'
    case 'SUBMITTED':
      return 'brand'
    case 'APPROVED':
    case 'DONE':
      return 'success'
    case 'REJECTED':
      return 'destructive'
    default:
      return ''
  }
}
