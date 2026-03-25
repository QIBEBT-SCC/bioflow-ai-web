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
