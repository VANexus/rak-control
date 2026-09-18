import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import { OWNER_USER_ID } from '@/constants'
import { formatRoiRatio } from '@/utils/format'
import { roleLabel } from '@/utils/permission'

function AdminMembers() {
  useEffect(() => {
    teamStore.loadMembers()
    teamStore.loadPerformance()
  }, [])

  const perfMap = new Map(teamStore.allPerformance.map((p) => [p.userId, p]))

  return (
    <PageShell title='成员管理' showBack requireRole='manage' subtitle={roleLabel(authStore.clubRole)}>
      <Card className='fade-in stack-gap'>
        {teamStore.members.map((m) => {
          const p = perfMap.get(m.userId)
          return (
            <View key={m.userId} className='list-row'>
              <View className='flex-1'>
                <View className='row-gap'>
                  <Text className='text-card-title'>{m.displayName}</Text>
                </View>
                <Text className='text-caption'>
                  {m.duty || '—'}
                  {m.userId === OWNER_USER_ID
                    ? ' · 产品负责人'
                    : p
                      ? ` · 认领 ${p.claimedCount} / 通过 ${p.approvedCount} · 完成率 ${formatRoiRatio(p.completionRate)}`
                      : ''}
                </Text>
              </View>
              {authStore.isSuper && m.userId !== OWNER_USER_ID ? (
                <View
                  className='badge badge--brand'
                  onClick={async () => {
                    const next = m.clubRole === 'manager' ? 'member' : 'manager'
                    try {
                      await teamStore.setRole(m.userId, next)
                      Taro.showToast({
                        title: next === 'manager' ? '已设为管理层' : '已降为成员',
                        icon: 'success',
                      })
                    } catch (e) {
                      Taro.showToast({
                        title: (e as Error).message || '失败',
                        icon: 'none',
                      })
                    }
                  }}
                >
                  <Text>{m.clubRole === 'manager' ? '撤销管理层' : '设为管理层'}</Text>
                </View>
              ) : p ? (
                <Text className='metric-value text-brand'>{p.compositeScore}</Text>
              ) : null}
            </View>
          )
        })}
        <Text className='text-caption'>职责由产品负责人统一分配，成员无感进入对应视图</Text>
      </Card>
    </PageShell>
  )
}

export default observer(AdminMembers)
