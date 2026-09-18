import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card, RoleBadge } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import { OWNER_USER_ID, ROUTES } from '@/constants'
import { formatRoiRatio } from '@/utils/format'
import './club.scss'

function ClubHome() {
  const uid = authStore.currentUserId
  const canSeeAll = authStore.isManager

  useEffect(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    teamStore.loadMembers()
    teamStore.loadAnnouncements()
    teamStore.loadPerformance()
  }, [])

  const perfMap = new Map(teamStore.allPerformance.map((p) => [p.userId, p]))
  const roster = teamStore.members.filter((m) => m.userId !== OWNER_USER_ID)

  return (
    <PageShell title='团队' subtitle={authStore.club?.name || ''}>
      <View className='stack-gap fade-in'>
        <Card>
          <Text className='text-title'>{authStore.club?.name || 'flowmind 开发组'}</Text>
          <Text className='text-caption mt-8'>
            {authStore.club?.description || '任务与考核'} · 在册 {roster.length} 人
          </Text>
        </Card>

        <View>
          <Text className='section-label'>成员考核</Text>
          <Card className='stack-gap'>
            {roster.map((m, index) => {
              const p = perfMap.get(m.userId)
              const isMe = m.userId === uid
              const showScore = canSeeAll || isMe
              const label = canSeeAll
                ? m.displayName
                : isMe
                  ? m.displayName
                  : `成员 ${index + 1}`
              return (
                <View
                  key={m.userId}
                  className={`list-row ${isMe ? 'team-row--me' : ''}`}
                >
                  <View className='flex-1'>
                    <View className='row-gap'>
                      <Text className='text-card-title'>{label}</Text>
                      {showScore ? <RoleBadge role={m.clubRole} /> : null}
                      {canSeeAll && index < 3 ? (
                        <View className='badge badge--brand'>
                          <Text>#{index + 1}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className='text-caption'>
                      {showScore ? m.duty || '成员' : '团队成员'}
                      {p
                        ? showScore
                          ? ` · 通过 ${p.approvedCount}/${p.claimedCount}`
                          : ` · 完成率 ${formatRoiRatio(p.completionRate)}`
                        : ''}
                    </Text>
                  </View>
                  {showScore && p ? (
                    <Text className='metric-value text-brand'>{p.compositeScore}</Text>
                  ) : (
                    <Text className='text-caption'>—</Text>
                  )}
                </View>
              )
            })}
            {!canSeeAll ? (
              <Text className='text-caption'>
                管理层可查看全员综合分；你只能看到自己的分数
              </Text>
            ) : null}
          </Card>
        </View>

        <View>
          <Text className='section-label'>公告</Text>
          <Card>
            {teamStore.announcements.length === 0 ? (
              <Text className='text-caption'>暂无公告</Text>
            ) : (
              teamStore.announcements.slice(0, 4).map((a) => (
                <View
                  key={a.id}
                  className='list-row list-row--pressable'
                  onClick={() =>
                    Taro.navigateTo({ url: `${ROUTES.announcementDetail}?id=${a.id}` })
                  }
                >
                  <View className='flex-1'>
                    <Text className='text-card-title'>{a.title}</Text>
                    <Text className='text-caption'>{a.authorName || ''}</Text>
                  </View>
                  <Text className='text-caption'>查看详情</Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </View>
    </PageShell>
  )
}

export default observer(ClubHome)
