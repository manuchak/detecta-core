
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface HeroSettings {
  title: string;
  subtitle: string;
  ctaButtonText: string;
  secondaryButtonText: string;
  imageUrl: string;
}

// Clave para almacenamiento en localStorage
const LOCAL_STORAGE_KEY = 'landing_hero_settings';

// Evento personalizado para sincronización
const HERO_UPDATE_EVENT = 'hero_settings_update';

export const useHeroSettings = () => {
  const queryClient = useQueryClient();

  // Escuchar los cambios de otras instancias o componentes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY) {
        // Invalidar la caché cuando cambie localStorage desde otra pestaña
        queryClient.invalidateQueries({ queryKey: ['heroSettings'] });
      }
    };

    const handleCustomEvent = () => {
      // Invalidar la caché cuando se dispare el evento personalizado
      queryClient.invalidateQueries({ queryKey: ['heroSettings'] });
    };

    // Escuchar cambios en localStorage (para cambios entre pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar el evento personalizado (para cambios dentro de la misma pestaña)
    window.addEventListener(HERO_UPDATE_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(HERO_UPDATE_EVENT, handleCustomEvent);
    };
  }, [queryClient]);

  // Consulta para obtener los ajustes del hero
  const { data: heroSettings, isLoading, error, refetch } = useQuery({
    queryKey: ['heroSettings'],
    queryFn: async () => {
      try {
        // Intentar obtener de localStorage primero
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        if (storedData) {
          return JSON.parse(storedData) as HeroSettings;
        }
        
        // Si no hay datos, devolver configuración predeterminada
        const defaultSettings: HeroSettings = {
          title: 'Sé parte del equipo de Custodios Elite',
          subtitle: 'Genera ingresos extra protegiendo envíos y bienes valiosos. Flexibilidad, pagos atractivos y crecimiento profesional.',
          ctaButtonText: 'Regístrate ahora',
          secondaryButtonText: 'Conoce más',
          imageUrl: 'https://images.unsplash.com/photo-1564477053957-6c4a3e278269?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2274&q=80'
        };
        
        // Guardar la configuración predeterminada en localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSettings));
        
        return defaultSettings;
      } catch (error) {
        console.error('Error fetching hero settings:', error);
        throw error;
      }
    },
    // Configuración de refresco
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 30, // 30 segundos
  });

  // Mutación para guardar configuración
  const saveHeroSettings = useMutation({
    mutationFn: async (settings: HeroSettings) => {
      try {
        // Guardar en localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        
        // Disparar evento personalizado para notificar a otros componentes
        window.dispatchEvent(new CustomEvent(HERO_UPDATE_EVENT));
        
        return settings;
      } catch (error) {
        console.error('Error saving hero settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar y volver a solicitar
      queryClient.invalidateQueries({ queryKey: ['heroSettings'] });
    },
  });

  return {
    heroSettings: heroSettings || {
      title: '',
      subtitle: '',
      ctaButtonText: '',
      secondaryButtonText: '',
      imageUrl: ''
    },
    isLoading,
    error,
    refetch,
    saveHeroSettings
  };
};
