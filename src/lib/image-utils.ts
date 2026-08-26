/**
 * 格式化镜像标签为完整的镜像路径
 * @param image - 镜像对象
 * @returns 格式化后的镜像标签字符串
 */
export function formatImageTag(image: {
  image?: {
    registry?: string
    namespace?: string
    repository?: string
    tag?: string
  }
}): string {
  const {
    registry = '',
    namespace = '',
    repository = '',
    tag = '',
  } = image.image || {}

  return `${registry}/${namespace}/${repository}:${tag}`
    .replace(/^\/+/, '') // 移除开头的斜杠
    .replace(/\/+/g, '/') // 将多个斜杠替换为单个斜杠
}

/** Parse comma-separated image search aliases into a normalized list. */
export function parseImageAliases(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,，]/)
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  ]
}

export type ParsedImageUrl = {
  registry: string
  namespace: string
  repository: string
  tag: string
}

/** Parse [scheme://]registry/namespace/repository:tag. */
export function parseImageUrl(value: string): ParsedImageUrl | null {
  const normalized = value
    .trim()
    .replace(/^[\u0027\u0022]|[\u0027\u0022]$/g, '')
    .replace(/^(?:docker|https?):\/\//i, '')
    .replace(/\/+$/, '')

  if (!normalized || /\s/.test(normalized)) return null

  const segments = normalized.split('/')
  if (segments.length !== 3 || segments.some((segment) => !segment)) return null

  const [registry, namespace, repositoryWithTag] = segments
  const tagSeparator = repositoryWithTag.lastIndexOf(':')
  if (tagSeparator <= 0 || tagSeparator === repositoryWithTag.length - 1) {
    return null
  }

  return {
    registry,
    namespace,
    repository: repositoryWithTag.slice(0, tagSeparator),
    tag: repositoryWithTag.slice(tagSeparator + 1),
  }
}
