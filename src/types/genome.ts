// 索引状态枚举
export type IndexStatus = 'ready' | 'not_built' | 'building'

// 各比对工具的索引状态
export interface GenomeIndexStatus {
  bowtie2: IndexStatus
  bwa: IndexStatus
  hisat2: IndexStatus
  star: IndexStatus
  minimap2: IndexStatus
}

// 列表项（用于列表 / 搜索结果展示）
export interface ReferenceGenomeListItem {
  id: number
  ncbi_tax_id: number
  name: string
  accession: string
  aliases: string | null
  index_status: GenomeIndexStatus
}

// 完整详情（用于详情页）
export interface ReferenceGenomePublic extends ReferenceGenomeListItem {
  genome_sequences: string
  annotation_gff: string
  annotation_gtf: string
  bowtie2_index: string | null
  bwa_index: string | null
  hisat2_index: string | null
  star_index: string | null
  minimap2_index: string | null
}

// 下载请求体（ncbi_tax_id 与 species_name 二选一）
export interface ReferenceGenomeDownloadRequest {
  ncbi_tax_id?: number
  species_name?: string
  required_index?: string[]
}

// 下载接口响应
export interface GenomeDownloadResponse {
  task_id: string
  message: string
  ncbi_accession: string
  ncbi_tax_id: number
  species_name: string
}

// 索引构建请求体
export interface ReferenceGenomeBuildIndexRequest {
  required_index: string[]
}

// 通用 Celery 任务响应
export interface CeleryTaskResponse {
  task_id: string
  message: string
}

// 索引工具信息
export const INDEX_TOOLS: {
  key: keyof GenomeIndexStatus
  field: string
  label: string
  descKey: string
}[] = [
  {
    key: 'bowtie2',
    field: 'bowtie2_index',
    label: 'Bowtie2',
    descKey: 'genome.tool_bowtie2_desc',
  },
  {
    key: 'bwa',
    field: 'bwa_index',
    label: 'BWA',
    descKey: 'genome.tool_bwa_desc',
  },
  {
    key: 'hisat2',
    field: 'hisat2_index',
    label: 'HISAT2',
    descKey: 'genome.tool_hisat2_desc',
  },
  {
    key: 'star',
    field: 'star_index',
    label: 'STAR',
    descKey: 'genome.tool_star_desc',
  },
  {
    key: 'minimap2',
    field: 'minimap2_index',
    label: 'Minimap2',
    descKey: 'genome.tool_minimap2_desc',
  },
]
