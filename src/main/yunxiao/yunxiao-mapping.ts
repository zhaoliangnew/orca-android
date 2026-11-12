import {
  yunxiaoWorkItemUrl,
  type YunxiaoComment,
  type YunxiaoUser,
  type YunxiaoWorkItem,
  type YunxiaoWorkItemDetail
} from '../../shared/yunxiao/yunxiao-types'

type Raw = Record<string, unknown>

const asRecord = (value: unknown): Raw | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : null
const asString = (value: unknown): string => (typeof value === 'string' ? value : '')
const asNumber = (value: unknown): number => (typeof value === 'number' ? value : 0)

export function mapUser(value: unknown): YunxiaoUser | null {
  const record = asRecord(value)
  return record && asString(record.id)
    ? { id: asString(record.id), name: asString(record.name) }
    : null
}

function customField(raw: Raw, match: (field: Raw) => boolean): string | null {
  const fields = Array.isArray(raw.customFieldValues) ? raw.customFieldValues : []
  for (const field of fields) {
    const record = asRecord(field)
    if (record && match(record)) {
      const first = asRecord(Array.isArray(record.values) ? record.values[0] : null)
      return first ? asString(first.displayValue) || null : null
    }
  }
  return null
}

function hours(value: string | null): number | null {
  const parsed = value === null ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function mapWorkItem(raw: Raw): YunxiaoWorkItem {
  const type = asRecord(raw.workitemType)
  const status = asRecord(raw.status)
  const space = asRecord(raw.space)
  const sprint = asRecord(raw.sprint)
  const category = asString(raw.categoryId)
  const serialNumber = asString(raw.serialNumber)
  const parentId = asString(raw.parentId)
  return {
    id: asString(raw.id),
    serialNumber,
    subject: asString(raw.subject),
    category,
    typeId: asString(type?.id),
    typeName: asString(type?.name),
    status: {
      id: asString(status?.id),
      name: asString(status?.displayName) || asString(status?.name)
    },
    statusStage: asString(raw.statusStageId),
    assignedTo: mapUser(raw.assignedTo),
    creator: mapUser(raw.creator),
    space: { id: asString(space?.id), name: asString(space?.name) },
    sprint:
      sprint && asString(sprint.id)
        ? { id: asString(sprint.id), name: asString(sprint.name) }
        : null,
    parentId: parentId && parentId !== 'EMPTY_VALUE' ? parentId : null,
    priority: customField(raw, (field) => field.fieldId === 'priority'),
    startAt: customField(raw, (field) => field.fieldName === '计划开始时间'),
    dueAt: customField(raw, (field) => field.fieldName === '计划完成时间'),
    estimateHours: hours(customField(raw, (field) => field.fieldId === 'sumPlanedLaborHour')),
    actualHours: hours(customField(raw, (field) => field.fieldId === 'sumActualLaborHour')),
    createdAt: asNumber(raw.gmtCreate),
    updatedAt: asNumber(raw.gmtModified),
    url: yunxiaoWorkItemUrl(category, serialNumber)
  }
}

/** Yunxiao may wrap rich text as JSON ({ htmlValue, jsonMLValue }); keep the HTML. */
export function unwrapRichText(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) {
    return value
  }
  try {
    const parsed = JSON.parse(trimmed) as Raw
    return typeof parsed.htmlValue === 'string' ? parsed.htmlValue : value
  } catch {
    return value
  }
}

export function mapWorkItemDetail(raw: Raw): YunxiaoWorkItemDetail {
  const trackers = Array.isArray(raw.trackers) ? raw.trackers : []
  return {
    ...mapWorkItem(raw),
    description: unwrapRichText(asString(raw.description)),
    trackers: trackers.map(mapUser).filter((user): user is YunxiaoUser => user !== null)
  }
}

export function mapComment(raw: Raw): YunxiaoComment {
  const content = asRecord(raw.content)
  return {
    id: asString(raw.id),
    content: unwrapRichText(content ? asString(content.content) : asString(raw.content)),
    author: mapUser(raw.creator ?? raw.user ?? raw.author),
    createdAt: asNumber(raw.gmtCreate ?? raw.createdAt)
  }
}

/** Yunxiao descriptions are HTML or markdown; agents and the page read plain text. */
export function plainTextFromRichText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
