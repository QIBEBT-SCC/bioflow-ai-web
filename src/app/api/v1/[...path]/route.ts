import { type NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || 'http://localhost:8000/api/v1'

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
): Promise<NextResponse> {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  const targetUrl = `${BACKEND_API_URL}/${path}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  const method = request.method

  let body: BodyInit | null = null
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.arrayBuffer()
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: body ?? null,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params)
}
