export function formatDistanceToNow(
  dateInput: string | Date,
  options?: { addSuffix?: boolean }
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (isNaN(diffInSeconds)) return 'recently'
  if (diffInSeconds < 30) return options?.addSuffix ? 'just now' : 'moments ago'
  if (diffInSeconds < 60) return options?.addSuffix ? `${diffInSeconds}s ago` : `${diffInSeconds}s`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return options?.addSuffix ? `${diffInMinutes}m ago` : `${diffInMinutes}m`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return options?.addSuffix ? `${diffInHours}h ago` : `${diffInHours}h`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return options?.addSuffix ? `${diffInDays}d ago` : `${diffInDays}d`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return options?.addSuffix ? `${diffInMonths}mo ago` : `${diffInMonths}mo`

  const diffInYears = Math.floor(diffInDays / 365)
  return options?.addSuffix ? `${diffInYears}y ago` : `${diffInYears}y`
}

export function format(dateInput: string | Date, _formatStr?: string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
