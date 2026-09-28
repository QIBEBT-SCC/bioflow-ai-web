'use client'

import { useEffect, useRef, useState } from 'react'
import { searchWorkflows } from '@/app/actions/workflow'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useWorkflows } from '@/hooks/use-workflow'
import type { WorkflowSearchResult, WorkflowType } from '@/types/workflow'

export type WorkflowSearchMode = 'name' | 'semantic'

export function useWorkflowLibrarySearch(
  open: boolean,
  pageSize: number,
  wfType?: WorkflowType,
) {
  const [mode, setMode] = useState<WorkflowSearchMode>('name')
  const [query, setQueryState] = useState('')
  const [page, setPage] = useState(0)
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [semanticResults, setSemanticResults] = useState<
    WorkflowSearchResult[] | null
  >(null)
  const [semanticPending, setSemanticPending] = useState(false)
  const [semanticError, setSemanticError] = useState<Error | null>(null)
  const requestId = useRef(0)
  const pendingRef = useRef(false)
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const isDebouncing = mode === 'name' && query.trim() !== debouncedQuery
  const listQuery = mode === 'name' ? debouncedQuery : ''
  const pageQuery = useWorkflows(
    page * pageSize,
    pageSize,
    wfType,
    listQuery,
    open && (mode === 'name' || !query.trim()) && !isDebouncing,
  )

  useEffect(
    () => () => {
      requestId.current += 1
    },
    [],
  )

  const setQuery = (value: string) => {
    requestId.current += 1
    pendingRef.current = false
    setSemanticPending(false)
    setSemanticError(null)
    setQueryState(value)
    setPage(0)
    if (!value.trim()) {
      setSemanticResults(null)
      setSubmittedQuery('')
    }
  }

  const setSearchMode = (value: WorkflowSearchMode) => {
    requestId.current += 1
    pendingRef.current = false
    setSemanticPending(false)
    setMode(value)
    setPage(0)
  }

  const reset = () => {
    requestId.current += 1
    pendingRef.current = false
    setMode('name')
    setQueryState('')
    setPage(0)
    setSubmittedQuery('')
    setSemanticResults(null)
    setSemanticPending(false)
    setSemanticError(null)
  }

  const invalidateSemantic = () => {
    requestId.current += 1
    pendingRef.current = false
    setSemanticResults(null)
    setSubmittedQuery('')
    setSemanticPending(false)
    setSemanticError(null)
  }

  const submitSemantic = async () => {
    const submitted = query.trim()
    if (!submitted || pendingRef.current || !open || mode !== 'semantic') return
    const id = ++requestId.current
    pendingRef.current = true
    setSubmittedQuery(submitted)
    setSemanticResults(null)
    setSemanticPending(true)
    setSemanticError(null)
    try {
      const results = await searchWorkflows(submitted, wfType ?? 'all')
      if (id === requestId.current) setSemanticResults(results)
    } catch (error) {
      if (id === requestId.current) {
        setSemanticResults(null)
        setSemanticError(
          error instanceof Error ? error : new Error(String(error)),
        )
      }
    } finally {
      if (id === requestId.current) {
        pendingRef.current = false
        setSemanticPending(false)
      }
    }
  }

  const semanticActive = mode === 'semantic' && !!query.trim()
  const results = semanticActive
    ? (semanticResults ?? [])
    : (pageQuery.data?.data ?? [])
  const isPending = semanticActive
    ? semanticPending
    : isDebouncing || pageQuery.isPending
  const error = semanticActive ? semanticError : pageQuery.error

  return {
    mode,
    setSearchMode,
    query,
    setQuery,
    page,
    setPage,
    reset,
    invalidateSemantic,
    submitSemantic,
    submittedQuery,
    semanticResults,
    semanticPending,
    semanticActive,
    results,
    isPending,
    error,
    pageData: pageQuery.data,
    retry: () => (semanticActive ? submitSemantic() : pageQuery.refetch()),
    needsSubmission: semanticActive && query.trim() !== submittedQuery,
  }
}
