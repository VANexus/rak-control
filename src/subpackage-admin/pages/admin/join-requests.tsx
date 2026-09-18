import { View, Text } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card, EmptyState } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import { toast } from '@/utils/toast'
import { formatDateTime } from '@/utils/format'

function JoinRequests() {
  useEffect(() => {
    teamStore.loadJoinRequests()
  }, [])

  const list = teamStore.joinRequests
  const pending = list.filter((r) => r.status === 'PENDING')

  return (
    <PageShell title='申请审批' showBack requireRole='manage'>
      <View className='stack-gap fade-in'>
        <Text className='section-label'>待处理 {pending.length} 条</Text>
        {list.length === 0 ? (
          <EmptyState title='暂无申请' description='未入册贡献者提交后出现在这里' />
        ) : (
          list.map((r) => (
            <Card key={r.id} className='stack-gap'>
              <View className='row-between'>
                <Text className='text-card-title'>{r.applicantName}</Text>
                <View
                  className={`badge ${
                    r.status === 'APPROVED'
                      ? 'badge--success'
                      : r.status === 'REJECTED'
                        ? 'badge--destructive'
                        : 'badge--brand'
                  }`}
                >
                  <Text>
                    {r.status === 'PENDING'
                      ? '待审批'
                      : r.status === 'APPROVED'
                        ? '已入册'
                        : '已驳回'}
                  </Text>
                </View>
              </View>
              <Text className='text-caption text-mono'>微信 {r.applicantWechat}</Text>
              <Text className='text-body'>{r.reason}</Text>
              <Text className='text-caption text-mono'>{formatDateTime(r.createdAt)}</Text>
              {r.status === 'PENDING' && authStore.isSuper ? (
                <View className='row-gap'>
                  <View
                    className='btn-primary flex-1'
                    onClick={async () => {
                      try {
                        await teamStore.approveJoin(r.id)
                        toast('已入册', 'success')
                      } catch (e) {
                        toast((e as Error).message || '失败')
                      }
                    }}
                  >
                    <Text>批准入册</Text>
                  </View>
                  <View
                    className='btn-secondary flex-1'
                    onClick={async () => {
                      try {
                        await teamStore.rejectJoin(r.id)
                        toast('已驳回')
                      } catch (e) {
                        toast((e as Error).message || '失败')
                      }
                    }}
                  >
                    <Text>驳回</Text>
                  </View>
                </View>
              ) : null}
              {r.status === 'PENDING' && !authStore.isSuper ? (
                <Text className='text-caption'>仅产品负责人可审批</Text>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </PageShell>
  )
}

export default observer(JoinRequests)
