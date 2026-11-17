/** Triggers a browser download for a URL (data:, blob: or same-origin). */
export function downloadUrl(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function downloadText(content: string, fileName: string, mimeType: string) {
  const blobUrl = URL.createObjectURL(new Blob([content], { type: mimeType }))
  downloadUrl(blobUrl, fileName)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}
