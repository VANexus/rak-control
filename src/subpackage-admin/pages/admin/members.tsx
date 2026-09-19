import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, RoleBadge } from '@/components/ui'
import { Skeleton } from '@/components/states'
import { authStore, teamStore } from '@/store'
import { formatDate } from '@/utils/format'
import '../../admin.scss'

function AdminMembers() {
  const [loading, setLoading] = useState(true)

  const reload = () => teamStore.loadMembers().finally(() => setLoading(false))

  useDidShow(() => {
    void reload()
  })

  usePullDownRefresh(async () => {
    await reload()
    Taro.stopPullDownRefresh()
  })

  const changeStatus = async (userId: string, current: string) => {
    const options = ['ACTIVE', 'LEFT', 'DISABLED']
    const idx = options.indexOf(current)
    const pick = await Taro.showActionSheet({
      itemList: ['设为在册', '设为离队', '设为停用'].filter((_, i) => i !== idx),
    }).catch(() => null)
    if (!pick) return
    const target = options.filter((_, i) => i !== idx)[pick.tapIndex]
    await teamStore.setMemberStatus(userId, target)
  }

  if (loading) {
    return (
      <PageShell title='成员管理' showBack requireRole='manage'>
        <Skeleton rows={4} />
      </PageShell>
    )
  }

  return (
    <PageShell title='成员管理' showBack requireRole='manage' subtitle={`在册 ${teamStore.members.filter((m) => m.status === 'ACTIVE').length}`}>
      <Card className='fade-in'>
        {teamStore.members.map((m) => {
          const name = m.displayName || '成员'
          return (
            <View key={m.id} className='member-row'>
              <View className='avatar-dot'>
                <Text>{name.slice(0, 1)}</Text>
              </View>
              <View className='flex-1'>
                <View className='row-gap'>
                  <Text className='text-card-title'>{name}</Text>
                  <RoleBadge role={m.clubRole} />
                  {m.status !== 'ACTIVE' ? (
                    <View className='badge badge--destructive'>
                      <Text>{m.status === 'LEFT' ? '离队' : '停用'}</Text>
                    </View>
                  ) : null}
                </View>
                <Text className='text-caption'>
                  {m.duty || '成员'} · 入队 {formatDate(m.joinedAt)}
                </Text>
              </View>
              {authStore.isSuper || m.clubRole === 'member' ? (
                <Text
                  className='text-caption text-brand'
                  onClick={() => changeStatus(m.userId, m.status)}
                >
                  状态
                </Text>
              ) : null}
            </View>
          )
        })}
      </Card>
    </PageShell>
  )
}

export default observer(AdminMembers)
