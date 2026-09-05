import type { CodeAgentConfigOption } from '@/types/code-agent'

const STORAGE_KEY = 'code-agent:codex:preferences'
export const PREFERENCE_CATEGORIES = ['model', 'thought_level'] as const
export type CodeAgentPreferences = Partial<
  Record<(typeof PREFERENCE_CATEGORIES)[number], string>
>

export function readCodeAgentPreferences(): CodeAgentPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return Object.fromEntries(
      PREFERENCE_CATEGORIES.flatMap((category) =>
        typeof saved?.[category] === 'string'
          ? [[category, saved[category]]]
          : [],
      ),
    )
  } catch {
    return {}
  }
}

export function saveCodeAgentPreferences(options: CodeAgentConfigOption[]) {
  const saved = readCodeAgentPreferences()
  for (const category of PREFERENCE_CATEGORIES) {
    const option = options.find((option) => option.category === category)
    if (option) saved[category] = option.currentValue
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Browser storage is optional; session settings still work without it.
  }
}
