import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

interface SearchFilter {
  id: string;
  label: string;
  value: any;
  active: boolean;
  variant?: 'default' | 'success' | 'secondary' | 'destructive' | 'outline';
}

interface UniversalSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  filters?: SearchFilter[];
  onFilterToggle?: (filterId: string) => void;
  onClearAll?: () => void;
  resultsCount?: number;
  totalCount?: number;
  debounceMs?: number;
  className?: string;
}

export function UniversalSearchBar({
  placeholder = 'Buscar por nombre, teléfono o zona...',
  value,
  onChange,
  filters = [],
  onFilterToggle,
  onClearAll,
  resultsCount,
  totalCount,
  debounceMs = 300,
  className = ''
}: UniversalSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const hasActiveFilters = filters.some(f => f.active);
  const hasSearch = localValue.trim().length > 0;

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-10 pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {(hasSearch || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 px-2"
            >
              <Filter className={`h-3 w-3 ${hasActiveFilters ? 'text-primary' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground flex items-center">
            Filtros rápidos:
          </span>
          {filters.map((filter) => (
            <Badge
              key={filter.id}
              variant={filter.active ? (filter.variant || 'default') : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onFilterToggle?.(filter.id)}
            >
              {filter.label}
              {filter.active && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
      )}

      {/* Results Counter */}
      {(resultsCount !== undefined && totalCount !== undefined) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Mostrando <strong className="text-foreground">{resultsCount}</strong> de{' '}
            <strong className="text-foreground">{totalCount}</strong> resultados
          </span>
          {hasSearch && (
            <span className="text-xs text-muted-foreground">
              Búsqueda: "{localValue}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
