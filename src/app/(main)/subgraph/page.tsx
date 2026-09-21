import type { Metadata } from 'next'
import { SubgraphManagement } from '@/components/subgraph/subgraph-management'

export const metadata: Metadata = {
  title: 'Subgraph Management',
  description: 'View, edit and manage saved workflow subgraphs.',
}

export default function SubgraphPage() {
  return <SubgraphManagement />
}
