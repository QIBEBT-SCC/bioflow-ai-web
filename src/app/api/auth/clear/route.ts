import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('session_id')
  response.cookies.delete('csrf_token')
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}
