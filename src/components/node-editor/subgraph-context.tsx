'use client'
import { createContext, use } from 'react'
export const SubgraphNavigation = createContext<(id: string) => void>(() => {})
export const useSubgraphNavigation = () => use(SubgraphNavigation)
