import React from 'react'
import { SmartWorkspaceSourceResultList } from './SmartWorkspaceSourceResultList'
import { PopoverContent } from '@/components/ui/popover'
import type { SmartWorkspaceNameFieldController } from './use-smart-workspace-name-field-controller'

export function renderSmartWorkspaceSourceResults(
  controller: SmartWorkspaceNameFieldController
): React.JSX.Element {
  const { localInputRef, tabsListRef } = controller

  return (
    <PopoverContent
      data-workspace-source-suggestions="true"
      align="start"
      side="bottom"
      sideOffset={4}
      avoidCollisions={false}
      className="popover-scroll-content flex w-[var(--radix-popover-trigger-width)] flex-col p-0"
      // leniu: room for about ten refs; the list closes on a pick, uncovering the dialog's footer.
      style={{ maxHeight: 'min(var(--radix-popover-content-available-height,20rem),20rem)' }}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onPointerDownOutside={(event) => {
        // Input/mode tabs are anchors outside Radix content; interacting with them must keep results open.
        const target = event.target as Node
        if (localInputRef.current?.contains(target) || tabsListRef.current?.contains(target)) {
          event.preventDefault()
        }
      }}
      onFocusOutside={(event) => {
        const target = event.target as Node
        if (localInputRef.current?.contains(target) || tabsListRef.current?.contains(target)) {
          event.preventDefault()
        }
      }}
    >
      <SmartWorkspaceSourceResultList model={controller} onSelect={controller.handleSelect} />
    </PopoverContent>
  )
}
