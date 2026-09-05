import type {
  CodeAgentConfigOption,
  CodingAgentProvider,
} from '@/types/code-agent'

const storageKey = (provider: CodingAgentProvider) =>
  `code-agent:${provider}:preferences`
export const PREFERENCE_CATEGORIES = ['model', 'thought_level'] as const
export type CodeAgentPreferences = Partial<
  Record<(typeof PREFERENCE_CATEGORIES)[number], string>
>

export function readCodeAgentPreferences(
  provider: CodingAgentProvider = 'codex',
): CodeAgentPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(provider)) ?? '{}')
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

export function saveCodeAgentPreferences(
  options: CodeAgentConfigOption[],
  provider: CodingAgentProvider = 'codex',
) {
  const saved = readCodeAgentPreferences(provider)
  for (const category of PREFERENCE_CATEGORIES) {
    const option = options.find((option) => option.category === category)
    if (option) saved[category] = option.currentValue
  }
  try {
    localStorage.setItem(storageKey(provider), JSON.stringify(saved))
  } catch {
    // Browser storage is optional; session settings still work without it.
  }
}
