export const MAX_STRUCTURE_BYTES = 10 * 1024 * 1024
export const MAX_STRUCTURE_ATOMS = 200_000

export type ProteinErrorCode =
  | 'tooLarge'
  | 'tooManyAtoms'
  | 'invalid'
  | 'empty'
  | 'compressionUnavailable'
  | 'webglUnavailable'
  | 'stale'
  | 'forbidden'
  | 'missing'
  | 'loadFailed'
  | 'timeout'

export class ProteinPreviewError extends Error {
  constructor(public code: ProteinErrorCode) {
    super(code)
    this.name = 'ProteinPreviewError'
  }
}

/** Bound the decoded size too, so small gzip files cannot expand without a limit. */
export async function loadProteinText(
  url: string,
  compressed: boolean,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(url, { credentials: 'include', signal })
  if (!response.ok) {
    const codes: Record<number, ProteinErrorCode> = {
      401: 'forbidden',
      403: 'forbidden',
      404: 'missing',
      409: 'stale',
      413: 'tooLarge',
    }
    throw new ProteinPreviewError(codes[response.status] ?? 'loadFailed')
  }
  if (!response.body) throw new ProteinPreviewError('empty')
  if (Number(response.headers.get('content-length')) > MAX_STRUCTURE_BYTES) {
    await response.body.cancel()
    throw new ProteinPreviewError('tooLarge')
  }
  let stream = response.body
  if (compressed) {
    if (typeof DecompressionStream === 'undefined') {
      await stream.cancel()
      throw new ProteinPreviewError('compressionUnavailable')
    }
    stream = stream.pipeThrough(new DecompressionStream('gzip'))
  }
  const reader = stream.getReader()
  const cancelOnAbort = () => {
    void reader.cancel(signal.reason).catch(() => {})
  }
  signal.addEventListener('abort', cancelOnAbort, { once: true })
  const decoder = new TextDecoder('utf-8', { fatal: true })
  const parts: string[] = []
  let size = 0
  try {
    while (true) {
      signal.throwIfAborted()
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_STRUCTURE_BYTES) throw new ProteinPreviewError('tooLarge')
      parts.push(decoder.decode(value, { stream: true }))
    }
    signal.throwIfAborted()
    parts.push(decoder.decode())
    const content = parts.join('')
    if (!content.trim()) throw new ProteinPreviewError('empty')
    return content
  } catch (error) {
    await reader.cancel().catch(() => {})
    if (signal.aborted) throw signal.reason
    if (error instanceof ProteinPreviewError) throw error
    throw new ProteinPreviewError('invalid')
  } finally {
    signal.removeEventListener('abort', cancelOnAbort)
    reader.releaseLock()
  }
}
