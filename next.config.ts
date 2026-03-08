import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_API_URL || 'http://localhost:8000/api/v1'}/:path*`,
      },
    ]
  },
  output: 'standalone',
  typescript: {
    // !! WARN !!
    // 注意：这将允许带有 TypeScript 错误的代码在生产环境构建成功。
    ignoreBuildErrors: true,
  },
}

export default nextConfig
