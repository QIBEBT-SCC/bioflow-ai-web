import { type NextRequest, NextResponse } from 'next/server'

const configuredBackendUrl =
  process.env.BACKEND_API_URL || 'http://localhost:8000/api/v1'
const BACKEND_API_URL = /\/api\/v1\/?$/.test(configuredBackendUrl)
  ? configuredBackendUrl.replace(/\/api\/v1\/?$/, '/api/v2')
  : `${configuredBackendUrl.replace(/\/$/, '')}/api/v2`

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
): Promise<NextResponse> {
  const path = params.path.join('/')
  const targetUrl = `${BACKEND_API_URL}/${path}${request.nextUrl.search}`
  const headers = new Headers(request.headers)
  headers.delete('host')

  const method = request.method
  const body =
    method === 'GET' || method === 'HEAD' ? null : await request.arrayBuffer()
  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    // @ts-expect-error Node.js fetch extension
    duplex: 'half',
  })

  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('transfer-encoding')
  const proxied = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
  if (response.status === 401 && request.cookies.has('session_id')) {
    proxied.cookies.delete('session_id')
    proxied.cookies.delete('csrf_token')
    proxied.cookies.delete('access_token')
    proxied.cookies.delete('refresh_token')
  }
  return proxied
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params)
}
