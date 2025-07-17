import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lead, LeadEstado } from '@/types/leadTypes';

interface LeadsFilters {
  searchTerm?: string;
  status?: string;
  assignment?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
}

interface LeadsPagination {
  page: number;
  pageSize: number;
}

interface UseSimpleLeadsOptions {
  filters?: LeadsFilters;
  pagination?: LeadsPagination;
  enableCache?: boolean;
}

// Cache simple en memoria
const cache = new Map<string, { data: Lead[]; timestamp: number; totalCount: number }>();
const CACHE_DURATION = 30000; // 30 segundos

export const useSimpleLeads = (options: UseSimpleLeadsOptions = {}) => {
  const { 
    filters = {}, 
    pagination = { page: 1, pageSize: 50 },
    enableCache = true 
  } = options;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { toast } = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Crear clave de cache basada en filtros y paginación
  const cacheKey = useMemo(() => {
    return JSON.stringify({ filters, pagination, refreshTrigger });
  }, [filters, pagination, refreshTrigger]);

  // Función optimizada para cargar datos con filtros en el backend
  const fetchLeads = useCallback(async () => {
    if (!mounted.current) return;
    
    // Verificar cache primero
    if (enableCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`🚀 SimpleLeads: Using cached data for ${leads.length} leads`);
        setLeads(cached.data);
        setTotalCount(cached.totalCount);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    console.log(`📋 SimpleLeads: Fetching leads with filters:`, filters);

    try {
      // Construir query con filtros en el backend
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Aplicar filtros en el backend
      if (filters.searchTerm) {
        // Usar búsqueda de texto completo para nombre y email
        query = query.or(`nombre.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,telefono.ilike.%${filters.searchTerm}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('estado', filters.status);
      }

      if (filters.assignment && filters.assignment !== 'all') {
        if (filters.assignment === 'assigned') {
          query = query.not('asignado_a', 'is', null);
        } else if (filters.assignment === 'unassigned') {
          query = query.is('asignado_a', null);
        }
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        // Agregar 23:59:59 para incluir todo el día
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      if (filters.source && filters.source !== 'all') {
        query = query.eq('fuente', filters.source);
      }

      // Aplicar paginación
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      if (mounted.current) {
        // Convertir datos de la DB al tipo Lead
        const typedLeads: Lead[] = (data || []).map(lead => ({
          ...lead,
          estado: lead.estado as LeadEstado
        }));
        const totalCountData = count || 0;
        
        setLeads(typedLeads);
        setTotalCount(totalCountData);
        setIsLoading(false);
        
        // Guardar en cache
        if (enableCache) {
          cache.set(cacheKey, {
            data: typedLeads,
            totalCount: totalCountData,
            timestamp: Date.now()
          });
        }
        
        console.log(`✅ SimpleLeads: Loaded ${typedLeads.length} of ${totalCountData} leads (page ${pagination.page})`);
      }
    } catch (err) {
      console.error('❌ SimpleLeads: Error:', err);
      if (mounted.current) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setIsLoading(false);
        toast({
          title: "Error",
          description: "No se pudieron cargar los candidatos",
          variant: "destructive",
        });
      }
    }
  }, [mounted, toast, cacheKey, filters, pagination, enableCache]);

  // useEffect que se ejecuta al montar y cuando cambian los filtros/paginación
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Función para refrescar que limpia cache e incrementa el trigger
  const refetch = useCallback(() => {
    if (enableCache) {
      cache.clear(); // Limpiar todo el cache
    }
    setRefreshTrigger(prev => prev + 1);
  }, [enableCache]);

  // Función para limpiar cache específico
  const clearCache = useCallback(() => {
    cache.clear();
  }, []);

  // Métricas de paginación
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const hasNextPage = pagination.page < totalPages;
    const hasPreviousPage = pagination.page > 1;
    
    return {
      currentPage: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      startIndex: (pagination.page - 1) * pagination.pageSize + 1,
      endIndex: Math.min(pagination.page * pagination.pageSize, totalCount)
    };
  }, [pagination, totalCount]);

  return {
    leads,
    totalCount,
    paginationInfo,
    isLoading,
    error,
    canAccess: true, // Simplificado para evitar dependencias
    accessReason: 'Acceso autorizado',
    permissions: { canViewLeads: true, canEditLeads: true }, // Valores estáticos
    userRole: 'user',
    refetch,
    clearCache,
    isEmpty: leads.length === 0 && !isLoading,
  };
};