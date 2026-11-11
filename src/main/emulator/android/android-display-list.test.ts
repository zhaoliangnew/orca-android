import { describe, expect, it } from 'vitest'
import { parseAndroidSecondaryDisplays } from './android-display-list'

const DISPLAYS = [
  '  mBaseDisplayInfo=DisplayInfo{"内置屏幕", displayId 0, FLAG_SECURE, real 1920 x 1080, state ON, type INTERNAL, uniqueId "local:0"}',
  '    mBaseDisplayInfo=DisplayInfo{"HDMI 屏幕", displayId 1, FLAG_PRESENTATION, real 1920 x 1080, state ON, type EXTERNAL, uniqueId "local:1"}',
  '    mBaseDisplayInfo=DisplayInfo{"录屏", displayId 5, real 720 x 1280, type VIRTUAL}'
]

function output(viewportDisplays: number[], windowDisplays: number[]): string {
  const viewports = viewportDisplays
    .map((id, port) => `DisplayViewport{type=INTERNAL, displayId=${id}, physicalPort=${port}}`)
    .join(', ')
  return [
    `  mViewports=[${viewports}]`,
    ...DISPLAYS,
    '__ORCA_DISPLAY_WINDOWS__',
    ...windowDisplays.map((id) => `    mDisplayId=${id} mSession=Session{1942354}`)
  ].join('\n')
}

describe('parseAndroidSecondaryDisplays', () => {
  it('shows the HDMI panel of a dual-screen board that has a window on it', () => {
    expect(parseAndroidSecondaryDisplays(output([0, 1], [0, 1]))).toEqual([
      { id: 1, name: 'HDMI 屏幕', width: 1920, height: 1080 }
    ])
  })

  it('hides an idle HDMI panel that a single-screen board still reports', () => {
    expect(parseAndroidSecondaryDisplays(output([0, 0], [0]))).toEqual([])
  })
})
