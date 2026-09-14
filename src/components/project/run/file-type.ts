import type { FileType } from '@/components/project/run/run-tab-bar'

const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'bmp',
  'tif',
  'tiff',
])
const HTML_EXTS = new Set(['html', 'htm'])
const PDF_EXTS = new Set(['pdf'])
const TEXT_EXTS = new Set([
  'txt',
  'log',
  'md',
  'csv',
  'tsv',
  'fasta',
  'fa',
  'fastq',
  'fq',
  'vcf',
  'gff',
  'gtf',
  'sam',
  'sh',
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'dict',
  'py',
  'r',
])

export function getRunFileType(name: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (PDF_EXTS.has(ext)) return 'pdf'
  if (HTML_EXTS.has(ext)) return 'html'
  if (ext === 'json') return 'json'
  if (ext === 'bw' || ext === 'bigwig') return 'bigwig'
  if (ext === 'bb' || ext === 'bigbed') return 'bigbed'
  if (ext === 'bed') return 'bed'
  if (ext === 'hic' || ext === 'cool' || ext === 'mcool') return ext
  return TEXT_EXTS.has(ext) ? 'text' : 'unknown'
}
