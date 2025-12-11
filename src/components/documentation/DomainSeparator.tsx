import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCcw, BarChart3, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DomainType = 'config' | 'operation' | 'control' | 'integration';

interface DomainConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const domainConfigs: Record<DomainType, DomainConfig> = {
  config: {
    label: 'Configuración',
    icon: <Settings size={14} />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    borderColor: 'border-blue-200 dark:border-blue-500/30'
  },
  operation: {
    label: 'Operación Diaria',
    icon: <RefreshCcw size={14} />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30'
  },
  control: {
    label: 'Control y Monitoreo',
    icon: <BarChart3 size={14} />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-500/10',
    borderColor: 'border-purple-200 dark:border-purple-500/30'
  },
  integration: {
    label: 'Integraciones',
    icon: <Link size={14} />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-500/30'
  }
};

interface DomainSeparatorProps {
  domain: DomainType;
  phaseCount?: number;
  isFirst?: boolean;
  className?: string;
}

export const DomainSeparator: React.FC<DomainSeparatorProps> = ({
  domain,
  phaseCount,
  isFirst = false,
  className
}) => {
  const config = domainConfigs[domain];

  return (
    <div 
      className={cn(
        "relative flex items-center gap-4 py-4",
        !isFirst && "mt-6 pt-6 border-t",
        className
      )}
    >
      {/* Domain Badge */}
      <Badge 
        variant="outline"
        className={cn(
          "px-3 py-1.5 gap-2 text-sm font-medium border-2",
          config.color,
          config.bgColor,
          config.borderColor
        )}
      >
        {config.icon}
        {config.label}
      </Badge>

      {/* Decorative Line */}
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />

      {/* Phase Count */}
      {phaseCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          {phaseCount} {phaseCount === 1 ? 'fase' : 'fases'}
        </span>
      )}
    </div>
  );
};

// Helper to detect domain changes in a list of phases
export const getDomainForPhase = (phaseNumber: number, moduleId: string): DomainType | null => {
  // Planeación module domain mapping
  if (moduleId === 'planeacion') {
    if (phaseNumber <= 2) return 'config';
    if (phaseNumber <= 6) return 'operation';
    if (phaseNumber <= 8) return 'control';
  }
  
  // Supply module domain mapping
  if (moduleId === 'supply') {
    if (phaseNumber <= 2) return 'config';
    if (phaseNumber <= 10) return 'operation';
    if (phaseNumber === 11) return 'control';
  }
  
  // Instaladores module domain mapping
  if (moduleId === 'instaladores') {
    if (phaseNumber === 1) return 'config';
    if (phaseNumber <= 3) return 'operation';
    if (phaseNumber === 4) return 'control';
  }

  // Integraciones module
  if (moduleId === 'integraciones') {
    return 'integration';
  }
  
  return null;
};

// Check if we need a domain separator before this phase
export const shouldShowDomainSeparator = (
  currentPhase: number, 
  previousPhase: number | null,
  moduleId: string
): DomainType | null => {
  const currentDomain = getDomainForPhase(currentPhase, moduleId);
  const previousDomain = previousPhase ? getDomainForPhase(previousPhase, moduleId) : null;
  
  if (currentDomain && currentDomain !== previousDomain) {
    return currentDomain;
  }
  
  return null;
};
