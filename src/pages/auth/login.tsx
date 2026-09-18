import { View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, teamStore, uiStore } from '@/store'
import { OWNER_USER_ID, ROUTES } from '@/constants'
import { toast } from '@/utils/toast'
import './login.scss'

function Login() {
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pressCount, setPressCount] = useState(0)
  const invite = String(router.params.invite || '')

  useEffect(() => {
    try {
      teamStore.loadMembers()
    } catch {
      /* roster optional for first paint */
    }
    if (authStore.isLoggedIn) {
      Taro.switchTab({ url: ROUTES.index })
    }
  }, [])

  const finish = async (userId: string) => {
    setBusy(true)
    try {
      await authStore.loginAs(userId)
      toast('欢迎回来', 'success')
      Taro.switchTab({ url: ROUTES.index })
    } catch (e) {
      toast((e as Error).message || '进入失败')
    } finally {
      setBusy(false)
      setPicking(false)
    }
  }

  const roster = teamStore.members.filter((m) => m.userId !== OWNER_USER_ID)

  return (
    <PageShell title='Rak' subtitle={authStore.club?.name || 'flowmind 开发组'}>
      <View className={`login theme-${uiStore.theme}`}>
        <View className='login__hero fade-in'>
          <View
            className='login__brand text-display text-brand'
            onLongPress={() => {
              const next = pressCount + 1
              setPressCount(next)
              if (next >= 5) {
                setPressCount(0)
                finish(OWNER_USER_ID)
              }
            }}
          >
            Rak
          </View>
          <View className='login__tagline'>任务池认领 · 交付质量考核</View>
          <View className='text-caption login__hint'>
            被分配职责后直接进入对应视图，无需切换身份按钮
          </View>
        </View>

        {!picking ? (
          <Card className='stack-gap fade-in'>
            <View
              className={`btn-primary login__cta ${busy ? 'btn-primary--disabled' : ''}`}
              onClick={() => {
                if (busy) return
                setBusy(true)
                Taro.login({
                  complete: () => {
                    setBusy(false)
                    if (authStore.currentUserId) {
                      Taro.switchTab({ url: ROUTES.index })
                      return
                    }
                    setPicking(true)
                  },
                })
              }}
            >
              <View>微信登录并选择身份</View>
            </View>
            {invite ? (
              <View className='text-caption text-mono'>邀请码 {invite}</View>
            ) : null}
            <View className='hairline' />
            <View
              className='btn-secondary'
              onClick={() => Taro.navigateTo({ url: ROUTES.taskJoin })}
            >
              <View>我是新成员 · 申请加入</View>
            </View>
            <View className='text-caption login__foot'>
              名册外贡献者请先申请，管理员审批后入册考核
            </View>
          </Card>
        ) : (
          <Card className='stack-gap fade-in'>
            <View className='section-label'>选择你的身份</View>
            <View className='text-caption mb-8'>仅显示在册成员</View>
            <View className='login__list'>
              {roster.map((m) => (
                <View
                  key={m.userId}
                  className='login__row list-row--pressable'
                  onClick={() => !busy && finish(m.userId)}
                >
                  <View className='login__avatar'>
                    <View>{m.displayName.slice(0, 1)}</View>
                  </View>
                  <View className='flex-1'>
                    <View className='text-card-title'>{m.displayName}</View>
                    <View className='text-caption'>{m.duty || '成员'}</View>
                  </View>
                  <View className='badge badge--brand'>
                    <View>进入</View>
                  </View>
                </View>
              ))}
            </View>
            <View className='btn-secondary' onClick={() => setPicking(false)}>
              <View>返回</View>
            </View>
          </Card>
        )}
      </View>
    </PageShell>
  )
}

export default observer(Login)
