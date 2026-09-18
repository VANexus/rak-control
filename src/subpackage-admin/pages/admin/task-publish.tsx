import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import PageShell from '@/components/page-shell'
import { Card } from '@/components/ui'
import { authStore, taskStore } from '@/store'
import { toast } from '@/utils/toast'
import {
  REPO_OPTIONS,
  TASK_CATEGORY_LABEL,
  type TaskCategory,
} from '@/types/domain'

const CATEGORY_KEYS = Object.keys(TASK_CATEGORY_LABEL) as TaskCategory[]
const CATEGORY_NAMES = CATEGORY_KEYS.map((k) => TASK_CATEGORY_LABEL[k])

function TaskPublish() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory>('cross-dashboard')
  const [catIndex, setCatIndex] = useState(0)
  const [repo, setRepo] = useState<string>('')
  const [repoIndex, setRepoIndex] = useState(-1)
  const [criteria, setCriteria] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <PageShell title='发布任务' showBack requireRole='manage'>
      <Card className='stack-gap fade-in'>
        <Text className='section-label'>标题（≤40 字）</Text>
        <Input
          className='form__input'
          value={title}
          maxlength={40}
          placeholder='一句话说清要交付什么'
          placeholderClass='text-muted'
          onInput={(e) => setTitle(String(e.detail.value))}
        />

        <Text className='section-label'>类目</Text>
        <Picker
          mode='selector'
          range={CATEGORY_NAMES}
          value={catIndex}
          onChange={(e) => {
            const i = Number(e.detail.value)
            setCatIndex(i)
            setCategory(CATEGORY_KEYS[i])
          }}
        >
          <View className='form__input row-between'>
            <Text>{TASK_CATEGORY_LABEL[category]}</Text>
            <Text className='text-caption'>选择</Text>
          </View>
        </Picker>

        <Text className='section-label'>仓库（可选）</Text>
        <Picker
          mode='selector'
          range={['（无）', ...REPO_OPTIONS]}
          value={repoIndex < 0 ? 0 : repoIndex + 1}
          onChange={(e) => {
            const i = Number(e.detail.value)
            if (i === 0) {
              setRepoIndex(-1)
              setRepo('')
            } else {
              setRepoIndex(i - 1)
              setRepo(REPO_OPTIONS[i - 1])
            }
          }}
        >
          <View className='form__input row-between'>
            <Text className={repo ? 'text-mono' : 'text-muted'}>
              {repo || '（无）'}
            </Text>
            <Text className='text-caption'>选择</Text>
          </View>
        </Picker>

        <Text className='section-label'>详细需求</Text>
        <Textarea
          className='form__textarea'
          value={description}
          maxlength={500}
          placeholder='2–3 句具体要求'
          placeholderClass='text-muted'
          onInput={(e) => setDescription(String(e.detail.value))}
        />

        <Text className='section-label'>验收标准（可选）</Text>
        <Textarea
          className='form__textarea'
          value={criteria}
          maxlength={200}
          placeholder='可演示 / 有文档 / 有链接…'
          placeholderClass='text-muted'
          onInput={(e) => setCriteria(String(e.detail.value))}
        />

        <View
          className={`btn-primary ${busy ? 'btn-primary--disabled' : ''}`}
          onClick={async () => {
            if (busy) return
            if (!title.trim() || !description.trim()) {
              toast('请填写标题与详细需求')
              return
            }
            const createdBy = authStore.currentUserId
            if (!createdBy) {
              toast('未登录')
              return
            }
            setBusy(true)
            try {
              await taskStore.publish({
                title: title.trim(),
                description: description.trim(),
                category,
                repo: repo || null,
                acceptanceCriteria: criteria.trim() || null,
                createdBy,
              })
              toast('已发布到任务池', 'success')
              setTimeout(() => Taro.navigateBack(), 500)
            } catch (e) {
              toast((e as Error).message || '发布失败')
            } finally {
              setBusy(false)
            }
          }}
        >
          <Text>发布到任务池</Text>
        </View>
      </Card>
    </PageShell>
  )
}

export default observer(TaskPublish)
