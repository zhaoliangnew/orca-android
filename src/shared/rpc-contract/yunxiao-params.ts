import { z } from 'zod'
import { OptionalPositiveInt, OptionalString, requiredString } from './rpc-param-primitives'

export const YunxiaoConnect = z.object({
  token: requiredString('Token is required'),
  organizationId: OptionalString
})

export const YunxiaoList = z
  .object({
    filter: z.enum(['open', 'done', 'all']).optional(),
    category: z.enum(['Req', 'Task', 'Bug']).optional(),
    projectId: OptionalString,
    keyword: OptionalString,
    limit: OptionalPositiveInt
  })
  .optional()

export const YunxiaoWorkItemRef = z.object({
  /** Work item id or serial number (YOEZ-540). */
  ref: requiredString('Work item is required')
})

export const YunxiaoComment = z.object({
  ref: requiredString('Work item is required'),
  content: requiredString('Comment is required')
})

export const YunxiaoSetStatus = z.object({
  ref: requiredString('Work item is required'),
  /** Status id, or a status name such as 处理中 / 已提测. */
  status: requiredString('Status is required')
})

export const YunxiaoProjectRef = z.object({
  projectId: requiredString('Project is required')
})

export const YunxiaoWatchProjects = z.object({
  projectIds: z.array(z.string())
})

export const YunxiaoCreate = z.object({
  projectId: requiredString('Project is required'),
  category: z.enum(['Req', 'Task', 'Bug']),
  subject: requiredString('Title is required'),
  description: OptionalString,
  parentId: OptionalString,
  sprintId: OptionalString,
  assignedTo: OptionalString
})

export const YunxiaoSubmitTest = z.object({
  /** The requirement the 提测 task goes under. */
  ref: requiredString('Work item is required'),
  note: OptionalString
})

export const YunxiaoLinkWorkspace = z.object({
  worktreeId: requiredString('Workspace is required'),
  ref: OptionalString
})

const PlanDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .optional()

export const YunxiaoSetPlanDates = z.object({
  ref: requiredString('Work item is required'),
  start: PlanDate,
  due: PlanDate
})

const Hours = z.number().positive().max(1000)

export const YunxiaoSetEstimate = z.object({
  ref: requiredString('Work item is required'),
  hours: Hours
})

export const YunxiaoAddEffort = z.object({
  ref: requiredString('Work item is required'),
  hours: Hours,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: OptionalString
})
