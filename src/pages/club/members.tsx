import { View, Text } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState, RoleBadge } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import { OWNER_USER_ID } from '@/constants'
import { formatRoiRatio } from '@/utils/format'

function Members() {
  const uid = authStore.currentUserId
  const canSeeAll = authStore.isManager

  useEffect(() => {
    teamStore.loadMembers()
    teamStore.loadPerformance()
  }, [])

  const perfMap = new Map(teamStore.allPerformance.map((p) => [p.userId, p]))
  const roster = teamStore.members.filter((m) => m.userId !== OWNER_USER_ID)

  return (
    <PageShell title='成员目录' showBack>
      {roster.length === 0 ? (
        <EmptyState title='暂无成员' />
      ) : (
        <Card className='fade-in'>
          {roster.map((m) => {
            const p = perfMap.get(m.userId)
            const isMe = m.userId === uid
            const showDetail = canSeeAll || isMe
            return (
              <View key={m.userId} className='list-row'>
                <View className='flex-1'>
                  <View className='row-gap'>
                    <Text className='text-card-title'>
                      {showDetail ? m.displayName : `成员 ${m.userId.toUpperCase()}`}
                    </Text>
                    {showDetail ? <RoleBadge role={m.clubRole} /> : null}
                  </View>
                  <Text className='text-caption'>
                    {showDetail ? m.duty || '—' : '—'}
                    {p
                      ? showDetail
                        ? ` · 认领 ${p.claimedCount} / 通过 ${p.approvedCount}`
                        : ` · 完成率 ${formatRoiRatio(p.completionRate)}`
                      : ''}
                  </Text>
                </View>
                {showDetail && p ? (
                  <Text className='metric-value text-brand'>{p.compositeScore}</Text>
                ) : (
                  <Text className='text-caption'>—</Text>
                )}
              </View>
            )
          })}
        </Card>
      )}
    </PageShell>
  )
}

export default observer(Members)
