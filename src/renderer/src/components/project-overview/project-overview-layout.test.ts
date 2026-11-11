import { describe, expect, it } from 'vitest'
import { moveOverviewCard, resolveOverviewColumns } from './project-overview-layout'

describe('project overview columns', () => {
  it('drops vanished products and appends new ones to the last saved column', () => {
    const saved = [
      { title: '最近常用', names: ['app_bind', 'app_gone'] },
      { title: '其他', names: ['app_super'] }
    ]
    expect(resolveOverviewColumns(['app_bind', 'app_super', 'app_new'], saved, [])).toEqual([
      { title: '最近常用', names: ['app_bind'] },
      { title: '其他', names: ['app_super', 'app_new'] }
    ])
  })

  it('moves a card after the card it was dropped on in another column', () => {
    const columns = [
      { title: 'A', names: ['app_bind', 'app_super'] },
      { title: 'B', names: ['app_cheng'] }
    ]
    expect(moveOverviewCard(columns, 'app_bind', 1, 'app_cheng', true)).toEqual([
      { title: 'A', names: ['app_super'] },
      { title: 'B', names: ['app_cheng', 'app_bind'] }
    ])
  })
})
