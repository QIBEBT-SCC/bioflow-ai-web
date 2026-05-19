'use client'

import { createContext, use } from 'react'

const ReadOnlyContext = createContext(false)

export const ReadOnlyProvider = ReadOnlyContext.Provider

export const useReadOnly = () => use(ReadOnlyContext)
