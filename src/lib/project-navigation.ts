const PROJECT_LIST_PATH = '/project'

export function getProjectListHref(from: string | null | undefined) {
  if (!from) return PROJECT_LIST_PATH

  try {
    const url = new URL(from, 'http://bioflow.local')
    if (url.origin !== 'http://bioflow.local') return PROJECT_LIST_PATH
    if (url.pathname !== PROJECT_LIST_PATH) return PROJECT_LIST_PATH
    return `${url.pathname}${url.search}`
  } catch {
    return PROJECT_LIST_PATH
  }
}

export function getProjectDetailHref(
  projectId: string | number,
  projectListHref: string,
) {
  const params = new URLSearchParams({
    from: getProjectListHref(projectListHref),
  })

  return `/project/${encodeURIComponent(String(projectId))}?${params.toString()}`
}
