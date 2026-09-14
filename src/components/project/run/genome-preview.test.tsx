import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PreviewRegion } from '@/types/run'
import { GenomePreview, parseLocus } from './genome-preview'

const actions = vi.hoisted(() => ({
  meta: vi.fn(),
  region: vi.fn(),
}))
vi.mock('@/app/actions/run', () => ({
  getRunFilePreviewMeta: actions.meta,
  getRunFilePreviewRegion: actions.region,
}))
vi.mock('next-intl', () => {
  const translate = (key: string, values?: { count: number }) =>
    key === 'featureCount' ? `${values?.count} features` : key
  return { useTranslations: () => translate }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  actions.meta.mockReset()
  actions.region.mockReset()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => null,
  )
})

describe('genomic coordinate conversion', () => {
  it('converts 1-based inclusive input to a half-open viewport', () => {
    expect(parseLocus('chr1:1-1,000')).toEqual({
      chrom: 'chr1',
      start: 0,
      end: 1000,
    })
    expect(parseLocus('chr1:0-10')).toBeNull()
    expect(parseLocus('chr1:100-99')).toBeNull()
  })
})

it('discards an old region response after a rapid viewport change', async () => {
  actions.meta.mockResolvedValue({
    kind: 'bed',
    supported: true,
    chromosomes: [{ name: 'chr1', length: 1000 }],
    default_chromosome: 'chr1',
    has_more_chromosomes: false,
    file_size: 100,
  })
  const first = deferred<PreviewRegion>()
  const second = deferred<PreviewRegion>()
  actions.region
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
  render(<GenomePreview runUid='run' generation={1} path='x.bed' active />)
  await waitFor(() => expect(actions.region).toHaveBeenCalledTimes(1))
  fireEvent.change(screen.getByLabelText('locus'), {
    target: { value: 'chr1:101-200' },
  })
  fireEvent.click(screen.getByText('show'))
  await waitFor(() => expect(actions.region).toHaveBeenCalledTimes(2))
  await act(async () => {
    second.resolve({
      kind: 'intervals',
      chrom: 'chr1',
      start: 100,
      end: 200,
      items: [{ start: 100, end: 110, name: 'new' }],
    })
  })
  expect(screen.getByText('1 features')).toBeInTheDocument()
  await act(async () => {
    first.resolve({
      kind: 'intervals',
      chrom: 'chr1',
      start: 0,
      end: 1000,
      items: [
        { start: 0, end: 10, name: 'old' },
        { start: 20, end: 30, name: 'old' },
      ],
    })
  })
  expect(screen.getByText('1 features')).toBeInTheDocument()
  expect(actions.region.mock.calls[0][4].aborted).toBe(true)
})
