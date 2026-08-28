import { type NextRequest, NextResponse } from 'next/server'

const OPEN_PATHS = ['/', '/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasSession = request.cookies.has('session_id')

  if (OPEN_PATHS.some((p) => pathname === p)) {
    return NextResponse.next()
  }

  if (pathname === '/register' || pathname.startsWith('/register/'))
    return NextResponse.redirect(new URL('/login', request.url))

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
