import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, RefreshCw } from 'lucide-react-native'
import { NavBar } from '../../components/nav-bar/NavBar'
import { NavBarButton } from '../../components/nav-bar/NavBarButton'
import { FilterChip } from '../../components/nav-bar/FilterChip'
import { useHostClient } from '../../transport/connection/host-client-hooks'
import { colors } from '../../theme/mobile-theme'
import { useMobileColorScheme } from '../../theme/use-mobile-color-scheme'
import {
  isYunxiaoDone,
  yunxiaoCategoryLabel,
  type YunxiaoWorkItem
} from '../../../../src/shared/yunxiao/yunxiao-types'
import { isPlannedInWeek, yunxiaoWeekRange } from '../../../../src/shared/yunxiao/yunxiao-date'
import { mobileYunxiao } from './mobile-yunxiao-rpc'
import { setMobileYunxiaoOpen } from './mobile-yunxiao-mode'
import { MobileYunxiaoDetail } from './MobileYunxiaoDetail'
import { yunxiaoStyles as styles } from './mobile-yunxiao-styles'

type Filter = 'week' | 'open' | 'done'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'week', label: '本周计划' },
  { id: 'open', label: '未完成' },
  { id: 'done', label: '已完成' }
]

function visibleItems(items: YunxiaoWorkItem[], filter: Filter, tasksOnly: boolean) {
  const week = yunxiaoWeekRange()
  return items.filter(
    (item) =>
      (!tasksOnly || item.category === 'Task') &&
      (filter === 'week'
        ? isPlannedInWeek(item, week)
        : isYunxiaoDone(item) === (filter === 'done'))
  )
}

function Row({ item, onPress }: { item: YunxiaoWorkItem; onPress: () => void }) {
  const done = isYunxiaoDone(item)
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowTop}>
        <Text style={styles.serial}>{item.serialNumber}</Text>
        <Text style={styles.badge}>{yunxiaoCategoryLabel(item.category)}</Text>
        <Text style={[styles.status, done && styles.muted]}>{item.status.name}</Text>
        {item.dueAt ? <Text style={styles.due}>{item.dueAt.slice(5, 10)}</Text> : null}
      </View>
      <Text style={[styles.subject, done && styles.muted]} numberOfLines={2}>
        {item.subject}
      </Text>
      <Text style={styles.project} numberOfLines={1}>
        {item.space.name}
      </Text>
    </Pressable>
  )
}

/** leniu: the phone's 云效 page — the desktop's Yunxiao list, read through the paired host. */
export function MobileYunxiaoScreen({ hostId }: { hostId: string }) {
  useMobileColorScheme()
  const { client } = useHostClient(hostId)
  const [items, setItems] = useState<YunxiaoWorkItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('open')
  const [tasksOnly, setTasksOnly] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!client) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const status = await mobileYunxiao.status(client)
      if (!status.connected) {
        setError('电脑上的 Orca 还没连接云效：在电脑的 任务 → 云效 里填写令牌。')
        return
      }
      setItems(await mobileYunxiao.list(client))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    void load()
  }, [load])

  const shown = useMemo(() => visibleItems(items, filter, tasksOnly), [items, filter, tasksOnly])

  if (selected && client) {
    return (
      <MobileYunxiaoDetail
        client={client}
        workItemId={selected}
        onBack={() => setSelected(null)}
        onChanged={() => void load()}
      />
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <NavBar
        leading={
          <NavBarButton
            icon={ChevronLeft}
            onPress={() => setMobileYunxiaoOpen(false)}
            accessibilityLabel="返回任务"
          />
        }
        title="云效"
        trailing={
          <NavBarButton
            icon={RefreshCw}
            disabled={loading}
            onPress={() => void load()}
            accessibilityLabel="刷新云效"
          />
        }
        accessory={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {FILTERS.map((entry) => (
              <FilterChip
                key={entry.id}
                label={entry.label}
                active={filter === entry.id}
                onPress={() => setFilter(entry.id)}
              />
            ))}
            <FilterChip
              label={tasksOnly ? '只看任务' : '全部类型'}
              active={tasksOnly}
              onPress={() => setTasksOnly(!tasksOnly)}
            />
          </ScrollView>
        }
        refreshing={loading}
      />
      {error ? <Text style={styles.message}>{error}</Text> : null}
      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Row item={item} onPress={() => setSelected(item.id)} />}
        ListEmptyComponent={
          error ? null : (
            <Text style={styles.message}>{loading ? '正在从电脑读取云效…' : '没有工作项'}</Text>
          )
        }
        ListFooterComponent={
          shown.length > 0 ? <Text style={styles.footer}>共 {shown.length} 条</Text> : null
        }
        contentContainerStyle={styles.list}
        style={{ backgroundColor: colors.bgBase }}
      />
    </SafeAreaView>
  )
}
