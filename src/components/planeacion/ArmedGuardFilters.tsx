import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterConfig } from '@/hooks/useArmedGuardFilters';

interface ArmedGuardFiltersProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: Partial<FilterConfig>) => void;
  onReset: () => void;
  resultsCount: number;
  totalCount: number;
  availableZones: string[];
}

export function ArmedGuardFilters({
  filterConfig,
  onFilterChange,
  onReset,
  resultsCount,
  totalCount,
  availableZones,
}: ArmedGuardFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const hasActiveFilters = 
    filterConfig.disponibilidad !== 'todos' ||
    filterConfig.ratingMinimo > 0 ||
    filterConfig.experienciaMinima > 0 ||
    (filterConfig.zonasGeograficas && filterConfig.zonasGeograficas.length > 0);

  const quickFilters = [
    {
      label: 'Todos',
      active: !hasActiveFilters && filterConfig.ordenarPor === 'productividad',
      onClick: () => onReset(),
    },
    {
      label: 'Disponibles',
      active: filterConfig.disponibilidad === 'disponible',
      onClick: () => onFilterChange({ disponibilidad: 'disponible' }),
    },
    {
      label: 'Top Rated (⭐4.5+)',
      active: filterConfig.ratingMinimo >= 4.5,
      onClick: () => onFilterChange({ ratingMinimo: 4.5, ordenarPor: 'rating' }),
    },
    {
      label: 'Más Productivos',
      active: filterConfig.ordenarPor === 'productividad',
      onClick: () => onFilterChange({ ordenarPor: 'productividad' }),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Badge
            key={filter.label}
            variant={filter.active ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={filter.onClick}
          >
            {filter.label}
          </Badge>
        ))}
        {hasActiveFilters && (
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
            onClick={onReset}
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar filtros
          </Badge>
        )}
      </div>

      {/* Results Counter */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Mostrando <strong className="text-foreground">{resultsCount}</strong> de{' '}
          <strong className="text-foreground">{totalCount}</strong> armados
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-8"
        >
          <Filter className="h-3 w-3 mr-2" />
          Filtros avanzados
          {showAdvanced ? (
            <ChevronUp className="h-3 w-3 ml-2" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-2" />
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-4 space-y-4 bg-secondary/20">
          <div className="grid grid-cols-2 gap-4">
            {/* Sort By */}
            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select
                value={filterConfig.ordenarPor}
                onValueChange={(value) =>
                  onFilterChange({
                    ordenarPor: value as FilterConfig['ordenarPor'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productividad">🚀 Productividad</SelectItem>
                  <SelectItem value="rating">⭐ Rating</SelectItem>
                  <SelectItem value="experiencia">📊 Experiencia</SelectItem>
                  <SelectItem value="servicios">📈 Servicios completados</SelectItem>
                  <SelectItem value="nombre">🔤 Nombre (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <Label>Disponibilidad</Label>
              <Select
                value={filterConfig.disponibilidad}
                onValueChange={(value) =>
                  onFilterChange({
                    disponibilidad: value as FilterConfig['disponibilidad'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponible">✅ Disponibles</SelectItem>
                  <SelectItem value="ocupado">⏳ Ocupados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Geographic Zone */}
            {availableZones.length > 0 && (
              <div className="space-y-2">
                <Label>Zona geográfica</Label>
                <Select
                  value={filterConfig.zonasGeograficas?.[0] || 'todas'}
                  onValueChange={(value) =>
                    onFilterChange({
                      zonasGeograficas: value === 'todas' ? [] : [value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las zonas</SelectItem>
                    {availableZones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Minimum Experience */}
            <div className="space-y-2">
              <Label>Experiencia mínima: {filterConfig.experienciaMinima} años</Label>
              <Slider
                value={[filterConfig.experienciaMinima]}
                onValueChange={(value) =>
                  onFilterChange({ experienciaMinima: value[0] })
                }
                max={20}
                step={1}
                className="pt-2"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <Label>Rating mínimo: {filterConfig.ratingMinimo.toFixed(1)} ⭐</Label>
            <Slider
              value={[filterConfig.ratingMinimo]}
              onValueChange={(value) =>
                onFilterChange({ ratingMinimo: value[0] })
              }
              max={5}
              step={0.5}
              className="pt-2"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
