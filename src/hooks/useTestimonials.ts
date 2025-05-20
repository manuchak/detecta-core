
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  text: string;
  avatar_url?: string;
  image?: string; // Para compatibilidad con versiones anteriores
  quote?: string; // Para compatibilidad con versiones anteriores
  rating?: number; // Valoración de 1-5 estrellas
}

// Por ahora usaremos localStorage, en una aplicación real esto sería Supabase o una API
const LOCAL_STORAGE_KEY = 'landing_testimonials';

// Creamos un evento personalizado para sincronización entre pestañas/componentes
const TESTIMONIAL_UPDATE_EVENT = 'testimonial_update';

export const useTestimonials = () => {
  const queryClient = useQueryClient();

  // Escuchar los cambios de otras instancias o componentes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY) {
        // Invalidar la caché cuando cambie localStorage desde otra pestaña
        queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      }
    };

    const handleCustomEvent = () => {
      // Invalidar la caché cuando se dispare el evento personalizado
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    };

    // Escuchar cambios en localStorage (para cambios entre pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar el evento personalizado (para cambios dentro de la misma pestaña)
    window.addEventListener(TESTIMONIAL_UPDATE_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(TESTIMONIAL_UPDATE_EVENT, handleCustomEvent);
    };
  }, [queryClient]);

  // Consulta para obtener los testimonios
  const { data: testimonials, isLoading, error, refetch } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      try {
        // Intentar obtener de localStorage primero
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        if (storedData) {
          return JSON.parse(storedData) as Testimonial[];
        }
        
        // Si no hay datos en localStorage, devolver testimonios predeterminados
        const defaultTestimonials = [
          {
            id: 1,
            name: 'Carlos Mendoza',
            role: 'Custodio desde 2022',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            quote: 'Ser custodio me ha permitido generar ingresos extras mientras mantengo mi trabajo principal. La flexibilidad de horarios es inmejorable y el pago es muy competitivo.',
            rating: 5
          },
          {
            id: 2,
            name: 'Alejandra Torres',
            role: 'Custodia desde 2023',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            quote: 'La capacitación que recibí fue excelente y me siento segura en cada servicio. La aplicación hace que coordinar mis horarios sea muy sencillo.',
            rating: 4
          },
          {
            id: 3,
            name: 'Martín Gutiérrez',
            role: 'Custodio desde 2021',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            quote: 'Lo que más valoro es la comunidad que se ha formado entre custodios. Nos apoyamos mutuamente y la empresa siempre está atenta a nuestras necesidades.',
            rating: 5
          }
        ];
        
        // Guardar los testimonios predeterminados en localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultTestimonials));
        
        return defaultTestimonials;
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }
    },
    // Configuración de refresco
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 30, // 30 segundos (reducido para mayor sincronización)
  });

  // Mutación para guardar testimonio
  const saveTestimonial = useMutation({
    mutationFn: async (testimonial: Partial<Testimonial>) => {
      try {
        // Obtener los testimonios existentes
        const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const existingTestimonials: Testimonial[] = existingData ? JSON.parse(existingData) : [];
        
        let updatedTestimonials: Testimonial[];
        
        if (testimonial.id) {
          // Actualizar testimonio existente
          updatedTestimonials = existingTestimonials.map(item => 
            item.id === testimonial.id ? { ...item, ...testimonial } : item
          );
        } else {
          // Añadir nuevo testimonio con ID generado
          const newId = Math.max(0, ...existingTestimonials.map(t => t.id || 0)) + 1;
          const newTestimonial = {
            ...testimonial,
            id: newId,
          } as Testimonial;
          
          updatedTestimonials = [...existingTestimonials, newTestimonial];
        }
        
        // Guardar en localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTestimonials));
        
        // Disparar evento personalizado para notificar a otros componentes
        window.dispatchEvent(new CustomEvent(TESTIMONIAL_UPDATE_EVENT));
        
        return testimonial.id ? testimonial : { ...testimonial, id: updatedTestimonials[updatedTestimonials.length - 1].id };
      } catch (error) {
        console.error('Error saving testimonial:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar y volver a solicitar
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });

  // Mutación para eliminar testimonio
  const deleteTestimonial = useMutation({
    mutationFn: async (id: number) => {
      try {
        // Obtener los testimonios existentes
        const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!existingData) return id;
        
        const existingTestimonials: Testimonial[] = JSON.parse(existingData);
        
        // Filtrar el testimonio eliminado
        const updatedTestimonials = existingTestimonials.filter(item => item.id !== id);
        
        // Guardar en localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTestimonials));
        
        // Disparar evento personalizado para notificar a otros componentes
        window.dispatchEvent(new CustomEvent(TESTIMONIAL_UPDATE_EVENT));
        
        return id;
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar y volver a solicitar
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });

  return {
    testimonials: testimonials || [],
    isLoading,
    error,
    refetch,
    saveTestimonial,
    deleteTestimonial
  };
};
