import { differenceInDays, differenceInHours } from 'date-fns';

export type LeadUrgency = 'new' | 'normal' | 'aging' | 'critical';

export interface LeadAge {
  label: string;
  urgency: LeadUrgency;
  days: number;
}

export const getLeadAge = (createdAt: string | null | undefined): LeadAge => {
  if (!createdAt) {
    return { label: '-', urgency: 'normal', days: 0 };
  }

  const now = new Date();
  const created = new Date(createdAt);
  const days = differenceInDays(now, created);
  const hours = differenceInHours(now, created);

  if (hours < 24) {
    return { label: 'Hoy', urgency: 'new', days: 0 };
  }
  
  if (days <= 2) {
    return { label: `${days}d`, urgency: 'new', days };
  }
  
  if (days <= 5) {
    return { label: `${days}d`, urgency: 'normal', days };
  }
  
  if (days <= 10) {
    return { label: `${days}d`, urgency: 'aging', days };
  }
  
  if (days <= 14) {
    return { label: '2sem', urgency: 'aging', days };
  }
  
  const weeks = Math.floor(days / 7);
  return { label: `${weeks}sem+`, urgency: 'critical', days };
};

export const getUrgencyColor = (urgency: LeadUrgency): string => {
  switch (urgency) {
    case 'new':
      return 'text-emerald-600 bg-emerald-50';
    case 'normal':
      return 'text-muted-foreground bg-muted/50';
    case 'aging':
      return 'text-amber-600 bg-amber-50';
    case 'critical':
      return 'text-destructive bg-destructive/10';
    default:
      return 'text-muted-foreground bg-muted/50';
  }
};

export const getPriorityBorderColor = (urgency: LeadUrgency): string => {
  switch (urgency) {
    case 'new':
      return 'border-l-emerald-500';
    case 'normal':
      return 'border-l-transparent';
    case 'aging':
      return 'border-l-amber-500';
    case 'critical':
      return 'border-l-destructive';
    default:
      return 'border-l-transparent';
  }
};
