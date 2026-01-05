import React from 'react';
import { getLeadAge, getUrgencyColor } from '@/utils/leadAgeUtils';
import { cn } from '@/lib/utils';

interface LeadAgeBadgeProps {
  createdAt: string | null | undefined;
  className?: string;
}

export const LeadAgeBadge: React.FC<LeadAgeBadgeProps> = ({ createdAt, className }) => {
  const { label, urgency } = getLeadAge(createdAt);
  
  if (label === '-') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums',
        getUrgencyColor(urgency),
        className
      )}
    >
      {label}
    </span>
  );
};
