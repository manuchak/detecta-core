
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

export type PriceInput = Omit<Price, 'id' | 'created_at'>;

export const usePrices = () => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        throw error;
      }

      setPrices(data || []);
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
      const { data, error } = await supabase
        .from('prices')
        .insert([price])
        .select()
        .single();

      if (error) throw error;

      setPrices((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
    }
  };

  const updatePrice = async (id: string, price: Partial<PriceInput>) => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .update(price)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPrices((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      return data;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  };

  const deletePrice = async (id: string) => {
    try {
      const { error } = await supabase.from('prices').delete().eq('id', id);

      if (error) throw error;

      setPrices((prev) => prev.filter((price) => price.id !== id));
    } catch (error) {
      console.error('Error deleting price:', error);
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
