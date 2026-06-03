import type { Metadata } from 'next'
import ProjectsPageClient from '@/app/(main)/project/project-page-client'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage user projects in BioFlow AI workflows.',
}

export default function ProjectsPage() {
  return <ProjectsPageClient />
}
