import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState } from '@/components/ui'
import { teamStore } from '@/store'
import { formatDateTime } from '@/utils/format'
import type { Announcement } from '@/types/domain'

function AnnouncementDetail() {
  const router = useRouter()
  const [item, setItem] = useState<Announcement | null>(null)

  useEffect(() => {
    const load = async () => {
      if (teamStore.announcements.length === 0) await teamStore.loadAnnouncements()
      const found = teamStore.announcements.find((a) => a.id === router.params.id)
      setItem(found || null)
    }
    load()
  }, [router.params.id])

  if (!item) {
    return (
      <PageShell title='公告详情' showBack>
        <EmptyState title='公告不存在' />
      </PageShell>
    )
  }

  return (
    <PageShell title='公告' showBack>
      <Card className='fade-in'>
        <Text className='text-title'>{item.title}</Text>
        <Text className='text-caption text-mono mt-8'>
          {formatDateTime(item.publishedAt)} · {item.authorName || '管理员'}
          {item.pinned ? ' · 置顶' : ''}
        </Text>
        <View className='hairline' />
        <Text className='text-body' selectable>
          {item.body}
        </Text>
      </Card>
    </PageShell>
  )
}

export default observer(AnnouncementDetail)
