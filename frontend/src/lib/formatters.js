export function getStatusColor(status) {
  switch (status) {
    case 'STABLE':
      // Using standard Tailwind emerald instead of custom 'stable'
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'WARNING':
    case 'UNDER_OBSERVATION':
      // Using standard Tailwind amber instead of custom 'warning'
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'CRITICAL':
      // Using standard Tailwind red instead of custom 'critical'
      return 'bg-red-50 text-red-700 border-red-100';
    case 'DISCHARGED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '--';
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