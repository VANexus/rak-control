import { View, Text } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, uiStore } from '@/store'
import { toast } from '@/utils/toast'

function Settings() {
  return (
    <PageShell kicker='SETTINGS' headTitle='设置' showBack>
      <Card className='stack-gap fade-in'>
        <View
          className='list-row list-row--pressable'
          onClick={() => {
            uiStore.toggleTheme()
            toast(uiStore.theme === 'dark' ? '已切换深色' : '已切换浅色')
          }}
        >
          <Text className='text-card-title'>主题</Text>
          <Text className='text-caption'>
            {uiStore.theme === 'light' ? '浅色' : '深色'} · 点按切换
          </Text>
        </View>
        <View className='list-row'>
          <Text className='text-card-title'>关于</Text>
          <Text className='text-caption'>
            Rak · {authStore.club?.name || '团队'} · 任务与 ROI
          </Text>
        </View>
        <View className='list-row'>
          <Text className='text-card-title'>设计基准</Text>
          <Text className='text-caption'>Linear / Vercel / shadcn · Xra-space token</Text>
        </View>
        <View className='list-row list-row--pressable' onClick={() => authStore.logout()}>
          <Text className='text-card-title text-destructive'>退出登录</Text>
          <Text className='text-caption'>清除本地身份</Text>
        </View>
      </Card>
    </PageShell>
  )
}

export default observer(Settings)
