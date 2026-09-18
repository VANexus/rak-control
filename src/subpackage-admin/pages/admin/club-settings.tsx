import { View, Text, Input } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore } from '@/store'
import { updateClub } from '@/services/club'
import { toast } from '@/utils/toast'

function ClubSettings() {
  const [name, setName] = useState(authStore.club?.name || '')
  const [description, setDescription] = useState(
    authStore.club?.description || ''
  )

  useEffect(() => {
    if (authStore.club) {
      setName(authStore.club.name)
      setDescription(authStore.club.description || '')
    }
  }, [authStore.club?.name, authStore.club?.description])

  return (
    <PageShell title='团队设置' showBack requireRole='manage'>
      <Card className='stack-gap fade-in'>
        <Text className='section-label'>团队名称</Text>
        <Input
          className='form__input'
          value={name}
          maxlength={30}
          onInput={(e) => setName(String(e.detail.value))}
        />
        <Text className='section-label'>简介</Text>
        <Input
          className='form__input'
          value={description}
          maxlength={60}
          onInput={(e) => setDescription(String(e.detail.value))}
        />
        <View
          className='btn-primary'
          onClick={async () => {
            try {
              const next = await updateClub({
                name: name.trim(),
                description: description.trim(),
              })
              await authStore.refreshMe()
              void next
              toast('已保存', 'success')
            } catch (e) {
              toast((e as Error).message || '保存失败')
            }
          }}
        >
          <Text>保存</Text>
        </View>
      </Card>
    </PageShell>
  )
}

export default observer(ClubSettings)
