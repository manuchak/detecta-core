import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PricingResult } from './useRouteSubSteps';

export interface RouteCreationData {
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido: number;
  precio_custodio: number;
  distancia_km?: number | null;
  tipo_servicio?: string;
  costo_operativo?: number | null;
  pago_custodio_sin_arma?: number | null;
  justificacion: string;
}

interface UseRouteCreationReturn {
  createRoute: (data: RouteCreationData) => Promise<PricingResult | null>;
  isCreating: boolean;
  creationError: string | null;
  clearError: () => void;
}

export function useRouteCreation(): UseRouteCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const ensureClientExists = async (clienteNombre: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('clientes')
        .select('id')
        .eq('nombre', clienteNombre)
        .maybeSingle();

      if (!data) {
        const { error } = await supabase
          .from('clientes')
          .insert({ nombre: clienteNombre, activo: true });
        
        if (error) {
          console.error('Error creating client:', error);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Error ensuring client exists:', err);
      return false;
    }
  };

  const createRoute = useCallback(async (data: RouteCreationData): Promise<PricingResult | null> => {
    setIsCreating(true);
    setCreationError(null);

    try {
      // Ensure client exists
      const clientExists = await ensureClientExists(data.cliente_nombre);
      if (!clientExists) {
        setCreationError('No se pudo crear el cliente');
        setIsCreating(false);
        return null;
      }

      // Calculate margin
      const costoOp = data.costo_operativo || 0;
      const margen = data.precio_sugerido - data.precio_custodio - costoOp;

      // Insert route
      const { data: newRoute, error } = await supabase
        .from('matriz_precios_rutas')
        .insert({
          cliente_nombre: data.cliente_nombre,
          origen_texto: data.origen_texto,
          destino_texto: data.destino_texto,
          precio_sugerido: data.precio_sugerido,
          precio_custodio: data.precio_custodio,
          distancia_km: data.distancia_km || null,
          tipo_servicio: data.tipo_servicio || 'ARMADA',
          costo_operativo: data.costo_operativo || null,
          pago_custodio_sin_arma: data.pago_custodio_sin_arma || null,
          margen_estimado: margen,
          incluye_armado: data.tipo_servicio === 'ARMADA',
          activo: true,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          setCreationError('Ya existe una ruta para este cliente y destino. Modifica el destino o usa la ruta existente.');
        } else if (error.code === '42501') {
          setCreationError('No tienes permisos para crear rutas. Contacta al administrador.');
        } else {
          setCreationError(error.message || 'Error al crear la ruta');
        }
        setIsCreating(false);
        return null;
      }

      // Map to PricingResult
      const pricingResult: PricingResult = {
        id: newRoute.id,
        cliente_nombre: newRoute.cliente_nombre,
        origen_texto: newRoute.origen_texto,
        destino_texto: newRoute.destino_texto,
        precio_sugerido: newRoute.precio_sugerido,
        precio_custodio: newRoute.precio_custodio,
        pago_custodio_sin_arma: newRoute.pago_custodio_sin_arma,
        costo_operativo: newRoute.costo_operativo,
        margen_estimado: newRoute.margen_estimado,
        distancia_km: newRoute.distancia_km,
        tipo_servicio: newRoute.tipo_servicio,
        incluye_armado: newRoute.incluye_armado,
        es_ruta_reparto: false,
      };

      setIsCreating(false);
      return pricingResult;

    } catch (err) {
      console.error('Error creating route:', err);
      setCreationError('Error inesperado al crear la ruta');
      setIsCreating(false);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setCreationError(null);
  }, []);

  return {
    createRoute,
    isCreating,
    creationError,
    clearError,
  };
}
