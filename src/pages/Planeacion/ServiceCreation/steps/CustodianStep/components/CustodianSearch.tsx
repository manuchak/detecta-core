/**
 * CustodianSearch - Search bar with debounced input and quick filters
 * OPTIMIZED: Debounce prevents excessive re-renders while typing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CustodianStepFilters } from '../types';

interface CustodianSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: CustodianStepFilters;
  onFilterToggle: (key: keyof CustodianStepFilters) => void;
  resultsCount: number;
  totalCount: number;
}

// Debounce delay in ms - optimized for i3 laptops
const DEBOUNCE_MS = 300;

export function CustodianSearch({
  searchTerm,
  onSearchChange,
  filters,
  onFilterToggle,
  resultsCount,
  totalCount,
}: CustodianSearchProps) {
  // Local state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external changes to local state
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value); // Immediate UI update
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounced call
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, DEBOUNCE_MS);
  }, [onSearchChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    setLocalSearch('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o zona..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {localSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        
        <Badge
          variant={filters.disponibles ? "default" : "outline"}
          className="cursor-pointer transition-all"
          onClick={() => onFilterToggle('disponibles')}
        >
          🟢 Disponibles {filters.disponibles && '✓'}
        </Badge>
        
        <Badge
          variant={filters.parcialmenteOcupados ? "secondary" : "outline"}
          className="cursor-pointer transition-all"
          onClick={() => onFilterToggle('parcialmenteOcupados')}
        >
          🟡 Parciales {filters.parcialmenteOcupados && '✓'}
        </Badge>
        
        <Badge
          variant={filters.ocupados ? "secondary" : "outline"}
          className="cursor-pointer transition-all"
          onClick={() => onFilterToggle('ocupados')}
        >
          🟠 Ocupados {filters.ocupados && '✓'}
        </Badge>

        {/* Results counter */}
        <span className="ml-auto text-sm text-muted-foreground">
          {resultsCount} de {totalCount} custodios
        </span>
      </div>
    </div>
  );
}
