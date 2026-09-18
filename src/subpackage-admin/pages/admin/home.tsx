import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, teamStore, taskStore } from '@/store'
import { ROUTES } from '@/constants'
import { roleLabel } from '@/utils/permission'

function AdminHome() {
  useEffect(() => {
    taskStore.loadTasks()
    teamStore.loadJoinRequests()
  }, [])

  const pendingReview = taskStore.tasks.filter((t) => t.status === 'SUBMITTED')
  const pendingJoin = teamStore.joinRequests.filter((r) => r.status === 'PENDING')

  return (
    <PageShell
      title='管理面板'
      showBack
      requireRole='manage'
      subtitle={roleLabel(authStore.clubRole)}
    >
      <View className='stack-gap fade-in'>
        <Card className='stack-gap'>
          <Text className='section-label'>运营</Text>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminTaskPublish })}
          >
            <Text className='text-card-title'>发布任务</Text>
            <Text className='text-caption'>写入任务池 · OPEN</Text>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminReview })}
          >
            <Text className='text-card-title'>任务验收</Text>
            <Text className='text-caption'>待验收 {pendingReview.length}</Text>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminMembers })}
          >
            <Text className='text-card-title'>成员管理</Text>
            <Text className='text-caption'>完成情况 / 职责</Text>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminJoinRequests })}
          >
            <Text className='text-card-title'>申请审批</Text>
            <Text className='text-caption'>待处理 {pendingJoin.length}</Text>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminInvites })}
          >
            <Text className='text-card-title'>邀请码</Text>
            <Text className='text-caption'>生成 / 列表</Text>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminAnnouncements })}
          >
            <Text className='text-card-title'>公告</Text>
            <Text className='text-caption'>团队通知</Text>
          </View>
          <View
            className='list-row list-row--pressable'
            onClick={() => Taro.navigateTo({ url: ROUTES.adminClubSettings })}
          >
            <Text className='text-card-title'>团队设置</Text>
            <Text className='text-caption'>名称 / 简介</Text>
          </View>
        </Card>

        {authStore.isSuper ? (
          <Card className='stack-gap'>
            <Text className='section-label text-brand'>超级后台（仅产品负责人）</Text>
            <View
              className='list-row list-row--pressable'
              onClick={() => Taro.navigateTo({ url: ROUTES.superRoles })}
            >
              <Text className='text-card-title text-brand'>职责分配</Text>
              <Text className='text-caption'>manager 任免 · 无感进入</Text>
            </View>
          </Card>
        ) : null}
      </View>
    </PageShell>
  )
}

export default observer(AdminHome)
