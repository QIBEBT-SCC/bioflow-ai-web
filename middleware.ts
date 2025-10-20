import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // 已登录且访问登录页 -> 重定向到聊天页
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/chat', req.url))
    }

    // 已登录且访问根路径 -> 重定向到聊天页
    if (token && pathname === '/') {
      return NextResponse.redirect(new URL('/chat', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 不需要认证的路径
        const publicPaths = ['/login', '/register']
        const isPublicPath = publicPaths.some((path) =>
          pathname.startsWith(path),
        )

        // 如果是公开路径，允许访问
        if (isPublicPath) {
          return true
        }

        // 其他路径需要认证
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  },
)

export const config = {
  // 匹配所有路径，除了 API routes、静态文件等
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
