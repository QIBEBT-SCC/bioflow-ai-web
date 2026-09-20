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

export type TableDataKind =
  | 'integer'
  | 'number'
  | 'boolean'
  | 'temporal'
  | 'text'
  | 'null'

export type TablePreviewColumn = {
  name: string
  dtype: string
  kind: TableDataKind
}

export type TablePreviewMeta = {
  kind: 'csv' | 'tsv'
  supported: true
  file_size: number
  row_count: number
  delimiter: ',' | '\t'
  columns: TablePreviewColumn[]
}

export type TablePreviewSort = {
  column: string
  direction: 'asc' | 'desc'
}

export type TableFilterOperator =
  | 'contains'
  | 'equals'
  | 'not_equals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_null'
  | 'is_not_null'

export type TablePreviewFilter = {
  column: string
  operator: TableFilterOperator
  value?: string
}

export type TablePreviewCell = string | number | boolean | null

export type TablePreviewPage = {
  columns: string[]
  rows: TablePreviewCell[][]
  offset: number
  limit: number
  total: number
  has_more: boolean
}

export type TablePreviewProfile = {
  column: string
  dtype: string
  kind: TableDataKind
  count: number
  null_count: number
  unique_count: number
  minimum?: TablePreviewCell
  maximum?: TablePreviewCell
  mean?: number | null
}

export type VcfVariantType = 'snp' | 'mnv' | 'indel' | 'sv' | 'mixed' | 'other'

export type VcfFilterStatus = 'pass' | 'filtered' | 'unfiltered'

export type VcfPreviewContig = {
  name: string
  length: number
  count: number
  bins: number[]
}

export type VcfPreviewMeta = {
  kind: 'vcf' | 'vcf.gz'
  version: string
  file_size: number
  record_count: number
  sample_count: number
  samples: string[]
  type_counts: Record<VcfVariantType, number>
  filter_counts: Record<VcfFilterStatus, number>
  transitions: number
  transversions: number
  ts_tv_ratio: number | null
  contigs: VcfPreviewContig[]
  default_contig: string | null
}

export type VcfPreviewRow = {
  record_index: number
  chrom: string
  pos: number
  id: string
  ref: string
  alt: string
  qual: number | null
  filter: string
  type: VcfVariantType
}

export type VcfPreviewPage = {
  rows: VcfPreviewRow[]
  offset: number
  limit: number
  total: number
  has_more: boolean
}

export type VcfPreviewDetail = {
  record_index: number
  chrom: string
  pos: number
  id: string
  ref: string
  alts: string[]
  qual: number | null
  filters: { id: string; description: string | null }[]
  type: VcfVariantType
  info: {
    key: string
    value: string | boolean
    description: string | null
  }[]
  format: { key: string; description: string | null }[]
  samples: {
    sample: string
    values: Record<string, string>
    category: 'hom_ref' | 'het' | 'hom_alt' | 'missing'
  }[]
  genotype_counts: Record<'hom_ref' | 'het' | 'hom_alt' | 'missing', number>
}
