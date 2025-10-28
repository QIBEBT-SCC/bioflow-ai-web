import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        // 只转发聊天SSE请求，其他都是服务端调用
        source: '/api/v1/chat/completions',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/completions`,
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
