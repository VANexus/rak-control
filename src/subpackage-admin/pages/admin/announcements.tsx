import { View, Text, Input, Textarea } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import { publishAnnouncement } from '@/services/club'
import { toast } from '@/utils/toast'
import { formatDateTime } from '@/utils/format'

function AdminAnnouncements() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    teamStore.loadAnnouncements()
  }, [])

  return (
    <PageShell title='公告' showBack requireRole='manage'>
      <View className='stack-gap fade-in'>
        <Card className='stack-gap'>
          <Text className='section-label'>发布公告</Text>
          <Input
            className='form__input'
            value={title}
            maxlength={40}
            placeholder='标题'
            placeholderClass='text-muted'
            onInput={(e) => setTitle(String(e.detail.value))}
          />
          <Textarea
            className='form__textarea'
            value={body}
            maxlength={300}
            placeholder='正文'
            placeholderClass='text-muted'
            onInput={(e) => setBody(String(e.detail.value))}
          />
          <View
            className='btn-primary'
            onClick={async () => {
              if (!title.trim() || !body.trim()) {
                toast('请填写标题与正文')
                return
              }
              try {
                await publishAnnouncement({
                  title: title.trim(),
                  body: body.trim(),
                  authorId: authStore.currentUserId || '',
                  authorName: authStore.displayName,
                  pinned: false,
                })
                toast('已发布', 'success')
                setTitle('')
                setBody('')
                teamStore.loadAnnouncements()
              } catch (e) {
                toast((e as Error).message || '失败')
              }
            }}
          >
            <Text>发布</Text>
          </View>
        </Card>
        <Card>
          {teamStore.announcements.map((a) => (
            <View key={a.id} className='list-row'>
              <View className='flex-1'>
                <Text className='text-card-title'>{a.title}</Text>
                <Text className='text-caption text-mono'>
                  {formatDateTime(a.publishedAt)} · {a.authorName || ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </PageShell>
  )
}

export default observer(AdminAnnouncements)
