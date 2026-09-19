import { View, Text, Input, Textarea, Switch } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { ListState } from '@/components/states'
import { authStore, teamStore } from '@/store'
import * as clubService from '@/services/club'
import { toast } from '@/utils/toast'
import { ApiError } from '@/utils/request'
import { formatDate } from '@/utils/format'
import '../../admin.scss'

function AdminAnnouncements() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = () => teamStore.loadAnnouncements(0).finally(() => setLoading(false))

  useDidShow(() => {
    void reload()
  })

  usePullDownRefresh(async () => {
    await reload()
    Taro.stopPullDownRefresh()
  })

  const save = async (publish: boolean) => {
    if (!title.trim() || !body.trim()) {
      toast('标题与正文必填')
      return
    }
    setBusy(true)
    try {
      let id = editingId
      if (id) {
        await clubService.updateAnnouncement(id, { title: title.trim(), body, pinned })
      } else {
        const created = await clubService.createAnnouncement({ title: title.trim(), body, pinned })
        id = created.id
      }
      if (publish) await clubService.publishAnnouncement(id)
      toast(publish ? '已发布' : '草稿已保存', 'success')
      setTitle('')
      setBody('')
      setPinned(false)
      setEditingId(null)
      await reload()
    } catch (e) {
      toast(e instanceof ApiError ? e.userMessage : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  const archive = async (id: string) => {
    const r = await Taro.showModal({ title: '归档公告', content: '归档后成员不可见' })
    if (!r.confirm) return
    try {
      await clubService.archiveAnnouncement(id)
      await reload()
    } catch (e) {
      toast(e instanceof ApiError ? e.userMessage : '归档失败')
    }
  }

  return (
    <PageShell title='公告管理' showBack requireRole='manage'>
      <View className='stack-gap fade-in'>
        <Card>
          <View className='admin-form'>
            <View className='admin-field'>
              <Text className='admin-field__label'>标题（≤60 字）</Text>
              <Input
                className='admin-input'
                value={title}
                maxlength={60}
                placeholder='公告标题'
                onInput={(e) => setTitle(e.detail.value)}
              />
            </View>
            <View className='admin-field'>
              <Text className='admin-field__label'>正文</Text>
              <Textarea
                className='admin-textarea'
                value={body}
                placeholder='支持换行的纯文本'
                onInput={(e) => setBody(e.detail.value)}
              />
            </View>
            <View className='row-between'>
              <Text className='admin-field__label'>置顶</Text>
              <Switch checked={pinned} onChange={(e) => setPinned(!!e.detail.value)} />
            </View>
            <View className='row-gap'>
              <View
                className={`btn-primary flex-1 pressable ${busy ? 'btn-primary--disabled' : ''}`}
                onClick={busy ? undefined : () => save(true)}
              >
                <Text>{editingId ? '更新并发布' : '发布'}</Text>
              </View>
              <View
                className='btn-secondary flex-1 pressable'
                onClick={busy ? undefined : () => save(false)}
              >
                <Text>存草稿</Text>
              </View>
            </View>
            {editingId ? (
              <Text
                className='text-caption text-brand'
                onClick={() => {
                  setEditingId(null)
                  setTitle('')
                  setBody('')
                }}
              >
                取消编辑
              </Text>
            ) : null}
          </View>
        </Card>

        <ListState
          loading={loading && teamStore.announcements.length === 0}
          error={null}
          empty={teamStore.announcements.length === 0}
          onRetry={reload}
          emptyTitle='还没有公告'
        >
          <Card>
            {teamStore.announcements.map((a) => (
              <View key={a.id} className='invite-card'>
                <View className='row-between'>
                  <Text className='text-card-title flex-1'>
                    {a.pinned ? '📌 ' : ''}
                    {a.title}
                  </Text>
                  <View
                    className={`badge ${a.status === 'PUBLISHED' ? 'badge--success' : 'badge--warning'}`}
                  >
                    <Text>{a.status === 'PUBLISHED' ? '已发布' : '草稿'}</Text>
                  </View>
                </View>
                <Text className='text-caption'>
                  {a.authorName} · {formatDate(a.publishedAt || a.createdAt)}
                </Text>
                <View className='row-gap'>
                  <Text
                    className='text-caption text-brand'
                    onClick={() => {
                      setEditingId(a.id)
                      setTitle(a.title)
                      setBody(a.body)
                      setPinned(a.pinned)
                    }}
                  >
                    编辑
                  </Text>
                  {a.status === 'DRAFT' ? (
                    <Text
                      className='text-caption text-success'
                      onClick={async () => {
                        await clubService.publishAnnouncement(a.id)
                        await reload()
                      }}
                    >
                      发布
                    </Text>
                  ) : null}
                  <Text className='text-caption text-destructive' onClick={() => archive(a.id)}>
                    归档
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </ListState>
      </View>
    </PageShell>
  )
}

export default observer(AdminAnnouncements)
