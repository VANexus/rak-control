import { View, Text } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { teamStore } from '@/store'
import { formatDate } from '@/utils/format'
import { toast } from '@/utils/toast'

function AdminInvites() {
  useEffect(() => {
    teamStore.loadInvites()
  }, [])

  return (
    <PageShell title='邀请码' showBack requireRole='manage'>
      <View className='stack-gap fade-in'>
        <View
          className='btn-primary'
          onClick={async () => {
            try {
              const inv = await teamStore.createInvite()
              toast(`已生成 ${inv.code}`, 'success')
            } catch (e) {
              toast((e as Error).message || '失败')
            }
          }}
        >
          <Text>生成邀请码</Text>
        </View>
        <Card>
          {teamStore.invites.length === 0 ? (
            <Text className='text-caption'>暂无邀请码</Text>
          ) : (
            teamStore.invites.map((inv) => (
              <View key={inv.id} className='list-row'>
                <View className='flex-1'>
                  <Text className='text-card-title text-mono text-brand'>{inv.code}</Text>
                  <Text className='text-caption text-mono'>
                    {inv.usedCount}/{inv.maxUses} · 至 {formatDate(inv.expiresAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </View>
    </PageShell>
  )
}

export default observer(AdminInvites)
