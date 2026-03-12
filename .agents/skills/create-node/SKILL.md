---
name: create-node
description: "Create a new workflow node type for the BioFlow AI node editor. Trigger this skill whenever the user asks to add a new node, create a node type, or build a new workflow component for the editor. Also trigger when the user says things like '新建节点', '添加节点类型', 'new node', or describes inputs/outputs for a workflow step."
---

# Create Node

Generate a new node type for the BioFlow AI workflow editor. The user provides:

1. Node name (English, used as title) and type ID (snake_case, used as key)
2. Category / color: green (resource/input), blue (value), orange (data processing), pink (tool), purple (code), gray (annotation)
3. Input handles: `{ name: string, description: string }[]`
4. Output handles: `{ name: string, description: string }[]`
5. Data fields: each field has a name (snake_case) and type (string, string[], number, boolean, etc.)

If the user doesn't provide all of these, ask for the missing pieces before generating code.

## Architecture

All nodes live under `src/components/node-editor/node/`. There are several existing files organized by category:

- `input-node.tsx` — resource/input nodes (green, blue)
- `data-node.tsx` — data processing nodes (orange)
- `code-node.tsx` — code execution nodes (purple)
- `tool-node.tsx` — tool nodes (pink)
- `note-node.tsx` — annotation nodes (gray)
- `base-node.tsx` — shared BaseNode component and card primitives

Each node uses `BaseNode` from `base-node.tsx` which accepts `title`, `description`, `handles`, `color`, and `nodeComponent`.

Colors are defined in `color.ts` as `colorSchemes.{green,blue,orange,pink,purple,gray}`.

Handle types are defined in `src/types/node.ts` as `HandleDefine { name: string; description: string }`.

## Node Data Convention

Node data fields are flat — no `args` wrapper. Each field sits directly on `data`:

```typescript
// Good
Node<{ r1: string; r2: string }, 'resource_sequence'>

// Bad (old pattern, do NOT use)
Node<{ args: { r1: string; r2: string } }, 'resource_sequence'>
```

## Code Pattern

Every node follows this structure. Adapt based on how many data fields the node has.

### Node with editable fields

```tsx
'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { HandleDefine } from '@/types/node'

// 1. Define static handles
const MY_NODE_HANDLES = {
  inputs: [
    { name: 'input_name', description: 'description' },
  ] as HandleDefine[],
  outputs: [
    { name: 'output_name', description: 'description' },
  ] as HandleDefine[],
}

// 2. Inner card component with editable fields
const MyNodeCard = memo(function MyNodeCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData = useNodesData<Node<{ field1: string; field2: string }, 'my_node'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [field1, setField1] = useState<string>(nodeData?.data.field1 ?? '')
  const [field2, setField2] = useState<string>(nodeData?.data.field2 ?? '')

  // Sync external data changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.field1 !== undefined && nodeData.data.field1 !== field1) {
      setField1(nodeData.data.field1)
    }
  }, [nodeData?.data.field1])

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.field2 !== undefined && nodeData.data.field2 !== field2) {
      setField2(nodeData.data.field2)
    }
  }, [nodeData?.data.field2])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { field1, field2 })
  }, [nodeId, field1, field2, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Field1:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter value...'
        value={field1}
        onChange={(e) => setField1(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
      <Label className='pt-4 pb-2 font-medium'>Field2:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter value...'
        value={field2}
        onChange={(e) => setField2(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  )
})

// 3. Outer node component
const MyNode = memo(function MyNode() {
  const nodeComponent = useMemo(() => <MyNodeCard />, [])

  return (
    <BaseNode
      title='My Node'
      description='Node description here.'
      handles={MY_NODE_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

export { MyNode }
```

### Node with no editable fields

If the node has no data fields (like `processor_copy2folder`), skip the card component:

```tsx
const MyNode = memo(function MyNode() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='My Node'
      description='Description.'
      handles={MY_NODE_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})
```

## Registration Steps

After creating the node component, update these locations:

### 1. Register in `src/app/(main)/editor/page.tsx`

Add import at the top, then add to `nodeTypes` object and `nodeConfig`:

```tsx
// Import
import { MyNode } from '@/components/node-editor/node/my-node'

// nodeTypes
const nodeTypes = {
  // ... existing
  my_node: MyNode,
}

// nodeConfig (inside onAddNode)
const nodeConfig: Record<string, any> = {
  // ... existing
  my_node: { data: { field1: '', field2: '' } },
}
```

The default values in nodeConfig should match the field types:
- `string` → `''`
- `string[]` → `[]`
- `number` → `0`
- `boolean` → `false`

## Style Rules

- Biome: no semicolons, single quotes, 2-space indent
- Use `memo` on all components
- Use `useCallback` for event handlers, `useMemo` for derived values
- Use `// biome-ignore lint/correctness/useExhaustiveDependencies: no need` on sync effects
- Use `Textarea` (from `@/components/ui/textarea`) for multiline fields, `Input` for single-line
- Add `spellCheck={false}` on code/path inputs

## UI Components Available

- `Input` — single-line text (`@/components/ui/input`)
- `Textarea` — multiline text (`@/components/ui/textarea`)
- `Label` — field label (`@/components/ui/label`)
- `Select` — dropdown (from shadcn/ui if needed)
- `Checkbox` — boolean toggle (from shadcn/ui if needed)
