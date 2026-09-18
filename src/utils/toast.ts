import Taro from '@tarojs/taro'

export function toast(title: string, icon: 'none' | 'success' | 'error' = 'none') {
  Taro.showToast({
    title,
    icon: icon === 'error' ? 'none' : icon,
    duration: 2000,
  })
}

export function toastError(detail?: string) {
  toast(detail || '操作失败', 'none')
}
