import { View, Text } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import PageShell from '@/components/page-shell'
import { Card, RoleBadge } from '@/components/ui'
import { authStore, teamStore } from '@/store'
import { OWNER_USER_ID } from '@/constants'
import { toast } from '@/utils/toast'

/**
 * 超管职责分配：不在登录页展示超管入口。
 * 分配 manager 后，相关成员无感进入对应管理视图。
 */
function SuperRoles() {
  useEffect(() => {
    teamStore.loadMembers()
    teamStore.loadPerformance()
  }, [])

  return (
    <PageShell
      title='职责分配'
      showBack
      requireRole='super'
      subtitle='仅产品负责人 · 分配后成员无感进入'
    >
      <Card className='stack-gap fade-in'>
        <Text className='section-label'>在册成员</Text>
        {teamStore.members.map((m) => (
          <View key={m.userId} className='list-row'>
            <View className='flex-1'>
              <View className='row-gap'>
                <Text className='text-card-title'>{m.displayName}</Text>
                <RoleBadge role={m.clubRole} />
              </View>
              <Text className='text-caption'>{m.duty || '—'}</Text>
            </View>
            {m.userId === OWNER_USER_ID ? (
              <Text className='text-caption'>产品负责人</Text>
            ) : (
              <View
                className={`badge ${m.clubRole === 'manager' ? '' : 'badge--brand'}`}
                onClick={async () => {
                  const next = m.clubRole === 'manager' ? 'member' : 'manager'
                  try {
                    await teamStore.setRole(m.userId, next)
                    toast(
                      next === 'manager'
                        ? `${m.displayName} → 管理层`
                        : `${m.displayName} → 成员`,
                      'success'
                    )
                  } catch (e) {
                    toast((e as Error).message || '失败')
                  }
                }}
              >
                <Text>{m.clubRole === 'manager' ? '撤销管理层' : '设为管理层'}</Text>
              </View>
            )}
          </View>
        ))}
        <Text className='text-caption'>
          manager 可发布任务、验收打分。职责标签可在后续 SaaS 多团队架构中细化分配。
        </Text>
      </Card>
    </PageShell>
  )
}

export default observer(SuperRoles)
