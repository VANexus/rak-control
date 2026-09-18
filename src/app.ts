import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { ensureSeeded } from '@/services/local-db'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    try {
      ensureSeeded()
    } catch (e) {
      console.error('[rak-control] seed failed', e)
    }
  })

  return children
}

export default App
