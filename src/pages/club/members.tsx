import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { RoleBadge } from '@/components/ui'
import { Skeleton } from '@/components/states'
import { authStore, teamStore } from '@/store'
import { formatDate } from '@/utils/format'
import './club.scss'

function Members() {
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    teamStore.loadMembers().finally(() => setLoading(false))
  })

  usePullDownRefresh(async () => {
    await teamStore.loadMembers()
    Taro.stopPullDownRefresh()
  })

  const active = teamStore.members.filter((m) => m.status === 'ACTIVE')

  return (
    <PageShell title='成员目录' showBack subtitle={`${active.length} 人`}>
      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <View className='surface-card fade-in'>
          {active.map((m) => {
            const isMe = m.userId === authStore.user?.id
            const name = m.displayName || '成员'
            return (
              <View key={m.id} className='member-row'>
                <View className='avatar-dot'>
                  <Text>{name.slice(0, 1)}</Text>
                </View>
                <View className='flex-1'>
                  <View className='row-gap'>
                    <Text className='text-card-title'>
                      {name}
                      {isMe ? '（我）' : ''}
                    </Text>
                    <RoleBadge role={m.clubRole} />
                  </View>
                  <Text className='text-caption'>
                    {m.duty || '成员'} · 入队 {formatDate(m.joinedAt)}
                  </Text>
                </View>
              </View>
            )
          })}
          {active.length === 0 ? <Text className='text-caption'>暂无成员</Text> : null}
        </View>
      )}
    </PageShell>
  )
}

export default observer(Members)
