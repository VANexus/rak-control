import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import * as taskService from '@/services/task'
import * as memberService from '@/services/member'
import { ROUTES } from '@/constants'
import { roleLabel } from '@/utils/permission'
import '../../admin.scss'

function AdminHome() {
  const [counts, setCounts] = useState({ review: 0, join: 0 })

  useDidShow(() => {
    if (!authStore.isLoggedIn) {
      Taro.reLaunch({ url: ROUTES.login })
      return
    }
    void (async () => {
      const [review, joinReq] = await Promise.all([
        taskService.fetchTasks({ status: 'SUBMITTED', size: 1 }).catch(() => null),
        memberService.fetchJoinRequests('PENDING').catch(() => []),
      ])
      setCounts({ review: review?.total ?? 0, join: joinReq?.length ?? 0 })
      teamStore.joinRequests = joinReq || []
    })()
  })

  const Entry = ({
    title,
    hint,
    url,
    badge,
  }: {
    title: string
    hint: string
    url: string
    badge?: number
  }) => (
    <View
      className='list-row list-row--pressable'
      onClick={() => Taro.navigateTo({ url })}
    >
      <View className='flex-1'>
        <Text className='text-card-title'>{title}</Text>
        <Text className='text-caption'>{hint}</Text>
      </View>
      {badge ? (
        <View className='home-badge-dot'>
          <Text>{badge}</Text>
        </View>
      ) : (
        <Text className='text-caption'>›</Text>
      )}
    </View>
  )

  return (
    <PageShell
      title='管理面板'
      showBack
      requireRole='manage'
      subtitle={roleLabel(authStore.clubRole)}
    >
      <View className='stack-gap fade-in'>
        <Card className='stack-gap'>
          <Text className='section-label'>任务</Text>
          <Entry title='发布任务' hint='写入任务池 · OPEN' url={ROUTES.adminTaskPublish} />
          <Entry
            title='任务验收'
            hint={counts.review > 0 ? `${counts.review} 个待验收` : '暂无待验收'}
            url={ROUTES.adminReview}
            badge={counts.review}
          />
        </Card>

        <Card className='stack-gap'>
          <Text className='section-label'>ROI 财务</Text>
          <Entry
            title='录入 / 编辑项目'
            hint='项目与活动收支 · ROI 自动计算'
            url={`${ROUTES.adminRoiEdit}?mode=create`}
          />
          <Entry title='看板' hint='切到 ROI Tab 查看概览' url={ROUTES.roiList} />
        </Card>

        <Card className='stack-gap'>
          <Text className='section-label'>团队运营</Text>
          <Entry title='申请审批' hint={counts.join > 0 ? `${counts.join} 条待处理` : '暂无待处理'} url={ROUTES.adminJoinRequests} badge={counts.join} />
          <Entry title='邀请码' hint='生成 / 小程序码 / 作废' url={ROUTES.adminInvites} />
          <Entry title='公告' hint='发布 / 置顶 / 归档' url={ROUTES.adminAnnouncements} />
          <Entry title='成员管理' hint='状态变更 · 名册' url={ROUTES.adminMembers} />
          <Entry title='团队设置' hint='名称 / 简介 / 目录开关' url={ROUTES.adminClubSettings} />
        </Card>

        {authStore.isSuper ? (
          <Card className='stack-gap'>
            <Text className='section-label text-brand'>超级后台（仅超级管理员）</Text>
            <Entry
              title='角色任免'
              hint='manager / member 任免'
              url={ROUTES.superRoles}
            />
          </Card>
        ) : null}
      </View>
    </PageShell>
  )
}

export default observer(AdminHome)
