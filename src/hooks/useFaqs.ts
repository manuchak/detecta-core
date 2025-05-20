
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

export type FaqInput = {
  question: string;
  answer: string;
  order: number;
};

export const useFaqs = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      // Use the fallback data directly since the table doesn't exist yet
      setFaqs([
        {
          id: '1',
          question: "¿Qué requisitos necesito para ser custodio?",
          answer: "Necesitas ser mayor de edad, tener antecedentes limpios, completar nuestra capacitación y contar con un smartphone compatible con nuestra aplicación.",
          order: 1
        },
        {
          id: '2',
          question: "¿Cómo se asignan los servicios de custodia?",
          answer: "Los servicios se asignan según tu ubicación, disponibilidad y nivel de experiencia a través de nuestra plataforma. Puedes aceptar o rechazar según tu conveniencia.",
          order: 2
        },
        {
          id: '3',
          question: "¿Qué tipo de capacitación proporcionan?",
          answer: "Ofrecemos una capacitación completa que incluye protocolos de seguridad, manejo de situaciones de riesgo, primeros auxilios básicos y uso de nuestras herramientas tecnológicas.",
          order: 3
        }
      ]);
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
      // Generate a unique ID for now
      const newFaq: Faq = {
        id: Math.random().toString(36).substring(2, 11),
        ...faq
      };
      
      setFaqs((prev) => [...prev, newFaq]);
      return newFaq;
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  };

  const updateFaq = async (id: string, faq: Partial<FaqInput>) => {
    try {
      // Find and update the FAQ in our local state
      const updatedFaq = faqs.find(item => item.id === id);
      
      if (!updatedFaq) {
        throw new Error(`FAQ with ID ${id} not found`);
      }
      
      const newFaq: Faq = {
        ...updatedFaq,
        ...(faq as Partial<Faq>)
      };

      setFaqs((prev) =>
        prev.map((item) => (item.id === id ? newFaq : item))
      );
      
      return newFaq;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  };

  const deleteFaq = async (id: string) => {
    try {
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
