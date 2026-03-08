import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // !! WARN !!
    // 注意：这将允许带有 TypeScript 错误的代码在生产环境构建成功。
    ignoreBuildErrors: true,
  },
}

export default nextConfig
