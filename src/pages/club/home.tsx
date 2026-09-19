import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, RoleBadge } from '@/components/ui'
import { Skeleton } from '@/components/states'
import { authStore, roiStore, teamStore } from '@/store'
import { ROUTES } from '@/constants'
import { formatMoney2, formatRoiRatio } from '@/utils/format'
import './club.scss'

function ClubHome() {
  const [ready, setReady] = useState(false)

  useDidShow(() => {
    if (authStore.status === 'LOADING') return
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    void Promise.all([
      teamStore.loadMembers(),
      teamStore.loadAnnouncements(0),
      authStore.isManager ? teamStore.loadPerformance() : Promise.resolve(),
      authStore.isManager ? roiStore.loadOverview() : Promise.resolve(),
    ]).finally(() => setReady(true))
  })

  usePullDownRefresh(async () => {
    await Promise.all([
      teamStore.loadMembers(),
      teamStore.loadAnnouncements(0),
      authStore.isManager ? teamStore.loadPerformance() : Promise.resolve(),
    ])
    Taro.stopPullDownRefresh()
  })

  const uid = authStore.user?.id
  const perfMap = new Map(teamStore.allPerformance.map((p) => [p.userId, p]))
  const topPerf = teamStore.allPerformance.slice(0, 5)

  return (
    <PageShell title='团队' subtitle={authStore.club?.name || ''}>
      {!ready ? (
        <Skeleton rows={3} />
      ) : (
        <View className='stack-gap fade-in'>
          {/* 社团头卡 */}
          <Card>
            <Text className='text-title'>{authStore.club?.name || 'Rak'}</Text>
            <Text className='text-caption mt-8'>
              {authStore.club?.slug === 'flowmind' ? '任务与考核 · ' : ''}
              在册 {teamStore.members.filter((m) => m.status === 'ACTIVE').length} 人
            </Text>
            <View className='club-stats'>
              <View className='club-stats__item'>
                <Text className='club-stats__num'>{teamStore.members.filter((m) => m.status === 'ACTIVE').length}</Text>
                <Text className='text-caption'>成员</Text>
              </View>
              {authStore.isManager && roiStore.overview ? (
                <View className='club-stats__item'>
                  <Text className='club-stats__num text-success'>
                    ¥{formatMoney2(roiStore.overview.net)}
                  </Text>
                  <Text className='text-caption'>本月净额</Text>
                </View>
              ) : null}
              {authStore.isManager && roiStore.overview ? (
                <View className='club-stats__item'>
                  <Text className='club-stats__num text-brand'>
                    {formatRoiRatio(roiStore.overview.roiRatio)}
                  </Text>
                  <Text className='text-caption'>本月 ROI</Text>
                </View>
              ) : null}
            </View>
          </Card>

          {/* 公告 */}
          <View>
            <View className='row-between'>
              <Text className='section-label'>公告</Text>
              <Text
                className='text-caption text-brand'
                onClick={() => Taro.navigateTo({ url: ROUTES.announcements })}
              >
                全部 ›
              </Text>
            </View>
            <Card>
              {teamStore.announcements.length === 0 ? (
                <Text className='text-caption'>暂无公告</Text>
              ) : (
                teamStore.announcements.slice(0, 3).map((a) => (
                  <View
                    key={a.id}
                    className='list-row list-row--pressable'
                    onClick={() =>
                      Taro.navigateTo({ url: `${ROUTES.announcementDetail}?id=${a.id}` })
                    }
                  >
                    <View className='flex-1'>
                      <Text className='text-card-title'>
                        {a.pinned ? '📌 ' : ''}
                        {a.title}
                      </Text>
                      <Text className='text-caption'>{a.authorName || ''}</Text>
                    </View>
                    <Text className='text-caption'>›</Text>
                  </View>
                ))
              )}
            </Card>
          </View>

          {/* 绩效榜（manager+） */}
          {authStore.isManager ? (
            <View>
              <Text className='section-label'>综合绩效榜</Text>
              <Card>
                {topPerf.length === 0 ? (
                  <Text className='text-caption'>还没有认领记录</Text>
                ) : (
                  topPerf.map((p, i) => (
                    <View key={p.userId} className='list-row'>
                      <Text className='club-rank'>{i + 1}</Text>
                      <View className='flex-1'>
                        <View className='row-gap'>
                          <Text className='text-card-title'>{p.displayName || '成员'}</Text>
                          <RoleBadge role={p.role} />
                        </View>
                        <Text className='text-caption'>
                          {p.duty || '成员'} · 通过 {p.approvedCount}/{p.claimedCount}
                        </Text>
                      </View>
                      <Text className='metric-value text-brand'>{p.compositeScore}</Text>
                    </View>
                  ))
                )}
              </Card>
            </View>
          ) : (
            <Card
              className='pressable'
            >
              <View
                className='row-between'
                onClick={() => Taro.navigateTo({ url: ROUTES.members })}
              >
                <View>
                  <Text className='text-card-title'>成员目录</Text>
                  <Text className='text-caption'>查看团队名册</Text>
                </View>
                <Text className='text-caption'>›</Text>
              </View>
            </Card>
          )}

          {/* 我的绩效（全员可见自己） */}
          {uid ? (
            <Card className='pressable' >
              <View
                className='row-between'
                onClick={() => Taro.navigateTo({ url: ROUTES.myPerformance })}
              >
                <View>
                  <Text className='text-card-title'>我的绩效</Text>
                  <Text className='text-caption'>完成率 × 质量分</Text>
                </View>
                {authStore.isManager && perfMap.get(uid) ? (
                  <Text className='metric-value text-brand'>
                    {perfMap.get(uid)!.compositeScore}
                  </Text>
                ) : (
                  <Text className='text-caption'>›</Text>
                )}
              </View>
            </Card>
          ) : null}

          {authStore.isManager ? (
            <View
              className='btn-secondary pressable'
              onClick={() => Taro.navigateTo({ url: ROUTES.members })}
            >
              <Text>成员管理入口</Text>
            </View>
          ) : null}
        </View>
      )}
    </PageShell>
  )
}

export default observer(ClubHome)
