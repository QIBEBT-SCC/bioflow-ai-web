'use client'

import { createContext, use } from 'react'

/** Builds the href for a child run (ForEach/batch item) so each host page keeps navigation in its own section. */
const RunLinkContext = createContext<(runUid: string) => string>(
  (runUid) => `/workflow/${runUid}`,
)

export const RunLinkProvider = RunLinkContext.Provider

export const useRunLink = () => use(RunLinkContext)
