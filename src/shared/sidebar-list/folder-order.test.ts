import { describe, expect, it } from 'vitest'
import { compareFolderOrderNames, folderOrderName } from './folder-order'

describe('folder project order', () => {
  it('sorts folder names the way the local file list does', () => {
    const names = [
      '/w/workspace_ai',
      '/w/0.临时聊天',
      '/w/workspace_5.0_项目',
      '/w/EasyTierJNIExample',
      '/w/workspace_5.0-标准版',
      '/w/workspace_公共'
    ].map((path) => folderOrderName(path))
    expect(names.sort(compareFolderOrderNames)).toEqual([
      '0.临时聊天',
      'EasyTierJNIExample',
      'workspace_5.0-标准版',
      'workspace_5.0_项目',
      'workspace_ai',
      'workspace_公共'
    ])
  })
})
