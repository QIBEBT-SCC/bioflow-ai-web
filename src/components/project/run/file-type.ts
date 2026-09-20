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
const NEWICK_EXTS = new Set([
  'bionj',
  'contree',
  'dnd',
  'newick',
  'nwk',
  'tre',
  'tree',
  'treefile',
  'trees',
])
const MSA_EXTS = new Set([
  'afa',
  'aln',
  'clustal',
  'clw',
  'msa',
  'phy',
  'phylip',
  'sto',
  'stockholm',
])
const TEXT_EXTS = new Set([
  'txt',
  'log',
  'md',
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
  const lowerName = name.toLowerCase()
  if (lowerName.endsWith('.vcf') || lowerName.endsWith('.vcf.gz')) return 'vcf'
  const ext = lowerName.split('.').pop() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (PDF_EXTS.has(ext)) return 'pdf'
  if (HTML_EXTS.has(ext)) return 'html'
  if (ext === 'json') return 'json'
  if (NEWICK_EXTS.has(ext)) return 'newick'
  if (MSA_EXTS.has(ext)) return 'msa'
  if (ext === 'gfa' || ext === 'gfa1') return 'gfa'
  if (ext === 'csv' || ext === 'tsv') return 'table'
  if (ext === 'bw' || ext === 'bigwig') return 'bigwig'
  if (ext === 'bedgraph' || ext === 'bdg' || ext === 'bg') return 'bedgraph'
  if (ext === 'wig' || ext === 'wiggle') return 'wig'
  if (ext === 'bb' || ext === 'bigbed') return 'bigbed'
  if (ext === 'bed') return 'bed'
  if (ext === 'hic' || ext === 'cool' || ext === 'mcool') return ext
  return TEXT_EXTS.has(ext) ? 'text' : 'unknown'
}
