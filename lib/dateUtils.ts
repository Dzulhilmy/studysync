export function getDaysLeft(deadline: string | Date | null) {
  if (!deadline) return { label: '—', color: '#7a6a52' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)

  const diffMs = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, color: '#c0392b' }
  }
  if (diffDays === 0) {
    return { label: 'Due today', color: '#c0392b' }
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d left`, color: '#d4a843' }
  }
  return { label: `${diffDays}d left`, color: '#7a6a52' }
}
