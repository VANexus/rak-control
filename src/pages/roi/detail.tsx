import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Skeleton } from '@/components/states'
import { authStore, roiStore } from '@/store'
import { ROUTES } from '@/constants'
import { formatDate, formatMoney2, formatRoiRatio } from '@/utils/format'
import { ROI_CATEGORY_LABEL, ROI_STATUS_LABEL, type RoiItem } from '@/types/domain'
import './roi.scss'

function RoiDetail() {
  const [item, setItem] = useState<RoiItem | null>(null)
  const [loading, setLoading] = useState(true)
  const id = Taro.getCurrentInstance().router?.params?.id || ''

  useDidShow(() => {
    setLoading(true)
    roiStore.fetchOne(id).then((it) => {
      setItem(it)
      setLoading(false)
    })
  })

  if (loading) {
    return (
      <PageShell kicker='ITEM' headTitle='项目明细' showBack>
        <Skeleton rows={2} />
      </PageShell>
    )
  }

  if (!item) {
    return (
      <PageShell kicker='ITEM' headTitle='项目明细' showBack>
        <Text className='text-caption'>项目不存在或已删除</Text>
      </PageShell>
    )
  }

  const total = item.cost + item.revenue
  const costPct = total > 0 ? (item.cost / total) * 100 : 50

  return (
    <PageShell kicker='ITEM' headTitle={item.title} showBack>
      <View className='stack-gap fade-in'>
        <View className='surface-card'>
          <Text className='section-label'>
            {ROI_CATEGORY_LABEL[item.category]} · {ROI_STATUS_LABEL[item.status]}
          </Text>
          <Text
            className={`metric-value ${
              item.roiRatio === null || item.roiRatio >= 0 ? 'text-success' : 'text-destructive'
            }`}
            style={{ fontSize: '56rpx' }}
          >
            {formatRoiRatio(item.roiRatio)}
          </Text>
          <Text className='text-caption'>
            成本为 0 时不计算 ROI（显示 —）· 数据由服务端计算
          </Text>
        </View>

        <View className='surface-card'>
          <Text className='section-label'>收支构成</Text>
          <View className='roi-split'>
            <View className='roi-split__cost' style={{ width: `${costPct}%` }} />
            <View className='roi-split__rev' style={{ width: `${100 - costPct}%` }} />
          </View>
          <View className='roi-detail-field'>
            <Text className='text-muted'>成本</Text>
            <Text className='text-mono'>¥{formatMoney2(item.cost)}</Text>
          </View>
          <View className='roi-detail-field'>
            <Text className='text-muted'>收益</Text>
            <Text className='text-mono'>¥{formatMoney2(item.revenue)}</Text>
          </View>
          <View className='roi-detail-field'>
            <Text className='text-muted'>净额</Text>
            <Text className='text-mono'>¥{formatMoney2(item.revenue - item.cost)}</Text>
          </View>
          <View className='roi-detail-field'>
            <Text className='text-muted'>参与人数</Text>
            <Text>{item.participants || '—'}</Text>
          </View>
          <View className='roi-detail-field'>
            <Text className='text-muted'>周期</Text>
            <Text className='text-mono'>
              {item.periodStart || item.periodEnd
                ? `${formatDate(item.periodStart)} ~ ${formatDate(item.periodEnd)}`
                : '—'}
            </Text>
          </View>
        </View>

        {item.notes ? (
          <View className='surface-card'>
            <Text className='section-label'>备注</Text>
            <Text className='text-body'>{item.notes}</Text>
          </View>
        ) : null}

        {authStore.isManager ? (
          <View
            className='btn-primary pressable'
            onClick={() =>
              Taro.navigateTo({ url: `${ROUTES.adminRoiEdit}?mode=edit&id=${item.id}` })
            }
          >
            <Text>编辑项目</Text>
          </View>
        ) : null}
      </View>
    </PageShell>
  )
}

export default observer(RoiDetail)
