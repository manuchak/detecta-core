
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks';

export interface Price {
  id: string;
  name: string;
  earnings: string;
  period: string;
  description: string;
  cta: string;
  popular: boolean;
  features?: string[];
  order: number;
  created_at?: string;
}

export type PriceInput = {
  name: string;
  earnings: string;
  period: string;
  description: string;
  cta: string;
  popular: boolean;
  order: number;
};

export const usePrices = () => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Datos de ejemplo para features
  const defaultFeatures = {
    basic: [
      'Hasta 15 servicios mensuales',
      'Capacitación básica',
      'Equipo estándar',
      'Soporte por app'
    ],
    pro: [
      'Hasta 30 servicios mensuales',
      'Capacitación avanzada',
      'Equipo premium',
      'Servicios de mayor valor',
      'Prioridad en asignaciones',
      'Bonificaciones por excelencia'
    ]
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      // Use the fallback data directly since the table doesn't exist yet
      setPrices([
        {
          id: '1',
          name: 'Custodio Inicial',
          earnings: '$5,000 - $10,000',
          period: 'mensuales',
          description: 'Para custodios que están comenzando',
          features: defaultFeatures.basic,
          cta: 'Comenzar Ahora',
          popular: false,
          order: 1
        },
        {
          id: '2',
          name: 'Custodio Profesional',
          earnings: '$12,000 - $20,000',
          period: 'mensuales',
          description: 'Para custodios con experiencia',
          features: defaultFeatures.pro,
          cta: 'Únete como Profesional',
          popular: true,
          order: 2
        }
      ]);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los precios. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPrice = async (price: PriceInput) => {
    try {
      // Generate a unique ID for now
      const newPrice: Price = {
        id: Math.random().toString(36).substring(2, 11),
        ...price,
        features: price.popular ? defaultFeatures.pro : defaultFeatures.basic
      };
      
      setPrices((prev) => [...prev, newPrice]);
      return newPrice;
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
    }
  };

  const updatePrice = async (id: string, price: Partial<PriceInput>) => {
    try {
      // Find and update the Price in our local state
      const updatedPrice = prices.find(item => item.id === id);
      
      if (!updatedPrice) {
        throw new Error(`Price with ID ${id} not found`);
      }

      const isPopularChanged = 
        price.popular !== undefined && price.popular !== updatedPrice.popular;
      
      const newPrice: Price = {
        ...updatedPrice,
        ...(price as Partial<Price>),
        // Update features if popular status changed
        features: isPopularChanged
          ? (price.popular ? defaultFeatures.pro : defaultFeatures.basic)
          : updatedPrice.features
      };

      setPrices((prev) =>
        prev.map((item) => (item.id === id ? newPrice : item))
      );
      
      return newPrice;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  };

  const deletePrice = async (id: string) => {
    try {
      // Importante: Asegurarse de actualizar el estado local correctamente
      setPrices((prev) => prev.filter((price) => price.id !== id));
      
      // Mostrar toast de confirmación
      toast({
        title: "Plan eliminado",
        description: "El plan ha sido eliminado correctamente.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting price:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el plan. Inténtalo de nuevo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fetch prices on component mount
  useEffect(() => {
    fetchPrices();
  }, []);

  return {
    prices,
    loading,
    fetchPrices,
    createPrice,
    updatePrice,
    deletePrice,
  };
};
