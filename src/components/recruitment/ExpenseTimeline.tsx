import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimelineEvent {
  type: 'created' | 'approved' | 'rejected' | 'paid';
  date: string;
  label: string;
}

interface ExpenseTimelineProps {
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  estado: string;
}

const safeFormatDate = (dateValue: string, formatString: string = 'dd/MM/yyyy HH:mm'): string => {
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) return 'Fecha inválida';
    return format(date, formatString, { locale: es });
  } catch {
    return 'Fecha inválida';
  }
};

export const ExpenseTimeline = ({ createdAt, approvedAt, rejectedAt, estado }: ExpenseTimelineProps) => {
  const events: TimelineEvent[] = [
    {
      type: 'created',
      date: createdAt,
      label: 'Gasto registrado',
    },
  ];

  if (approvedAt) {
    events.push({
      type: 'approved',
      date: approvedAt,
      label: 'Aprobado',
    });
  }

  if (rejectedAt) {
    events.push({
      type: 'rejected',
      date: rejectedAt,
      label: 'Rechazado',
    });
  }

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return Clock;
      case 'approved':
        return Check;
      case 'rejected':
        return X;
      default:
        return AlertCircle;
    }
  };

  const getColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = getIcon(event.type);
        const isLast = index === events.length - 1;

        return (
          <div key={index} className="flex gap-3 relative">
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
            )}
            
            <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center z-10 ${getColor(event.type)}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 pt-1">
              <p className="font-medium text-sm">{event.label}</p>
              <p className="text-xs text-muted-foreground">
                {safeFormatDate(event.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
