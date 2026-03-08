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

    let body: BodyInit | null = null
    const method = request.method
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
    // 移除可能导致问题的响应头
    responseHeaders.delete('transfer-encoding')

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    })
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
