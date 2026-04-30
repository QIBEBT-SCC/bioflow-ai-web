import { type NextRequest, NextResponse } from 'next/server'

// 无需登录即可访问，已登录用户访问时重定向到首页
const GUEST_ONLY_PATHS = ['/login', '/register']

// 无需登录即可访问，已登录/未登录均放行
const OPEN_PATHS = ['/']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查 access_token 或 refresh_token 任一存在
  // 两者都检查：access_token 30分钟后后端会清除，但 refresh_token 7天内有效，
  // clientFetch 会自动续期，不应在此阶段踢出用户
  const hasSession =
    request.cookies.has('access_token') || request.cookies.has('refresh_token')

  if (OPEN_PATHS.some((p) => pathname === p)) {
    return NextResponse.next()
  }

  const isGuestOnly = GUEST_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (isGuestOnly) {
    return hasSession
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next()
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.ico|.*\\.webp).*)',
  ],
}
