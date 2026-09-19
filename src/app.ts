import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { authStore, uiStore } from '@/store'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 冷启动静默登录链（设计 §3）；主题同步原生 TabBar
    uiStore.syncTabBarStyle()
    void authStore.bootstrap()
  })

  return children
}

export default App
