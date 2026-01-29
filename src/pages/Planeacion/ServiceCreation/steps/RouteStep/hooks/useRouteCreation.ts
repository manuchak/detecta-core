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

export interface InverseRouteInfo {
  exists: boolean;
  route?: {
    id: string;
    origen_texto: string;
    destino_texto: string;
    valor_bruto: number;
    precio_custodio: number;
  };
}

interface UseRouteCreationReturn {
  createRoute: (data: RouteCreationData) => Promise<PricingResult | null>;
  checkForInverseRoute: (cliente: string, origen: string, destino: string) => Promise<InverseRouteInfo>;
  isCreating: boolean;
  creationError: string | null;
  clearError: () => void;
}

// Normaliza texto para comparaciones case-insensitive
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export function useRouteCreation(): UseRouteCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const ensureClientExists = async (clienteNombre: string): Promise<boolean> => {
    try {
      // Buscar en la tabla correcta: pc_clientes
      const { data: existingClient } = await supabase
        .from('pc_clientes')
        .select('id')
        .eq('nombre', clienteNombre.trim())
        .maybeSingle();

      // Si el cliente ya existe, retornar éxito
      if (existingClient) {
        console.log('✅ Cliente existente encontrado:', existingClient.id);
        return true;
      }

      // Si no existe, crear con campos obligatorios
      console.log('🆕 Creando nuevo cliente en pc_clientes:', clienteNombre);
      const { error } = await supabase
        .from('pc_clientes')
        .insert({ 
          nombre: clienteNombre.trim(), 
          activo: true,
          contacto_nombre: 'Por definir',
          contacto_tel: 'Por definir',
          notas: 'Cliente creado automáticamente desde flujo de nuevo servicio'
        });
      
      if (error) {
        // Si el error es de duplicado, el cliente ya existe (race condition safe)
        if (error.code === '23505') {
          console.log('✅ Cliente creado por otro proceso, continuando...');
          return true;
        }
        console.error('Error creating client:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error ensuring client exists:', err);
      return false;
    }
  };

  // Verifica si existe la ruta inversa (destino→origen en lugar de origen→destino)
  const checkForInverseRoute = useCallback(async (
    cliente: string,
    origen: string,
    destino: string
  ): Promise<InverseRouteInfo> => {
    try {
      const { data } = await supabase
        .from('matriz_precios_rutas')
        .select('id, origen_texto, destino_texto, valor_bruto, precio_custodio')
        .ilike('cliente_nombre', cliente.trim())
        .ilike('origen_texto', destino.trim()) // Invertido: origen buscado = destino ingresado
        .ilike('destino_texto', origen.trim()) // Invertido: destino buscado = origen ingresado
        .eq('activo', true)
        .maybeSingle();

      if (data) {
        return {
          exists: true,
          route: {
            id: data.id,
            origen_texto: data.origen_texto,
            destino_texto: data.destino_texto,
            valor_bruto: data.valor_bruto,
            precio_custodio: data.precio_custodio,
          }
        };
      }

      return { exists: false };
    } catch (err) {
      console.error('Error checking for inverse route:', err);
      return { exists: false };
    }
  }, []);

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

      // Insert route (margen_neto_calculado se calcula automáticamente por PostgreSQL)
      const { data: newRoute, error } = await supabase
        .from('matriz_precios_rutas')
        .insert({
          cliente_nombre: data.cliente_nombre,
          origen_texto: data.origen_texto,
          destino_texto: data.destino_texto,
          valor_bruto: data.precio_sugerido,
          precio_custodio: data.precio_custodio,
          distancia_km: data.distancia_km || null,
          tipo_servicio: data.tipo_servicio || 'ARMADA',
          costo_operativo: data.costo_operativo || null,
          pago_custodio_sin_arma: data.pago_custodio_sin_arma || null,
          activo: true,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation with detailed context
        if (error.code === '23505') {
          // Buscar la ruta existente para dar contexto
          const { data: existingRoute } = await supabase
            .from('matriz_precios_rutas')
            .select('id, origen_texto, destino_texto')
            .ilike('cliente_nombre', data.cliente_nombre)
            .ilike('origen_texto', data.origen_texto)
            .ilike('destino_texto', data.destino_texto)
            .eq('activo', true)
            .maybeSingle();

          if (existingRoute) {
            // La ruta exacta ya existe
            setCreationError(
              `Esta ruta exacta ya existe: "${existingRoute.origen_texto} → ${existingRoute.destino_texto}". ` +
              `Usa la ruta existente desde el buscador.`
            );
          } else {
            // Verificar si es por ruta inversa
            const inverseCheck = await checkForInverseRoute(
              data.cliente_nombre,
              data.origen_texto,
              data.destino_texto
            );

            if (inverseCheck.exists && inverseCheck.route) {
              setCreationError(
                `Existe la ruta inversa: "${inverseCheck.route.origen_texto} → ${inverseCheck.route.destino_texto}". ` +
                `Puedes crear esta nueva ruta, pero verifica que no hay conflictos de datos.`
              );
            } else {
              setCreationError('Ya existe una ruta similar. Verifica los datos ingresados.');
            }
          }
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
        precio_sugerido: newRoute.valor_bruto,
        precio_custodio: newRoute.precio_custodio,
        pago_custodio_sin_arma: newRoute.pago_custodio_sin_arma,
        costo_operativo: newRoute.costo_operativo,
        margen_estimado: newRoute.margen_neto_calculado,
        distancia_km: newRoute.distancia_km,
        tipo_servicio: newRoute.tipo_servicio,
        incluye_armado: newRoute.tipo_servicio === 'ARMADA',
        es_ruta_reparto: newRoute.es_ruta_reparto || false,
      };

      setIsCreating(false);
      return pricingResult;

    } catch (err) {
      console.error('Error creating route:', err);
      setCreationError('Error inesperado al crear la ruta');
      setIsCreating(false);
      return null;
    }
  }, [checkForInverseRoute]);

  const clearError = useCallback(() => {
    setCreationError(null);
  }, []);

  return {
    createRoute,
    checkForInverseRoute,
    isCreating,
    creationError,
    clearError,
  };
}
