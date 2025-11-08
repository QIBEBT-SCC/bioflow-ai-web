import { NextResponse } from 'next/server'

export function middleware(req: any) {
  const { pathname } = req.nextUrl

  // 不需要认证的路径
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // 检查 Cookie 中的 access_token
  const hasToken = Boolean(req.cookies.get('access_token'))

  // 已登录访问登录页或根路径，重定向到 /chat
  if (hasToken && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  // 公开路径直接放行
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 受保护路径必须有 token
  if (!hasToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}