/**
 * 生成字母ID (用于节点ID等)
 * 格式: 大写字母组合, 如 "A", "AB", "ABC" 等
 */
export function generateLetterId(): string {
  const timestamp = Date.now().toString(36) // 转为36进制
  const random = Math.random().toString(36).substring(2, 8) // 随机字符
  return `${timestamp}${random}`.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 8)
}
