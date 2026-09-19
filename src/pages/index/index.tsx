import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, HeroBlock, StatusPill, TaskCard, Tile, TileGrid } from '@/components/ui'
import { Skeleton } from '@/components/states'
import { authStore, taskStore } from '@/store'
import * as taskService from '@/services/task'
import * as roiService from '@/services/roi'
import * as clubService from '@/services/club'
import { ROUTES } from '@/constants'
import { formatMoney2, formatRoiRatio } from '@/utils/format'
import type { Announcement, RoiOverview, Task } from '@/types/domain'
import './index.scss'

interface HomeData {
  myActive: Task[]
  openCount: number
  reviewCount: number
  roi: RoiOverview | null
  announcements: Announcement[]
}

function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [ready, setReady] = useState(false)

  const load = async () => {
    if (!authStore.isLoggedIn) return
    try {
      const uid = authStore.user?.id || ''
      const [mine, open, review, roi, anns] = await Promise.all([
        taskService.fetchTasks({ assigneeId: uid, status: 'CLAIMED,SUBMITTED,REJECTED', size: 3 }),
        taskService.fetchTasks({ status: 'OPEN', size: 1 }),
        authStore.isManager
          ? taskService.fetchTasks({ status: 'SUBMITTED', size: 1 })
          : Promise.resolve(null),
        roiService.fetchRoiOverview('month').catch(() => null),
        clubService.fetchAnnouncements(0, 3).catch(() => null),
      ])
      setData({
        myActive: mine.items,
        openCount: open.total,
        reviewCount: review?.total ?? 0,
        roi,
        announcements: anns?.items.filter((a) => a.status === 'PUBLISHED').slice(0, 2) || [],
      })
    } finally {
      setReady(true)
    }
  }

  useDidShow(() => {
    if (authStore.status === 'LOADING') return
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    void load()
  })

  usePullDownRefresh(async () => {
    await load()
    Taro.stopPullDownRefresh()
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 6) return '夜深了'
    if (h < 12) return '早上好'
    if (h < 18) return '下午好'
    return '晚上好'
  }

  return (
    <PageShell
      kicker='HOME'
      headTitle={`${greeting()}，${authStore.user?.displayName || '成员'}`}
      headStatus={
        authStore.isManager && ready && data && data.reviewCount > 0 ? (
          <StatusPill dot text={`${data.reviewCount} 个待验收`} />
        ) : (
          <StatusPill text={authStore.club?.name || 'Rak'} />
        )
      }
    >
      {!ready || !data ? (
        <Skeleton rows={4} />
      ) : (
        <View className='stack-gap fade-in'>
          {/* hero：本月 ROI 速览 */}
          <HeroBlock
            variant='metric'
            onClick={() => Taro.switchTab({ url: ROUTES.roiOverview })}
          >
            <Text className='hero-block__desc'>本月净额（元）</Text>
            <View className='home-hero-metrics'>
              <Text className='text-display-mono'>¥{formatMoney2(data.roi?.net ?? 0)}</Text>
              <Text
                className={`home-hero-ratio ${
                  data.roi?.roiRatio !== null && data.roi?.roiRatio !== undefined && data.roi.roiRatio >= 0
                    ? 'text-success'
                    : 'text-destructive'
                }`}
              >
                ROI {formatRoiRatio(data.roi?.roiRatio ?? null)}
              </Text>
            </View>
            {data.roi && data.roi.series.length > 0 ? (
              <MiniBars series={data.roi.series} />
            ) : null}
          </HeroBlock>

          {/* 宫格入口 */}
          <TileGrid>
            <Tile
              face='solid'
              mark='arrow'
              title='任务池'
              desc={`${data.openCount} 个任务在池可领`}
              onClick={() => Taro.switchTab({ url: ROUTES.taskPool })}
            />
            {authStore.isManager ? (
              <Tile
                face='white'
                mark={data.reviewCount > 0 ? 'check' : 'arrow'}
                title='任务验收'
                desc={data.reviewCount > 0 ? `${data.reviewCount} 个等待验收` : '暂无待验收'}
                onClick={() => Taro.navigateTo({ url: ROUTES.adminReview })}
              />
            ) : (
              <Tile
                face='white'
                mark='arrow'
                title='公告'
                desc='查看社团最新'
                onClick={() => Taro.navigateTo({ url: ROUTES.announcements })}
              />
            )}
            {authStore.isManager ? (
              <>
                <Tile
                  face='white'
                  mark='arrow'
                  title='发布任务'
                  desc='指派与奖励一并填'
                  onClick={() => Taro.navigateTo({ url: ROUTES.adminTaskPublish })}
                />
                <Tile
                  face='paper'
                  mark='arrow'
                  title='邀请码'
                  desc='生成新成员入口'
                  onClick={() => Taro.navigateTo({ url: ROUTES.adminInvites })}
                />
              </>
            ) : null}
          </TileGrid>

          {/* 我的进行中 */}
          <View>
            <View className='row-between'>
              <Text className='section-label'>我的进行中</Text>
              <Text
                className='text-caption text-brand'
                onClick={() => Taro.switchTab({ url: ROUTES.taskPool })}
              >
                全部任务 ›
              </Text>
            </View>
            <Card>
              {data.myActive.length === 0 ? (
                <View className='home-empty-clickable' onClick={() => Taro.switchTab({ url: ROUTES.taskPool })}>
                  <Text className='text-caption'>当前没有进行中的任务，去任务池看看？</Text>
                </View>
              ) : (
                <View className='stack-gap'>
                  {data.myActive.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      compact
                      onPress={() =>
                        Taro.navigateTo({ url: `${ROUTES.taskDetail}?id=${t.id}` })
                      }
                    />
                  ))}
                </View>
              )}
            </Card>
          </View>

          {/* 置顶/最新公告 */}
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
              {data.announcements.length === 0 ? (
                <Text className='text-caption'>最近没有新公告</Text>
              ) : (
                data.announcements.map((a) => (
                  <View
                    key={a.id}
                    className='list-row list-row--pressable'
                    onClick={() =>
                      Taro.navigateTo({
                        url: `${ROUTES.announcementDetail}?id=${a.id}`,
                      })
                    }
                  >
                    <View className='flex-1'>
                      <Text className='text-card-title'>
                        {a.pinned ? '📌 ' : ''}
                        {a.title}
                      </Text>
                      <Text className='text-caption'>
                        {a.authorName || ''} · {a.publishedAt?.slice(0, 10) || ''}
                      </Text>
                    </View>
                    <Text className='text-caption'>›</Text>
                  </View>
                ))
              )}
            </Card>
          </View>
          {/* 借用 store 引用保证 observer 依赖刷新 */}
          {taskStore.total ? null : null}
        </View>
      )}
    </PageShell>
  )
}

/** 首页迷你双柱（近 6 月成本/收益，纯 view） */
function MiniBars({ series }: { series: RoiOverview['series'] }) {
  const max = Math.max(1, ...series.flatMap((s) => [s.cost, s.revenue]))
  return (
    <View className='bar-chart' style={{ height: '140rpx', marginTop: '16rpx' }}>
      {series.map((s) => (
        <View key={s.label} className='bar-chart__group'>
          <View className='bar-chart__bars'>
            <View
              className='bar-chart__bar bar-chart__bar--cost'
              style={{ height: `${(s.cost / max) * 100}%` }}
            />
            <View
              className='bar-chart__bar bar-chart__bar--rev'
              style={{ height: `${(s.revenue / max) * 100}%` }}
            />
          </View>
          <Text className='bar-chart__label'>{s.label.slice(5)}</Text>
        </View>
      ))}
    </View>
  )
}

export default observer(Home)
