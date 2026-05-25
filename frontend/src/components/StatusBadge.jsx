import { cn } from '../lib/utils';
import { getStatusColor } from '../lib/formatters';

export function StatusBadge({ status, className }) {
  const colorClass = getStatusColor(status);
  const displayStatus = status?.replace(/_/g, ' ') || 'Unknown';

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-widest',
      colorClass,
      className
    )}>
      <span className={cn(
        'inline-block w-2 h-2 rounded-full',
        status === 'STABLE' && 'bg-emerald-600',
        status === 'WARNING' || status === 'UNDER_OBSERVATION' ? 'bg-amber-600' : '',
        status === 'CRITICAL' && 'bg-red-600',
        status === 'DISCHARGED' && 'bg-slate-500'
      )}></span>
      {displayStatus}
    </div>
  );
}
