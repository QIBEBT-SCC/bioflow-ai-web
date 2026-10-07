import { expect, it, vi } from 'vitest'
import { clientFetch } from '@/lib/api-client'
import { streamCodingEvents } from './code-agent'

vi.mock('@/lib/api-client', () => ({ clientFetch: vi.fn() }))
it('parses fragmented UTF-8 events and resumes from the caller cursor', async () => {
  const event = {
    id: '2-0',
    type: 'message.delta',
    data: { text: '中文', turn_id: 't' },
  }
  const text = `: heartbeat\r\n\r\nid: 2-0\r\nevent: message.delta\r\ndata: ${JSON.stringify(event)}\r\n\r\n`
  const bytes = new TextEncoder().encode(text)
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]))
      controller.close()
    },
  })
  vi.mocked(clientFetch).mockResolvedValue(new Response(body))
  const signal = new AbortController().signal
  const onEvent = vi.fn()
  await streamCodingEvents('session', '1-0', signal, onEvent)
  expect(onEvent).toHaveBeenCalledExactlyOnceWith(event)
  expect(clientFetch).toHaveBeenCalledWith(
    '/code-agent/sessions/session/events',
    { raw: true, signal, params: { after: '1-0' } },
  )
})
