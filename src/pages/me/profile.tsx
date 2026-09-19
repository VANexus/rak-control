import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, RoleBadge, StatusPill, Tile, TileGrid } from '@/components/ui'
import { authStore, taskStore, uiStore } from '@/store'
import * as taskService from '@/services/task'
import { ROUTES } from '@/constants'
import { roleLabel } from '@/utils/permission'
import { canManage, isSuper } from '@/utils/permission'
import './me.scss'

function Profile() {
  const [myCount, setMyCount] = useState<{ active: number; review: number } | null>(null)
  const uid = authStore.user?.id

  useDidShow(() => {
    if (authStore.status === 'LOADING') return
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    uiStore.syncTabBarStyle()
    void (async () => {
      try {
        const [active, review] = await Promise.all([
          taskService.fetchTasks({ assigneeId: uid, status: 'CLAIMED,REJECTED', size: 1 }),
          taskService.fetchTasks({ assigneeId: uid, status: 'SUBMITTED', size: 1 }),
        ])
        setMyCount({ active: active.total, review: review.total })
      } catch {
        setMyCount(null)
      }
    })()
  })

  const name = authStore.user?.displayName || '成员'

  return (
    <PageShell
      kicker='ME'
      headTitle={name}
      headStatus={<RoleBadge role={authStore.clubRole} />}
    >
      <View className='stack-gap fade-in'>
        {/* 身份信息卡 */}
        <Card>
          <View className='me-hero'>
            <View className='avatar-dot avatar-dot--lg'>
              <Text>{name.slice(0, 1)}</Text>
            </View>
            <View className='flex-1'>
              <Text className='text-card-title'>
                {authStore.user?.duty || roleLabel(authStore.clubRole)}
              </Text>
              <Text className='text-caption'>
                {authStore.club?.name || ''}
              </Text>
            </View>
            <StatusPill
              text={myCount ? `进行中 ${myCount.active} · 待验收 ${myCount.review}` : '—'}
            />
          </View>
        </Card>

        {/* 入口宫格 */}
        <TileGrid>
          <Tile
            face='solid'
            mark='arrow'
            title='我的任务'
            desc={myCount ? `${myCount.active} 个进行中` : '认领与交付记录'}
            onClick={() => Taro.navigateTo({ url: ROUTES.myTasks })}
          />
          <Tile
            face='white'
            mark='arrow'
            title='我的绩效'
            desc='完成率 × 质量分'
            onClick={() => Taro.navigateTo({ url: ROUTES.myPerformance })}
          />
          {canManage(authStore.clubRole) ? (
            <Tile
              face='white'
              mark='arrow'
              title='管理面板'
              desc='发布 · 验收 · ROI'
              onClick={() => Taro.navigateTo({ url: ROUTES.adminHome })}
            />
          ) : null}
          {isSuper(authStore.clubRole) ? (
            <Tile
              face='white'
              mark='arrow'
              title='超级后台'
              desc='任免 · 全量视图'
              onClick={() => Taro.navigateTo({ url: ROUTES.superRoles })}
            />
          ) : null}
          <Tile
            face='white'
            mark='arrow'
            title='成员目录'
            desc='查看团队名册'
            onClick={() => Taro.navigateTo({ url: ROUTES.members })}
          />
          <Tile
            face='paper'
            mark='arrow'
            title='设置'
            desc='主题与账号'
            onClick={() => Taro.navigateTo({ url: ROUTES.settings })}
          />
        </TileGrid>

        <View
          className='btn-secondary pressable'
          onClick={() => {
            Taro.showModal({ title: '退出登录', content: '确定退出 Rak？' }).then((r) => {
              if (r.confirm) void authStore.logout()
            })
          }}
        >
          <Text>退出登录</Text>
        </View>
      </View>
    </PageShell>
  )
}

// 让 observer 追踪任务数（taskStore 引用防止 tree-shake 误删依赖）
void taskStore

export default observer(Profile)
