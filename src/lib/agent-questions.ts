import type { AgentQuestionAnswer } from '@/types/agent'

export function parseAgentQuestionAnswers(
  text: string,
): AgentQuestionAnswer[] | undefined {
  try {
    const value = JSON.parse(text) as unknown
    if (!Array.isArray(value) || value.length === 0) return undefined

    const answers = value.flatMap<AgentQuestionAnswer>((item) => {
      if (!item || typeof item !== 'object') return []
      const candidate = item as Record<string, unknown>
      if (
        typeof candidate.question !== 'string' ||
        !candidate.question.trim() ||
        typeof candidate.answer !== 'string' ||
        !candidate.answer.trim()
      ) {
        return []
      }
      return [
        {
          question: candidate.question.trim(),
          answer: candidate.answer.trim(),
        },
      ]
    })

    return answers.length === value.length ? answers : undefined
  } catch {
    return undefined
  }
}
