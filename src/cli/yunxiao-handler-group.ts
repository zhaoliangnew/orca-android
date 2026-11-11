import type { HandlerGroup } from './handler-group-manifest'

export const YUNXIAO_HANDLER_GROUP: HandlerGroup = {
  name: 'yunxiao',
  keys: [
    'yunxiao connection',
    'yunxiao list',
    'yunxiao show',
    'yunxiao comment',
    'yunxiao status list',
    'yunxiao status set',
    'yunxiao create',
    'yunxiao submit-test',
    'yunxiao effort list',
    'yunxiao effort add',
    'yunxiao effort estimate'
  ],
  load: async () => (await import('./handlers/yunxiao.js')).YUNXIAO_HANDLERS
}
