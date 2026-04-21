import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查 access_token 或 refresh_token 任一存在
  // 两者都检查：access_token 30分钟后后端会清除，但 refresh_token 7天内有效，
  // clientFetch 会自动续期，不应在此阶段踢出用户
  const hasSession =
    request.cookies.has('access_token') || request.cookies.has('refresh_token')

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (isPublicPath) {
    return hasSession
      ? NextResponse.redirect(new URL('/chat', request.url))
      : NextResponse.next()
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
