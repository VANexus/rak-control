import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { ROUTES } from '@/constants'
import { submitJoinRequest } from '@/services/member'
import { toast } from '@/utils/toast'

function JoinPage() {
  const [name, setName] = useState('')
  const [wechat, setWechat] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <PageShell title='申请加入' showBack subtitle='未入册贡献者'>
      <Card className='stack-gap fade-in'>
        <Text className='text-card-title'>登记入驻信息</Text>
        <Text className='text-caption'>
          入册后纳入任务考核。管理员审批通过即可登录认领任务。
        </Text>

        <Text className='section-label mt-8'>姓名</Text>
        <Input
          className='join__input'
          value={name}
          maxlength={20}
          placeholder='真实姓名或常用称呼'
          placeholderClass='text-muted'
          onInput={(e) => setName(String(e.detail.value))}
        />

        <Text className='section-label'>微信号</Text>
        <Input
          className='join__input'
          value={wechat}
          maxlength={32}
          placeholder='便于管理员联系'
          placeholderClass='text-muted'
          onInput={(e) => setWechat(String(e.detail.value))}
        />

        <Text className='section-label'>加入理由</Text>
        <Textarea
          className='join__textarea'
          value={reason}
          maxlength={200}
          placeholder='你能贡献什么？希望参与哪些板块？'
          placeholderClass='text-muted'
          onInput={(e) => setReason(String(e.detail.value))}
        />

        <View
          className={`btn-primary ${busy ? 'btn-primary--disabled' : ''}`}
          onClick={async () => {
            if (busy) return
            setBusy(true)
            try {
              await submitJoinRequest({ name, wechat, reason })
              toast('已提交，等待管理员审批', 'success')
              setTimeout(() => {
                Taro.navigateBack().catch(() => {
                  Taro.reLaunch({ url: ROUTES.login })
                })
              }, 600)
            } catch (e) {
              toast((e as Error).message || '提交失败')
            } finally {
              setBusy(false)
            }
          }}
        >
          <Text>提交申请</Text>
        </View>
      </Card>
    </PageShell>
  )
}

export default observer(JoinPage)
