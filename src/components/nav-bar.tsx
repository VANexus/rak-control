import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { APP_NAME } from '@/constants'
import { uiStore } from '@/store'
import './nav-bar.scss'

interface Props {
  title?: string
  showBack?: boolean
  subtitle?: string
}

function NavBar({ title = APP_NAME, showBack = false, subtitle }: Props) {
  return (
    <View className={`nav-bar theme-${uiStore.theme}`}>
      <View className='nav-bar__safe' />
      <View className='nav-bar__row'>
        <View
          className='nav-bar__side'
          onClick={() => {
            if (showBack) Taro.navigateBack()
          }}
        >
          {showBack ? <Text className='nav-bar__back'>‹</Text> : null}
        </View>
        <View className='nav-bar__center'>
          <Text className='nav-bar__title'>{title}</Text>
          {subtitle ? <Text className='nav-bar__subtitle'>{subtitle}</Text> : null}
        </View>
        <View
          className='nav-bar__side nav-bar__side--right'
          onClick={() => uiStore.toggleTheme()}
        >
          <Text className='nav-bar__theme'>
            {uiStore.theme === 'light' ? '☾' : '☀'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default observer(NavBar)
