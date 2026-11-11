import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import { NavBar } from '../../components/nav-bar/NavBar'
import { NavBarButton } from '../../components/nav-bar/NavBarButton'
import type { RpcClient } from '../mobile-tasks-dependencies'
import { colors } from '../../theme/mobile-theme'
import { useMobileColorScheme } from '../../theme/use-mobile-color-scheme'
import {
  yunxiaoCategoryLabel,
  type YunxiaoComment,
  type YunxiaoStatus,
  type YunxiaoWorkItemDetail
} from '../../../../src/shared/yunxiao/yunxiao-types'
import { mobileYunxiao } from './mobile-yunxiao-rpc'
import { yunxiaoStyles as styles } from './mobile-yunxiao-styles'

function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function Meta({ label, value }: { label: string; value: string | null | undefined }) {
  return value ? (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  ) : null
}

/** leniu: one Yunxiao work item on the phone — status, description, comments. */
export function MobileYunxiaoDetail({
  client,
  workItemId,
  onBack,
  onChanged
}: {
  client: RpcClient
  workItemId: string
  onBack: () => void
  onChanged: () => void
}) {
  useMobileColorScheme()
  const [item, setItem] = useState<YunxiaoWorkItemDetail | null>(null)
  const [statuses, setStatuses] = useState<YunxiaoStatus[]>([])
  const [comments, setComments] = useState<YunxiaoComment[]>([])
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void run(async () => {
      const [detail, options, list] = await Promise.all([
        mobileYunxiao.get(client, workItemId),
        mobileYunxiao.statuses(client, workItemId).catch(() => []),
        mobileYunxiao.comments(client, workItemId).catch(() => [])
      ])
      setItem(detail)
      setStatuses(options)
      setComments(list)
    })
  }, [client, workItemId, run])

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <NavBar
        leading={<NavBarButton icon={ChevronLeft} onPress={onBack} accessibilityLabel="返回列表" />}
        title={item ? item.serialNumber : '云效'}
        refreshing={busy}
      />
      <ScrollView contentContainerStyle={styles.detail} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {item ? (
          <>
            <Text style={styles.kind}>
              {yunxiaoCategoryLabel(item.category)} · {item.space.name}
            </Text>
            <Text style={styles.title}>{item.subject}</Text>
            <Text style={styles.section}>状态</Text>
            <View style={styles.statusWrap}>
              {statuses.map((status) => {
                const current = status.id === item.status.id
                return (
                  <Pressable
                    key={status.id}
                    disabled={busy || current}
                    onPress={() =>
                      void run(async () => {
                        setItem(await mobileYunxiao.setStatus(client, item.id, status.id))
                        onChanged()
                      })
                    }
                    style={[styles.statusChip, current && styles.statusChipActive]}
                  >
                    <Text style={[styles.statusText, current && styles.statusTextActive]}>
                      {status.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Meta label="负责人" value={item.assignedTo?.name} />
            <Meta label="迭代" value={item.sprint?.name} />
            <Meta label="优先级" value={item.priority} />
            <Meta label="计划开始" value={item.startAt?.slice(0, 10)} />
            <Meta label="计划完成" value={item.dueAt?.slice(0, 10)} />
            <Text style={styles.section}>描述</Text>
            <Text style={styles.body}>{plainText(item.description) || '（无）'}</Text>
            <Text style={styles.section}>评论 {comments.length || ''}</Text>
            {comments.map((entry) => (
              <View key={entry.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{entry.author?.name ?? '某人'}</Text>
                <Text style={styles.body}>{plainText(entry.content)}</Text>
              </View>
            ))}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="写评论…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.input}
            />
            <Pressable
              disabled={busy || !comment.trim()}
              onPress={() =>
                void run(async () => {
                  await mobileYunxiao.addComment(client, item.id, comment.trim())
                  setComment('')
                  setComments(await mobileYunxiao.comments(client, item.id))
                })
              }
              style={[styles.button, (busy || !comment.trim()) && styles.disabled]}
            >
              <Text style={styles.buttonText}>发表评论</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
