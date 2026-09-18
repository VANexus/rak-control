import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState } from '@/components/ui'
import { teamStore } from '@/store'
import { ROUTES } from '@/constants'
import { formatDateTime } from '@/utils/format'

function AnnouncementList() {
  useEffect(() => {
    teamStore.loadAnnouncements()
  }, [])

  const list = teamStore.announcements.filter((a) => a.status === 'PUBLISHED')

  return (
    <PageShell title='公告' showBack>
      {list.length === 0 ? (
        <EmptyState title='暂无公告' description='管理员发布后会出现在这里' />
      ) : (
        <Card className='stack-gap fade-in'>
          {list.map((a) => (
            <View
              key={a.id}
              className='list-row list-row--pressable'
              onClick={() =>
                Taro.navigateTo({ url: `${ROUTES.announcementDetail}?id=${a.id}` })
              }
            >
              <View className='flex-1'>
                <Text className='text-card-title'>
                  {a.pinned ? '置顶 · ' : ''}
                  {a.title}
                </Text>
                <Text className='text-caption text-mono'>
                  {formatDateTime(a.publishedAt)} · {a.authorName || '管理员'}
                </Text>
              </View>
              <Text className='text-caption'>›</Text>
            </View>
          ))}
        </Card>
      )}
    </PageShell>
  )
}

export default observer(AnnouncementList)
