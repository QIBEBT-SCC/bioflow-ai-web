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
  description: string
}[] = [
  {
    key: 'bowtie2',
    field: 'bowtie2_index',
    label: 'Bowtie2',
    description: 'DNA 短读比对（ChIP-seq、ATAC-seq）',
  },
  {
    key: 'bwa',
    field: 'bwa_index',
    label: 'BWA',
    description: 'DNA 短读比对（WGS、WES）',
  },
  {
    key: 'hisat2',
    field: 'hisat2_index',
    label: 'HISAT2',
    description: 'RNA-seq 剪接比对',
  },
  {
    key: 'star',
    field: 'star_index',
    label: 'STAR',
    description: 'RNA-seq 剪接比对（高精度）',
  },
  {
    key: 'minimap2',
    field: 'minimap2_index',
    label: 'Minimap2',
    description: '长读（Nanopore、PacBio）比对',
  },
]
