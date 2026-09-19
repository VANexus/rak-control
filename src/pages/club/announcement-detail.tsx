import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Skeleton } from '@/components/states'
import * as clubService from '@/services/club'
import { toast } from '@/utils/toast'
import { ApiError } from '@/utils/request'
import { formatDateTime } from '@/utils/format'
import type { Announcement } from '@/types/domain'
import './club.scss'

function AnnouncementDetail() {
  const [item, setItem] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const id = Taro.getCurrentInstance().router?.params?.id || ''

  useEffect(() => {
    clubService
      .fetchAnnouncement(id)
      .then(setItem)
      .catch((e) => {
        toast(e instanceof ApiError ? e.userMessage : '公告不存在')
        setTimeout(() => Taro.navigateBack(), 800)
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageShell title='公告详情' showBack>
      {loading ? (
        <Skeleton rows={2} />
      ) : item ? (
        <View className='surface-card fade-in'>
          <Text className='text-title'>
            {item.pinned ? '📌 ' : ''}
            {item.title}
          </Text>
          <Text className='text-caption' style={{ marginTop: '12rpx', display: 'block' }}>
            {item.authorName || ''} · {formatDateTime(item.publishedAt || item.createdAt)}
          </Text>
          <View className='hairline' style={{ margin: '24rpx 0' }} />
          <Text className='text-body ann-body'>{item.body}</Text>
        </View>
      ) : null}
    </PageShell>
  )
}

export default observer(AnnouncementDetail)
