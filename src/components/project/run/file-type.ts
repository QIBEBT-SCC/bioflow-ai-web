import {
  AudioWaveform,
  ChartGantt,
  Dna,
  File,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType as FileTypeIcon,
  Grid3x3,
  type LucideIcon,
  Network,
  Rows3,
  Sheet,
  Waypoints,
} from 'lucide-react'
import type { FileType } from '@/components/project/run/run-tab-bar'

export const RUN_FILE_ICONS: Record<FileType, LucideIcon> = {
  text: FileText,
  json: FileJson,
  newick: Network,
  msa: Rows3,
  gfa: Waypoints,
  table: Sheet,
  vcf: Dna,
  html: FileCode,
  image: FileImage,
  pdf: FileTypeIcon,
  bigwig: AudioWaveform,
  bedgraph: AudioWaveform,
  wig: AudioWaveform,
  bigbed: ChartGantt,
  bed: ChartGantt,
  gff: ChartGantt,
  gtf: ChartGantt,
  hic: Grid3x3,
  cool: Grid3x3,
  mcool: Grid3x3,
  unknown: File,
}

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
const TEXT_PREVIEW_TYPES = new Set<FileType>([
  'text',
  'newick',
  'msa',
  'gfa',
  'table',
  'vcf',
  'bedgraph',
  'wig',
  'bed',
  'gff',
  'gtf',
])

export function usesRunTextPreview(name: string, fileType: FileType): boolean {
  if (name.toLowerCase().endsWith('.gz')) return false
  return TEXT_PREVIEW_TYPES.has(fileType)
}

export function getRunFileType(name: string): FileType {
  const lowerName = name.toLowerCase()
  if (lowerName.endsWith('.vcf') || lowerName.endsWith('.vcf.gz')) return 'vcf'
  if (
    lowerName.endsWith('.gff') ||
    lowerName.endsWith('.gff3') ||
    lowerName.endsWith('.gff.gz') ||
    lowerName.endsWith('.gff3.gz')
  )
    return 'gff'
  if (
    lowerName.endsWith('.gtf') ||
    lowerName.endsWith('.gtt') ||
    lowerName.endsWith('.gtf.gz') ||
    lowerName.endsWith('.gtt.gz')
  )
    return 'gtf'
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
