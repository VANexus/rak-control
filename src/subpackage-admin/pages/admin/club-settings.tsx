import { View, Text, Input, Textarea, Switch } from '@tarojs/components'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { Skeleton } from '@/components/states'
import * as clubService from '@/services/club'
import { authStore } from '@/store'
import { toast } from '@/utils/toast'
import { ApiError } from '@/utils/request'
import type { ClubInfo } from '@/types/domain'
import '../../admin.scss'

function ClubSettings() {
  const [club, setClub] = useState<ClubInfo | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dirVisible, setDirVisible] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    clubService
      .fetchClub()
      .then((c) => {
        setClub(c)
        setName(c.name)
        setDescription(c.description || '')
        try {
          const s = JSON.parse(c.settingsJson || '{}')
          setDirVisible(s.memberDirectoryVisible !== false)
        } catch {
          /* 默认 true */
        }
      })
      .catch((e) => toast(e instanceof ApiError ? e.userMessage : '加载设置失败'))
  }, [])

  const save = async () => {
    if (!club || !name.trim()) {
      toast('名称必填')
      return
    }
    setBusy(true)
    try {
      await clubService.updateClub({
        name: name.trim(),
        description: description.trim(),
        settings: { memberDirectoryVisible: dirVisible },
      })
      toast('已保存', 'success')
      void authStore.refreshMe()
    } catch (e) {
      toast(e instanceof ApiError ? e.userMessage : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  if (!club) {
    return (
      <PageShell kicker='CLUB SETTINGS' headTitle='团队设置' showBack requireRole='manage'>
        <Skeleton rows={2} />
      </PageShell>
    )
  }

  return (
    <PageShell kicker='CLUB SETTINGS' headTitle='团队设置' showBack requireRole='manage'>
      <Card className='fade-in'>
        <View className='admin-form'>
          <View className='admin-field'>
            <Text className='admin-field__label'>团队名称</Text>
            <Input
              className='admin-input'
              value={name}
              maxlength={32}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          <View className='admin-field'>
            <Text className='admin-field__label'>简介</Text>
            <Textarea
              className='admin-textarea'
              style={{ minHeight: '140rpx' }}
              value={description}
              maxlength={200}
              onInput={(e) => setDescription(e.detail.value)}
            />
          </View>
          <View className='row-between'>
            <View>
              <Text className='admin-field__label'>成员目录对全员可见</Text>
              <Text className='text-caption'>关闭后仅管理层可见成员列表</Text>
            </View>
            <Switch checked={dirVisible} onChange={(e) => setDirVisible(!!e.detail.value)} />
          </View>
          <View
            className={`btn-primary pressable ${busy ? 'btn-primary--disabled' : ''}`}
            onClick={busy ? undefined : save}
          >
            <Text>{busy ? '保存中…' : '保存设置'}</Text>
          </View>
        </View>
      </Card>
    </PageShell>
  )
}

export default observer(ClubSettings)
