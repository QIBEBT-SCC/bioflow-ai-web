export type ToolTemplateVariableKind =
  | 'outputDir'
  | 'sampleName'
  | 'fileMount'
  | 'inputName'
  | 'inputStem'
  | 'inputSuffix'
  | 'optionalParams'
  | 'positionParams'

export interface ToolTemplateVariable {
  name: string
  kind: ToolTemplateVariableKind
}

export interface TemplateCompletionContext {
  from: number
  to: number
  query: string
}

const TEMPLATE_BOUNDARIES = new Set(['{', '}', '\n'])

export function getTemplateCompletionContext(
  value: string,
  cursor: number,
): TemplateCompletionContext | null {
  const beforeCursor = value.slice(0, cursor)
  const openBrace = beforeCursor.lastIndexOf('{')
  const closeBrace = beforeCursor.lastIndexOf('}')

  if (openBrace <= closeBrace) return null

  const query = beforeCursor.slice(openBrace + 1)
  if (query.includes('{') || query.includes('\n')) return null

  let to = cursor
  while (to < value.length && !TEMPLATE_BOUNDARIES.has(value[to])) to += 1
  if (value[to] === '}') to += 1

  return { from: openBrace, to, query }
}

export function findUnknownTemplateVariables(
  value: string,
  variables: ToolTemplateVariable[],
): string[] {
  const knownVariables = new Set(variables.map((variable) => variable.name))
  const unknownVariables = new Set<string>()

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '{') continue
    if (value[index + 1] === '{') {
      index += 1
      continue
    }

    const closeBrace = value.indexOf('}', index + 1)
    if (closeBrace === -1) break

    const expression = value.slice(index + 1, closeBrace)
    const variableName = expression.split(/[!:]/, 1)[0]
    if (variableName && !knownVariables.has(variableName)) {
      unknownVariables.add(variableName)
    }
    index = closeBrace
  }

  return [...unknownVariables]
}
