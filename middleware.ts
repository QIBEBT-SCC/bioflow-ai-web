import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// 不需要认证的路径
const publicPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // 检查是否是公开路径
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // 未登录且访问受保护路径 -> 重定向到登录页
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 已登录且访问登录页 -> 重定向到聊天页
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // 已登录且访问根路径 -> 重定向到聊天页
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // 匹配所有路径，除了 API routes、静态文件等
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
