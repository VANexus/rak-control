import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card, StatusPill } from '@/components/ui'
import { ListState } from '@/components/states'
import { teamStore } from '@/store'
import { formatDateTime } from '@/utils/format'
import '../../admin.scss'

function AdminJoinRequests() {
  const [loading, setLoading] = useState(true)

  const reload = () => teamStore.loadJoinRequests().finally(() => setLoading(false))

  useDidShow(() => {
    void reload()
  })

  usePullDownRefresh(async () => {
    await reload()
    Taro.stopPullDownRefresh()
  })

  const reject = async (id: string, name: string) => {
    const r = await Taro.showModal({ title: '拒绝申请', content: `确定拒绝「${name}」的入队申请？` })
    if (r.confirm) await teamStore.rejectJoin(id)
  }

  return (
    <PageShell
      kicker='REQUESTS'
      headTitle='申请审批'
      showBack
      requireRole='manage'
      headStatus={
        <StatusPill dot={teamStore.joinRequests.length > 0} text={`待处理 ${teamStore.joinRequests.length}`} />
      }
    >
      <ListState
        loading={loading && teamStore.joinRequests.length === 0}
        error={null}
        empty={teamStore.joinRequests.length === 0}
        onRetry={reload}
        emptyTitle='没有待处理的申请'
        emptyHint='申请人从登录页「申请加入」提交后出现在这里'
        art='user'
      >
        <Card className='fade-in'>
          {teamStore.joinRequests.map((r) => (
            <View key={r.id} className='invite-card'>
              <View className='row-between'>
                <Text className='text-card-title'>{r.applicantName}</Text>
                <Text className='text-caption'>{formatDateTime(r.createdAt)}</Text>
              </View>
              <Text className='text-caption'>微信号：{r.applicantWechat}</Text>
              <Text className='text-body'>{r.reason}</Text>
              <View className='row-gap'>
                <View
                  className='btn-primary flex-1 pressable'
                  onClick={() => teamStore.approveJoin(r.id)}
                >
                  <Text>通过（自动建号入册）</Text>
                </View>
                <View
                  className='btn-secondary flex-1 btn-danger-text pressable'
                  onClick={() => reject(r.id, r.applicantName)}
                >
                  <Text>拒绝</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </ListState>
    </PageShell>
  )
}

export default observer(AdminJoinRequests)
