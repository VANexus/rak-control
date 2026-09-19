import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import './states.scss'

/** 列表骨架屏（设计 §5.2-1） */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View className='sk-wrap'>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className='sk-card'>
          <View className='sk-line sk-line--title' style={{ width: '62%' }} />
          <View className='sk-line' style={{ width: `${88 - i * 7}%` }} />
          <View className='sk-line' style={{ width: '40%' }} />
        </View>
      ))}
    </View>
  )
}

/** 空态（§5.2-2）：CSS 绘制图形 + 引导 + 可选主操作 */
export function EmptyView({
  title,
  hint,
  action,
  art = 'list',
}: {
  title: string
  hint?: string
  action?: ReactNode
  art?: 'list' | 'roi' | 'bell' | 'user' | 'search'
}) {
  return (
    <View className='empty-view'>
      <View className={`empty-art empty-art--${art}`}>
        <View className='empty-art__inner' />
      </View>
      <Text className='empty-view__title'>{title}</Text>
      {hint ? <Text className='empty-view__hint'>{hint}</Text> : null}
      {action ? <View className='empty-view__action'>{action}</View> : null}
    </View>
  )
}

/** 错误态（§5.2-3）：内联错误卡 + 重试 */
export function ErrorView({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <View className='error-view' onClick={onRetry}>
      <View className='error-view__icon'>!</View>
      <Text className='empty-view__title'>{message}</Text>
      <Text className='empty-view__hint'>点击重试</Text>
    </View>
  )
}

/** 带状态切换的列表容器：骨架 → 错误 → 空 → 内容 */
export function ListState(props: {
  loading: boolean
  error: string | null
  empty: boolean
  onRetry: () => void
  emptyTitle: string
  emptyHint?: string
  emptyAction?: ReactNode
  art?: 'list' | 'roi' | 'bell' | 'user' | 'search'
  children: ReactNode
}) {
  if (props.error) return <ErrorView message={props.error} onRetry={props.onRetry} />
  if (props.loading) return <Skeleton />
  if (props.empty) {
    return (
      <EmptyView
        title={props.emptyTitle}
        hint={props.emptyHint}
        action={props.emptyAction}
        art={props.art}
      />
    )
  }
  return <View className='rise-in'>{props.children}</View>
}
