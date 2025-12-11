import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Flag } from 'lucide-react';
import { ProcessStatus, getStatusLabel } from '@/data/productArchitecture';

interface StatusBadgeProps {
  status: ProcessStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          icon: CheckCircle2,
          className: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20',
        };
      case 'in-progress':
        return {
          icon: Clock,
          className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
        };
      case 'pending':
        return {
          icon: AlertCircle,
          className: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20',
        };
      case 'feature-flag':
        return {
          icon: Flag,
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20',
        };
      default:
        return {
          icon: Clock,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'} gap-1`}
    >
      <Icon size={iconSize} />
      {getStatusLabel(status)}
    </Badge>
  );
};
