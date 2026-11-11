import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

/** leniu: Alibaba Cloud Yunxiao (云效) work items. */
export const YUNXIAO_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['yunxiao', 'connection'],
    summary: 'Show the Yunxiao (云效) connection and watched projects',
    usage: 'orca yunxiao connection [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['yunxiao', 'list'],
    summary: 'List Yunxiao work items assigned to you',
    usage:
      'orca yunxiao list [--filter open|done|all] [--category Req|Task|Bug] [--project <id>] [--search <text>] [--limit <n>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'filter', 'category', 'project', 'search', 'limit'],
    examples: ['orca yunxiao list', 'orca yunxiao list --category Bug --json']
  },
  {
    path: ['yunxiao', 'show'],
    summary: 'Read a Yunxiao work item with its comments',
    usage: 'orca yunxiao show <id|serial> | --current [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'current'],
    positionalArgs: ['ref'],
    examples: ['orca yunxiao show YOEZ-540', 'orca yunxiao show --current']
  },
  {
    path: ['yunxiao', 'comment'],
    summary: 'Add a comment to a Yunxiao work item',
    usage: 'orca yunxiao comment <id|serial> --body <text> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'body'],
    positionalArgs: ['ref'],
    examples: ['orca yunxiao comment YOEZ-540 --body "已修复，待验证"']
  },
  {
    path: ['yunxiao', 'status', 'list'],
    summary: 'List the statuses a Yunxiao work item can move to',
    usage: 'orca yunxiao status list <id|serial> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref'],
    positionalArgs: ['ref']
  },
  {
    path: ['yunxiao', 'status', 'set'],
    summary: 'Move a Yunxiao work item to a status (by name or id)',
    usage: 'orca yunxiao status set <id|serial> --to <status> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'to'],
    positionalArgs: ['ref'],
    examples: ['orca yunxiao status set YOEZ-540 --to 处理中']
  },
  {
    path: ['yunxiao', 'create'],
    summary: 'Create a Yunxiao work item assigned to you',
    usage:
      'orca yunxiao create --project <id> --category Req|Task|Bug --title <text> [--body <text>] [--parent <id>] [--sprint <id>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'project', 'category', 'title', 'body', 'parent', 'sprint']
  },
  {
    path: ['yunxiao', 'submit-test'],
    summary: 'Create the 提测 task under a requirement and notify its owner on DingTalk',
    usage: 'orca yunxiao submit-test <id|serial> [--note <text>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'note'],
    positionalArgs: ['ref']
  },
  {
    path: ['yunxiao', 'effort', 'list'],
    summary: 'Show estimated and logged hours of a Yunxiao work item',
    usage: 'orca yunxiao effort list <id|serial> | --current [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'current'],
    positionalArgs: ['ref']
  },
  {
    path: ['yunxiao', 'effort', 'add'],
    summary: 'Log actual hours (登记工时) on a Yunxiao work item',
    usage:
      'orca yunxiao effort add <id|serial> | --current --hours <n> [--date YYYY-MM-DD] [--note <text>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'current', 'hours', 'date', 'note'],
    positionalArgs: ['ref'],
    examples: ['orca yunxiao effort add YOEZ-540 --hours 2 --note "改送检程序"']
  },
  {
    path: ['yunxiao', 'effort', 'estimate'],
    summary: 'Set your estimated hours (预计工时) on a Yunxiao work item',
    usage: 'orca yunxiao effort estimate <id|serial> | --current --hours <n> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'ref', 'current', 'hours'],
    positionalArgs: ['ref']
  }
]
