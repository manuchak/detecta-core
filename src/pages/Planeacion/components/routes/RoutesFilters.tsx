import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { PendingPriceRoute } from '@/hooks/useRoutesWithPendingPrices';

export interface RoutesFiltersState {
  cliente: string;
  origen: string;
  destino: string;
  tipoProblema: 'all' | 'placeholder' | 'margen_negativo';
  busqueda: string;
}

interface RoutesFiltersProps {
  routes: PendingPriceRoute[];
  filters: RoutesFiltersState;
  onFiltersChange: (filters: RoutesFiltersState) => void;
}

export const defaultFilters: RoutesFiltersState = {
  cliente: 'all',
  origen: 'all',
  destino: 'all',
  tipoProblema: 'all',
  busqueda: '',
};

export function RoutesFilters({ routes, filters, onFiltersChange }: RoutesFiltersProps) {
  // Extract unique values for dropdowns
  const clienteOptions = useMemo(() => {
    const unique = [...new Set(routes.map(r => r.cliente_nombre))].sort();
    return unique;
  }, [routes]);

  const origenOptions = useMemo(() => {
    const unique = [...new Set(routes.map(r => r.origen_texto))].sort();
    return unique;
  }, [routes]);

  const destinoOptions = useMemo(() => {
    const unique = [...new Set(routes.map(r => r.destino_texto))].sort();
    return unique;
  }, [routes]);

  const hasActiveFilters = 
    filters.cliente !== 'all' || 
    filters.origen !== 'all' || 
    filters.destino !== 'all' ||
    filters.tipoProblema !== 'all' ||
    filters.busqueda.trim() !== '';

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, origen o destino..."
          value={filters.busqueda}
          onChange={(e) => onFiltersChange({ ...filters, busqueda: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Cliente</Label>
          <Select 
            value={filters.cliente} 
            onValueChange={(value) => onFiltersChange({ ...filters, cliente: value })}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clienteOptions.map((cliente) => (
                <SelectItem key={cliente} value={cliente}>
                  {cliente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Origen</Label>
          <Select 
            value={filters.origen} 
            onValueChange={(value) => onFiltersChange({ ...filters, origen: value })}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-[200px]">
              <SelectItem value="all">Todos los orígenes</SelectItem>
              {origenOptions.map((origen) => (
                <SelectItem key={origen} value={origen}>
                  {origen}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Destino</Label>
          <Select 
            value={filters.destino} 
            onValueChange={(value) => onFiltersChange({ ...filters, destino: value })}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-[200px]">
              <SelectItem value="all">Todos los destinos</SelectItem>
              {destinoOptions.map((destino) => (
                <SelectItem key={destino} value={destino}>
                  {destino}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Tipo de Problema</Label>
          <Select 
            value={filters.tipoProblema} 
            onValueChange={(value: 'all' | 'placeholder' | 'margen_negativo') => 
              onFiltersChange({ ...filters, tipoProblema: value })
            }
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="placeholder">Precio Placeholder</SelectItem>
              <SelectItem value="margen_negativo">Margen Negativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-9 gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

export function applyRoutesFilters(
  routes: PendingPriceRoute[],
  filters: RoutesFiltersState
): PendingPriceRoute[] {
  return routes.filter((route) => {
    // Cliente filter
    if (filters.cliente !== 'all' && route.cliente_nombre !== filters.cliente) {
      return false;
    }

    // Origen filter
    if (filters.origen !== 'all' && route.origen_texto !== filters.origen) {
      return false;
    }

    // Destino filter
    if (filters.destino !== 'all' && route.destino_texto !== filters.destino) {
      return false;
    }

    // Tipo de problema filter
    if (filters.tipoProblema === 'placeholder' && !route.es_precio_placeholder) {
      return false;
    }
    if (filters.tipoProblema === 'margen_negativo' && !route.tiene_margen_negativo) {
      return false;
    }

    // Search filter
    if (filters.busqueda.trim()) {
      const search = filters.busqueda.toLowerCase();
      const matchesSearch = 
        route.cliente_nombre.toLowerCase().includes(search) ||
        route.origen_texto.toLowerCase().includes(search) ||
        route.destino_texto.toLowerCase().includes(search);
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}
