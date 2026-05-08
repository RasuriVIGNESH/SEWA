export function getStatusColor(status) {
  switch (status) {
    case 'STABLE':
      return 'bg-stable/10 text-stable border-stable/20';
    case 'WARNING':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'CRITICAL':
      return 'bg-critical/10 text-critical border-critical/20';
    case 'UNDER_OBSERVATION':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'DISCHARGED':
      return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
    default:
      return 'bg-surface-elevated text-text-primary border-border';
  }
}
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}