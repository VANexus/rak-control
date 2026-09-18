import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
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
