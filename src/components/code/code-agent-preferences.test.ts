import { beforeEach, describe, expect, it } from 'vitest'
import {
  readCodeAgentPreferences,
  saveCodeAgentPreferences,
} from './code-agent-preferences'

const option = (model: string) => [
  {
    id: 'model',
    name: 'Model',
    category: 'model',
    type: 'select',
    currentValue: model,
    options: [],
  },
]

describe('coding-agent preferences', () => {
  beforeEach(() => localStorage.clear())

  it('keeps model preferences separate and preserves the existing Codex key', () => {
    saveCodeAgentPreferences(option('codex-model'))
    saveCodeAgentPreferences(option('opencode-model'), 'opencode')
    expect(readCodeAgentPreferences()).toEqual({ model: 'codex-model' })
    expect(readCodeAgentPreferences('opencode')).toEqual({
      model: 'opencode-model',
    })
    expect(localStorage.getItem('code-agent:codex:preferences')).toContain(
      'codex-model',
    )
  })
})
