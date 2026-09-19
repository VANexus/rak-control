import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { taskStore } from '@/store'
import { REPO_OPTIONS, ROUTES } from '@/constants'
import { TASK_CATEGORY_LABEL, type TaskCategory } from '@/types/domain'
import { ApiError } from '@/utils/request'
import { toast } from '@/utils/toast'
import '../../admin.scss'

function TaskPublish() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory>('content')
  const [repo, setRepo] = useState('')
  const [criteria, setCriteria] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = '必填'
    else if (title.trim().length > 40) e.title = '不超过 40 字'
    if (!description.trim()) e.description = '写清楚要做什么、交付在哪'
    setErrs(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await taskStore.publish({
        title: title.trim(),
        description: description.trim(),
        category,
        repo: repo || null,
        acceptanceCriteria: criteria.trim() || null,
      })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch (err) {
      if (err instanceof ApiError) toast(err.userMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell kicker='PUBLISH TASK' headTitle='发布任务' showBack requireRole='manage'>
      <View className='surface-card fade-in'>
        <View className='admin-form'>
          <View className='admin-field'>
            <Text className='admin-field__label'>
              标题（{title.length}/40）
              {errs.title ? <Text className='admin-field__err'> · {errs.title}</Text> : null}
            </Text>
            <Input
              className='admin-input'
              value={title}
              maxlength={40}
              placeholder='一句话说清要做什么'
              onInput={(e) => setTitle(e.detail.value)}
            />
          </View>

          <View className='admin-field'>
            <Text className='admin-field__label'>
              描述{errs.description ? <Text className='admin-field__err'> · {errs.description}</Text> : null}
            </Text>
            <Textarea
              className='admin-textarea'
              value={description}
              maxlength={2000}
              placeholder='背景、范围、交付物位置…'
              onInput={(e) => setDescription(e.detail.value)}
            />
          </View>

          <View className='admin-field'>
            <Text className='admin-field__label'>分类</Text>
            <View className='admin-chips'>
              {(Object.keys(TASK_CATEGORY_LABEL) as TaskCategory[]).map((c) => (
                <View
                  key={c}
                  className={`admin-chip pressable ${category === c ? 'admin-chip--on' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  <Text>{TASK_CATEGORY_LABEL[c]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='admin-field'>
            <Text className='admin-field__label'>关联仓库（可选）</Text>
            <Picker
              mode='selector'
              range={['（不关联）', ...REPO_OPTIONS]}
              value={repo ? (REPO_OPTIONS as readonly string[]).indexOf(repo) + 1 : 0}
              onChange={(e) => {
                const idx = Number(e.detail.value)
                setRepo(idx === 0 ? '' : (REPO_OPTIONS[idx - 1] as typeof repo))
              }}
            >
              <View className='admin-input row-between'>
                <Text className={repo ? '' : 'text-muted'}>{repo || '选择仓库'}</Text>
                <Text className='text-caption'>›</Text>
              </View>
            </Picker>
          </View>

          <View className='admin-field'>
            <Text className='admin-field__label'>验收标准（可选）</Text>
            <Textarea
              className='admin-textarea'
              style={{ minHeight: '140rpx' }}
              value={criteria}
              placeholder='怎样才算通过？'
              onInput={(e) => setCriteria(e.detail.value)}
            />
          </View>

          <View
            className={`btn-primary pressable ${busy ? 'btn-primary--disabled' : ''}`}
            onClick={busy ? undefined : submit}
          >
            <Text>{busy ? '发布中…' : '发布到任务池'}</Text>
          </View>
          <Text
            className='text-caption'
            style={{ textAlign: 'center' }}
            onClick={() => Taro.switchTab({ url: ROUTES.taskPool })}
          >
            发布后可在任务池查看
          </Text>
        </View>
      </View>
    </PageShell>
  )
}

export default observer(TaskPublish)
