import { useState, useEffect, useMemo } from 'react';
import { ArmedGuard } from './useArmedGuardsWithTracking';

export interface FilterConfig {
  disponibilidad: 'todos' | 'disponible' | 'ocupado';
  ratingMinimo: number;
  experienciaMinima: number;
  zonasGeograficas?: string[];
  ordenarPor: 'productividad' | 'rating' | 'experiencia' | 'servicios' | 'nombre';
  // 🆕 Filtro de actividad reciente
  soloConActividad90Dias: boolean;
}

const DEFAULT_FILTER_CONFIG: FilterConfig = {
  disponibilidad: 'todos',
  ratingMinimo: 0,
  experienciaMinima: 0,
  zonasGeograficas: [],
  ordenarPor: 'productividad',
  soloConActividad90Dias: false, // 🔧 FIX: Por defecto DESACTIVADO para mostrar todos los armados
};

const STORAGE_KEY = 'detecta-armados-filter-config';

/**
 * Calcula el score de productividad de un armado
 * Formula: (servicios * 10) + (rating * 20) + (disponibilidad * 30) + (experiencia * 5)
 */
function calculateProductivityScore(guard: ArmedGuard): number {
  const serviciosScore = (guard.numero_servicios || 0) * 10;
  const ratingScore = (guard.rating_promedio || 0) * 20;
  const disponibilidadScore = guard.disponibilidad === 'disponible' ? 30 : 0;
  const experienciaScore = (guard.experiencia_anos || 0) * 5;

  return serviciosScore + ratingScore + disponibilidadScore + experienciaScore;
}

/**
 * Hook para gestionar filtros personalizables de armados con persistencia
 */
export function useArmedGuardFilters(guards: ArmedGuard[]) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_FILTER_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading filter config:', error);
    }
    return DEFAULT_FILTER_CONFIG;
  });

  // Persist to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterConfig));
    } catch (error) {
      console.error('Error saving filter config:', error);
    }
  }, [filterConfig]);

  // Get unique zones from guards
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    guards.forEach((guard) => {
      if (guard.zona_base) {
        zones.add(guard.zona_base);
      }
    });
    return Array.from(zones).sort();
  }, [guards]);

  // Apply filters and sorting
  const filteredAndSortedGuards = useMemo(() => {
    let filtered = [...guards];

    // 🔧 FIX: Apply 90-day activity filter
    if (filterConfig.soloConActividad90Dias) {
      const hace90Dias = new Date();
      hace90Dias.setDate(hace90Dias.getDate() - 90);
      
      filtered = filtered.filter((g) => {
        // Si no tiene fecha de último servicio, incluirlo (puede ser nuevo)
        if (!g.fecha_ultimo_servicio) return true;
        const fechaUltimo = new Date(g.fecha_ultimo_servicio);
        return fechaUltimo >= hace90Dias;
      });
    }

    // Filter by availability
    if (filterConfig.disponibilidad !== 'todos') {
      filtered = filtered.filter(
        (g) => g.disponibilidad === filterConfig.disponibilidad
      );
    }

    // Filter by minimum rating
    if (filterConfig.ratingMinimo > 0) {
      filtered = filtered.filter(
        (g) => (g.rating_promedio || 0) >= filterConfig.ratingMinimo
      );
    }

    // Filter by minimum experience
    if (filterConfig.experienciaMinima > 0) {
      filtered = filtered.filter(
        (g) => (g.experiencia_anos || 0) >= filterConfig.experienciaMinima
      );
    }

    // Filter by zones
    if (filterConfig.zonasGeograficas && filterConfig.zonasGeograficas.length > 0) {
      filtered = filtered.filter(
        (g) =>
          g.zona_base &&
          filterConfig.zonasGeograficas!.includes(g.zona_base)
      );
    }

    // Sort based on selected criteria
    filtered.sort((a, b) => {
      switch (filterConfig.ordenarPor) {
        case 'productividad':
          return calculateProductivityScore(b) - calculateProductivityScore(a);
        
        case 'rating':
          return (b.rating_promedio || 0) - (a.rating_promedio || 0);
        
        case 'experiencia':
          return (b.experiencia_anos || 0) - (a.experiencia_anos || 0);
        
        case 'servicios':
          return (b.numero_servicios || 0) - (a.numero_servicios || 0);
        
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [guards, filterConfig]);

  // Calculate productivity scores for display
  const guardsWithProductivity = useMemo(() => {
    return filteredAndSortedGuards.map((guard) => ({
      ...guard,
      productivityScore: calculateProductivityScore(guard),
    }));
  }, [filteredAndSortedGuards]);

  const updateFilter = (updates: Partial<FilterConfig>) => {
    setFilterConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilterConfig(DEFAULT_FILTER_CONFIG);
  };

  return {
    filterConfig,
    filteredGuards: guardsWithProductivity,
    updateFilter,
    resetFilters,
    availableZones,
    totalCount: guards.length,
    filteredCount: guardsWithProductivity.length,
  };
}
