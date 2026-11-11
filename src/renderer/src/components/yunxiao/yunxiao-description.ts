/** Yunxiao rich text (HTML) shown as plain text; markdown passes through. */
export function yunxiaoDescriptionText(value: string): string {
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return value.trim()
  }
  const doc = new DOMParser().parseFromString(
    value.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '$&\n'),
    'text/html'
  )
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim()
}
