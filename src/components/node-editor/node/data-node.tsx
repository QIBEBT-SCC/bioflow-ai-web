'use client'

import { memo, useMemo } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import type { HandleDefine } from '@/types/node'

const COPY2FOLDER_HANDLES = {
  inputs: [
    {
      name: 'files',
      description: 'All files to be copied over',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'folder',
      description: 'Folder path containing all files',
    },
  ] as HandleDefine[],
}
const Copy2FolderNode = memo(function Copy2FolderNode() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='Copy To Folder'
      description='Copy files from multiple input sources to the same folder.'
      handles={COPY2FOLDER_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

export { Copy2FolderNode }
