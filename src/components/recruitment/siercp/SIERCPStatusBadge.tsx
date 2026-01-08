import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Send, 
  Eye, 
  Play, 
  CheckCircle, 
  XCircle, 
  Ban 
} from 'lucide-react';
import type { SIERCPInvitationStatus } from '@/types/siercpInvitationTypes';

interface SIERCPStatusBadgeProps {
  status: SIERCPInvitationStatus;
  showIcon?: boolean;
}

const statusConfig: Record<SIERCPInvitationStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: typeof Clock;
}> = {
  pending: {
    label: 'Pendiente',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground',
    icon: Clock,
  },
  sent: {
    label: 'Enviada',
    variant: 'default',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: Send,
  },
  opened: {
    label: 'Abierta',
    variant: 'default',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    icon: Eye,
  },
  started: {
    label: 'En progreso',
    variant: 'default',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    icon: Play,
  },
  completed: {
    label: 'Completada',
    variant: 'default',
    className: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle,
  },
  expired: {
    label: 'Expirada',
    variant: 'destructive',
    className: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelada',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground line-through',
    icon: Ban,
  },
};

export function SIERCPStatusBadge({ status, showIcon = true }: SIERCPStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
