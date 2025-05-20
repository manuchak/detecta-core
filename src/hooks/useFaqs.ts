
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  created_at?: string;
}

export type FaqInput = Omit<Faq, 'id' | 'created_at'>;

export const useFaqs = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        throw error;
      }

      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las preguntas frecuentes. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createFaq = async (faq: FaqInput) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert([faq])
        .select()
        .single();

      if (error) throw error;

      setFaqs((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  };

  const updateFaq = async (id: string, faq: Partial<FaqInput>) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .update(faq)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFaqs((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      return data;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);

      if (error) throw error;

      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  };

  // Fetch FAQs on component mount
  useEffect(() => {
    fetchFaqs();
  }, []);

  return {
    faqs,
    loading,
    fetchFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
  };
};
