/** Keep the output directory in the URL so relative report assets and links resolve. */
export function getRunFileViewUrl(
  runUid: string,
  generation: number,
  path: string,
): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `/api/v2/runs/${encodeURIComponent(runUid)}/files/view/${generation}/${encodedPath}`
}
