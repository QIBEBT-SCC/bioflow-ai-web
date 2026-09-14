export type RunFileNode =
  | { type: 'file'; path: string; name: string; iconType?: 'json' }
  | { type: 'folder'; path: string; name: string; children: RunFileNode[] }

export type PreviewMeta = {
  kind: 'bigwig' | 'bigbed' | 'bed' | 'unsupported'
  supported: boolean
  reason?: string
  file_size?: number
  chromosomes: { name: string; length: number }[]
  has_more_chromosomes: boolean
  default_chromosome: string | null
}

export type PreviewRegion =
  | {
      kind: 'signal'
      chrom: string
      start: number
      end: number
      points: (number | null)[]
    }
  | {
      kind: 'intervals'
      chrom: string
      start: number
      end: number
      items: { start: number; end: number; name: string }[]
    }
