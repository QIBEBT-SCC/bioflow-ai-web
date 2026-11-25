'use client'

import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  getLibraryStats,
  getLibraryTaxonomy,
  type LibraryStats,
  type LibraryTaxonomy,
} from '@/app/actions/library'
import { getToolMemories } from '@/app/actions/tool-memory'
import type { ToolMemoryListItem } from '@/types/tool-memory'

export interface NodeLibraryOverviewStats {
  toolsTotal: number
  groupsTotal: number
  imagesTotal: number
  codesTotal: number
  subgraphsTotal: number
  executableNodesTotal: number
  memoriesTotal: number
  databasesTotal: number
  genomesTotal: number
  resourcesTotal: number
}

const EMPTY_STATS: NodeLibraryOverviewStats = {
  toolsTotal: 0,
  groupsTotal: 0,
  imagesTotal: 0,
  codesTotal: 0,
  subgraphsTotal: 0,
  executableNodesTotal: 0,
  memoriesTotal: 0,
  databasesTotal: 0,
  genomesTotal: 0,
  resourcesTotal: 0,
}

const EMPTY_TAXONOMY: LibraryTaxonomy = {
  groups: [],
  tags: [],
  links: [],
}

function mapStats(data: LibraryStats | undefined): NodeLibraryOverviewStats {
  if (!data) return EMPTY_STATS
  return {
    toolsTotal: data.tools,
    groupsTotal: data.tool_groups,
    imagesTotal: data.images,
    codesTotal: data.codes,
    subgraphsTotal: data.subgraphs,
    executableNodesTotal: data.executable_nodes,
    memoriesTotal: data.tool_memories,
    databasesTotal: data.bio_dbs,
    genomesTotal: data.reference_genomes,
    resourcesTotal: data.resources,
  }
}

export function useNodeLibraryOverview() {
  const queryClient = useQueryClient()

  const results = useQueries({
    queries: [
      {
        queryKey: ['library', 'stats'],
        queryFn: () => getLibraryStats(),
      },
      {
        queryKey: ['library', 'taxonomy', 36],
        queryFn: () => getLibraryTaxonomy(36),
      },
      {
        queryKey: ['library', 'recent-memories'],
        queryFn: () => getToolMemories(undefined, 0, 6),
      },
    ],
  })

  const [statsQ, taxonomyQ, memoriesQ] = results

  const stats = mapStats(statsQ.data)
  const taxonomy: LibraryTaxonomy = taxonomyQ.data ?? EMPTY_TAXONOMY
  const recentMemories: ToolMemoryListItem[] = memoriesQ.data?.data ?? []

  const isLoading = results.some((q) => q.isLoading)
  const isFetching = results.some((q) => q.isFetching)

  const refetchAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['library'] })
  }, [queryClient])

  return {
    stats,
    taxonomy,
    recentMemories,
    isLoading,
    isFetching,
    refetchAll,
  }
}

export function usePublicLibraryStats() {
  const query = useQuery({
    queryKey: ['library', 'stats'],
    queryFn: () => getLibraryStats(),
    retry: false,
  })

  return {
    stats: mapStats(query.data),
    isLoading: query.isLoading,
    hasData: !query.isError && query.data !== undefined,
  }
}
