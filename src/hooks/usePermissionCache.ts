import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Cache global de permisos para evitar múltiples llamadas
let permissionCache: { [key: string]: boolean } = {};
let permissionPromises: { [key: string]: Promise<boolean> } = {};

export const usePermissionCache = (permission: string) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    // Si ya está en cache, retornarlo inmediatamente
    if (permissionCache[permission] !== undefined) {
      return permissionCache[permission];
    }

    // Si ya hay una promesa pendiente, esperar a que se resuelva
    if (permissionPromises[permission]) {
      return permissionPromises[permission];
    }

    // Crear nueva promesa para el permiso
    permissionPromises[permission] = (async () => {
      try {
        const { data, error } = await supabase.rpc(permission as any);
        if (error) throw error;
        
        // Guardar en cache por 5 minutos
        permissionCache[permission] = data;
        setTimeout(() => {
          delete permissionCache[permission];
        }, 5 * 60 * 1000);
        
        return data;
      } catch (error) {
        console.error(`Error checking permission ${permission}:`, error);
        return false;
      } finally {
        // Limpiar la promesa pendiente
        delete permissionPromises[permission];
      }
    })();

    return permissionPromises[permission];
  }, [permission]);

  useEffect(() => {
    const loadPermission = async () => {
      setIsLoading(true);
      try {
        const result = await checkPermission();
        setHasPermission(result);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermission();
  }, [checkPermission]);

  return { hasPermission: hasPermission ?? false, isLoading, refetch: checkPermission };
};

// Hook específico para permisos de planeación
export const usePlaneacionPermissions = () => {
  return usePermissionCache('puede_acceder_planeacion');
};