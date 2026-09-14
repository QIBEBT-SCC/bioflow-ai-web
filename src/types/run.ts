export type RunFileNode =
  | { type: 'file'; path: string; name: string; iconType?: 'json' }
  | { type: 'folder'; path: string; name: string; children: RunFileNode[] }

export type PreviewMeta = {
  kind: 'bigwig' | 'bigbed' | 'bed' | 'hic' | 'cool' | 'mcool' | 'unsupported'
  supported: boolean
  reason?: string
  file_size?: number
  chromosomes: { name: string; length: number }[]
  has_more_chromosomes: boolean
  default_chromosome: string | null
  resolutions?: number[]
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

export type ContactRegion = {
  kind: 'heatmap'
  chrom: string
  start: number
  end: number
  chrom2: string
  start2: number
  end2: number
  resolution: number
  width: number
  height: number
  values: number[]
}
