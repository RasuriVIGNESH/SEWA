import React from 'react';
import { cn } from '../lib/utils';
import { getStatusColor } from '../lib/formatters';
export function StatusBadge({
  status,
  className
}) {
  const normalizedStatus = status.replace(/_/g, ' ');
  return <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5", getStatusColor(status), className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full block", status === 'STABLE' ? 'bg-stable' : '', status === 'WARNING' || status === 'UNDER_OBSERVATION' ? 'bg-warning' : '', status === 'CRITICAL' ? 'bg-critical' : '', status === 'DISCHARGED' ? 'bg-text-secondary' : '')}></span>
      {normalizedStatus}
    </span>;
}