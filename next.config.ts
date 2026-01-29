import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_API_URL}/:path*`,
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
