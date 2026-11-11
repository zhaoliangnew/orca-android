import { defineMethod } from '../../../core'
import {
  YunxiaoAddEffort,
  YunxiaoComment,
  YunxiaoConnect,
  YunxiaoCreate,
  YunxiaoLinkWorkspace,
  YunxiaoList,
  YunxiaoProjectRef,
  YunxiaoSetEstimate,
  YunxiaoSetPlanDates,
  YunxiaoSetStatus,
  YunxiaoSubmitTest,
  YunxiaoWatchProjects,
  YunxiaoWorkItemRef
} from '../../../../../../shared/rpc-contract/yunxiao-params'
import { formatYunxiaoWorkItemContext } from '../../../../../../shared/yunxiao/yunxiao-format'
import {
  listParticipatedProjects,
  scanWatchedProjects,
  setWatchedProjects,
  yunxiaoConnect,
  yunxiaoDisconnect,
  yunxiaoStatus
} from '../../../../../yunxiao/yunxiao-connection'
import { addEffortRecord, listEfforts, setEstimate } from '../../../../../yunxiao/yunxiao-efforts'
import { plainTextFromRichText } from '../../../../../yunxiao/yunxiao-mapping'
import {
  createWorkItem,
  linkWorkspace,
  listWorkspaceLinks,
  submitTest
} from '../../../../../yunxiao/yunxiao-mutations'
import {
  addComment,
  getWorkItem,
  listComments,
  listMyWorkItems,
  listSprints,
  listStatuses,
  setPlanDates,
  setStatus
} from '../../../../../yunxiao/yunxiao-work-items'

/** leniu: Alibaba Cloud Yunxiao (云效) work items for the Yunxiao page and `orca yunxiao`. */
export const YUNXIAO_METHODS = [
  defineMethod({
    name: 'yunxiao.status',
    permission: 'workspace',
    params: null,
    handler: async () => yunxiaoStatus()
  }),
  defineMethod({
    name: 'yunxiao.connect',
    permission: 'accounts-admin',
    params: YunxiaoConnect,
    handler: async (params) => yunxiaoConnect(params.token.trim(), params.organizationId?.trim())
  }),
  defineMethod({
    name: 'yunxiao.disconnect',
    permission: 'accounts-admin',
    params: null,
    handler: async () => yunxiaoDisconnect()
  }),
  defineMethod({
    name: 'yunxiao.projects',
    permission: 'workspace',
    params: null,
    handler: async () => listParticipatedProjects()
  }),
  defineMethod({
    name: 'yunxiao.scanProjects',
    permission: 'workspace',
    params: null,
    handler: async () => scanWatchedProjects()
  }),
  defineMethod({
    name: 'yunxiao.watchProjects',
    permission: 'workspace',
    params: YunxiaoWatchProjects,
    handler: async (params) => setWatchedProjects(params.projectIds)
  }),
  defineMethod({
    name: 'yunxiao.list',
    permission: 'workspace',
    params: YunxiaoList,
    handler: async (params) => listMyWorkItems(params ?? {})
  }),
  defineMethod({
    name: 'yunxiao.get',
    permission: 'workspace',
    params: YunxiaoWorkItemRef,
    handler: async (params) => getWorkItem(params.ref)
  }),
  defineMethod({
    name: 'yunxiao.context',
    permission: 'workspace',
    params: YunxiaoWorkItemRef,
    handler: async (params) => {
      const [item, comments] = await Promise.all([
        getWorkItem(params.ref),
        listComments(params.ref)
      ])
      return formatYunxiaoWorkItemContext(item, comments, plainTextFromRichText(item.description))
    }
  }),
  defineMethod({
    name: 'yunxiao.comments',
    permission: 'workspace',
    params: YunxiaoWorkItemRef,
    handler: async (params) => listComments(params.ref)
  }),
  defineMethod({
    name: 'yunxiao.addComment',
    permission: 'workspace',
    params: YunxiaoComment,
    handler: async (params) => addComment(params.ref, params.content)
  }),
  defineMethod({
    name: 'yunxiao.statuses',
    permission: 'workspace',
    params: YunxiaoWorkItemRef,
    handler: async (params) => listStatuses(await getWorkItem(params.ref))
  }),
  defineMethod({
    name: 'yunxiao.setStatus',
    permission: 'workspace',
    params: YunxiaoSetStatus,
    handler: async (params) => setStatus(params.ref, params.status)
  }),
  defineMethod({
    name: 'yunxiao.setPlanDates',
    permission: 'workspace',
    params: YunxiaoSetPlanDates,
    handler: async (params) => setPlanDates(params.ref, { start: params.start, due: params.due })
  }),
  defineMethod({
    name: 'yunxiao.efforts',
    permission: 'workspace',
    params: YunxiaoWorkItemRef,
    handler: async (params) => listEfforts(params.ref)
  }),
  defineMethod({
    name: 'yunxiao.setEstimate',
    permission: 'workspace',
    params: YunxiaoSetEstimate,
    handler: async (params) => setEstimate(params.ref, params.hours)
  }),
  defineMethod({
    name: 'yunxiao.addEffort',
    permission: 'workspace',
    params: YunxiaoAddEffort,
    handler: async (params) =>
      addEffortRecord(params.ref, {
        hours: params.hours,
        date: params.date,
        description: params.description
      })
  }),
  defineMethod({
    name: 'yunxiao.sprints',
    permission: 'workspace',
    params: YunxiaoProjectRef,
    handler: async (params) => listSprints(params.projectId)
  }),
  defineMethod({
    name: 'yunxiao.create',
    permission: 'workspace',
    params: YunxiaoCreate,
    handler: async (params) => createWorkItem(params)
  }),
  defineMethod({
    name: 'yunxiao.submitTest',
    permission: 'workspace',
    params: YunxiaoSubmitTest,
    handler: async (params) => submitTest(params.ref, params.note)
  }),
  defineMethod({
    name: 'yunxiao.links',
    permission: 'workspace',
    params: null,
    handler: async () => listWorkspaceLinks()
  }),
  defineMethod({
    name: 'yunxiao.linkWorkspace',
    permission: 'workspace',
    params: YunxiaoLinkWorkspace,
    handler: async (params) => linkWorkspace(params.worktreeId, params.ref)
  })
]
