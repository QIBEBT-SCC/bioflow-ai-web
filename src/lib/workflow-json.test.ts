import { expect, it } from 'vitest'
import { parseWorkflowJson } from './workflow-json'

it('normalizes legacy port descriptions and preserves new descriptions', () => {
  const parsed = parseWorkflowJson(
    JSON.stringify({
      nodes: [
        {
          id: 'tool',
          type: 'code_bash',
          data: {},
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
      interface: {
        inputs: [
          {
            id: 'input-fasta',
            name: 'fasta',
            targets: [{ node_id: 'tool', handle: 'input_files' }],
          },
        ],
        outputs: [
          {
            id: 'output-index',
            name: 'index',
            description: 'Generated genome index directory.',
            source: { node_id: 'tool', handle: 'output_folder' },
          },
        ],
      },
    }),
  )

  expect(parsed.workflow.interface?.inputs[0].description).toBe('')
  expect(parsed.workflow.interface?.outputs[0].description).toBe(
    'Generated genome index directory.',
  )
})
