import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface CategoryCount {
  label: string;
  count: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'secondary' | 'destructive' | 'outline';
}

interface SearchResultsInfoProps {
  categories: CategoryCount[];
  totalFiltered?: number;
  totalAvailable?: number;
  emptyMessage?: string;
  className?: string;
}

export function SearchResultsInfo({
  categories,
  totalFiltered,
  totalAvailable,
  emptyMessage,
  className = ''
}: SearchResultsInfoProps) {
  const hasResults = categories.some(c => c.count > 0);

  if (!hasResults && emptyMessage) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Badges */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category.label}
            variant={category.variant || 'outline'}
            className="px-3 py-1.5"
          >
            {category.icon && <span className="mr-1.5">{category.icon}</span>}
            <span className="font-medium">{category.count}</span>
            <span className="ml-1 text-xs opacity-80">{category.label}</span>
          </Badge>
        ))}
      </div>

      {/* Summary Text */}
      {(totalFiltered !== undefined && totalAvailable !== undefined) && (
        <p className="text-xs text-muted-foreground">
          {totalFiltered === totalAvailable ? (
            <>Mostrando todos los resultados disponibles</>
          ) : (
            <>
              Se filtraron <strong>{totalAvailable - totalFiltered}</strong> resultados
            </>
          )}
        </p>
      )}
    </div>
  );
}

// Predefined category configurations for common use cases
export const CUSTODIAN_CATEGORIES = {
  disponibles: {
    label: 'Disponibles',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'success' as const
  },
  parcialmenteOcupados: {
    label: 'Parcialmente Ocupados',
    icon: <Clock className="h-3 w-3" />,
    variant: 'secondary' as const
  },
  ocupados: {
    label: 'Ocupados',
    icon: <AlertCircle className="h-3 w-3" />,
    variant: 'destructive' as const
  }
};

export const ARMED_GUARD_CATEGORIES = {
  disponibles: {
    label: 'Disponibles',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'success' as const
  },
  conExperiencia: {
    label: 'Con Experiencia',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'secondary' as const
  },
  licenciasVigentes: {
    label: 'Licencias Vigentes',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'success' as const
  },
  activos: {
    label: 'Activos',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'success' as const
  }
};
