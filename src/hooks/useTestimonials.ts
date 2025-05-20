
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  text: string;
  avatar_url?: string;
  image?: string; // For backward compatibility
  quote?: string; // For backward compatibility
}

// For now we'll use local storage, in a real app this would be Supabase or an API
const LOCAL_STORAGE_KEY = 'landing_testimonials';

export const useTestimonials = () => {
  const queryClient = useQueryClient();

  // Fetch testimonials
  const { data: testimonials, isLoading, error, refetch } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      try {
        // Try to get from localStorage first
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        if (storedData) {
          return JSON.parse(storedData) as Testimonial[];
        }
        
        // If no data in localStorage, return default testimonials
        const defaultTestimonials = [
          {
            id: 1,
            name: 'Carlos Mendoza',
            role: 'Custodio desde 2022',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            quote: 'Ser custodio me ha permitido generar ingresos extras mientras mantengo mi trabajo principal. La flexibilidad de horarios es inmejorable y el pago es muy competitivo.'
          },
          {
            id: 2,
            name: 'Alejandra Torres',
            role: 'Custodia desde 2023',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            quote: 'La capacitación que recibí fue excelente y me siento segura en cada servicio. La aplicación hace que coordinar mis horarios sea muy sencillo.'
          },
          {
            id: 3,
            name: 'Martín Gutiérrez',
            role: 'Custodio desde 2021',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            quote: 'Lo que más valoro es la comunidad que se ha formado entre custodios. Nos apoyamos mutuamente y la empresa siempre está atenta a nuestras necesidades.'
          }
        ];
        
        // Store default testimonials in localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultTestimonials));
        
        return defaultTestimonials;
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }
    },
    // Disable automatic refetching to prevent potential render loops
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Save testimonial mutation
  const saveTestimonial = useMutation({
    mutationFn: async (testimonial: Partial<Testimonial>) => {
      try {
        // Get existing testimonials
        const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const existingTestimonials: Testimonial[] = existingData ? JSON.parse(existingData) : [];
        
        let updatedTestimonials: Testimonial[];
        
        if (testimonial.id) {
          // Update existing testimonial
          updatedTestimonials = existingTestimonials.map(item => 
            item.id === testimonial.id ? { ...item, ...testimonial } : item
          );
        } else {
          // Add new testimonial with generated ID
          const newId = Math.max(0, ...existingTestimonials.map(t => t.id || 0)) + 1;
          const newTestimonial = {
            ...testimonial,
            id: newId,
          } as Testimonial;
          
          updatedTestimonials = [...existingTestimonials, newTestimonial];
        }
        
        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTestimonials));
        
        return testimonial.id ? testimonial : { ...testimonial, id: updatedTestimonials[updatedTestimonials.length - 1].id };
      } catch (error) {
        console.error('Error saving testimonial:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });

  // Delete testimonial mutation
  const deleteTestimonial = useMutation({
    mutationFn: async (id: number) => {
      try {
        // Get existing testimonials
        const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!existingData) return id;
        
        const existingTestimonials: Testimonial[] = JSON.parse(existingData);
        
        // Filter out deleted testimonial
        const updatedTestimonials = existingTestimonials.filter(item => item.id !== id);
        
        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTestimonials));
        
        return id;
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
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
