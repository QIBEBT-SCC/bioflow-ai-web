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
}

export default nextConfig
