import { clientFetch } from '@/lib/api-client'

export interface LibraryStats {
  tools: number
  tool_groups: number
  images: number
  codes: number
  subgraphs: number
  executable_nodes: number
  tool_memories: number
  bio_dbs: number
  reference_genomes: number
  resources: number
}

export interface TaxonomyGroupItem {
  id: number
  name: string
  parent_id: number | null
  tool_count: number
}

export interface TaxonomyTagItem {
  id: number
  name: string
  tool_count: number
}

export interface TaxonomyLinkItem {
  group_id: number
  tag_id: number
  weight: number
}

export interface LibraryTaxonomy {
  groups: TaxonomyGroupItem[]
  tags: TaxonomyTagItem[]
  links: TaxonomyLinkItem[]
}

export async function getLibraryStats(): Promise<LibraryStats> {
  return await clientFetch<LibraryStats>('/library/stats')
}

export async function getLibraryTaxonomy(
  maxTags = 36,
): Promise<LibraryTaxonomy> {
  return await clientFetch<LibraryTaxonomy>('/library/taxonomy', {
    params: { max_tags: String(maxTags) },
  })
}
