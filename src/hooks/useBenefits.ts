
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks';
import { supabase } from '@/integrations/supabase/client';

export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export function useBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Default benefits for initialization
  const defaultBenefits = [
    {
      title: 'Ingresos Competitivos',
      description: 'Gana dinero extra con pagos atractivos por cada servicio de custodia completado.',
      icon: 'DollarSign',
      order: 1
    },
    {
      title: 'Horarios Flexibles',
      description: 'Trabaja cuando puedas. Tú decides cuándo y cuántos servicios tomar.',
      icon: 'Clock',
      order: 2
    },
    {
      title: 'Equipo y Capacitación',
      description: 'Recibe todo el equipo necesario y capacitación profesional para realizar tu trabajo.',
      icon: 'Shield',
      order: 3
    },
    {
      title: 'Crecimiento Profesional',
      description: 'Desarrolla habilidades valoradas en el mercado y construye una carrera en seguridad.',
      icon: 'Briefcase',
      order: 4
    }
  ];

  // Fetch benefits from the database
  const fetchBenefits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .order('order');
      
      if (error) throw new Error(error.message);
      
      if (data && data.length > 0) {
        setBenefits(data as Benefit[]);
      } else {
        // If no benefits exist, initialize with defaults
        await initializeBenefits();
      }
    } catch (err) {
      console.error("Error fetching benefits:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los beneficios.',
        variant: 'destructive',
      });
      // Use default benefits in case of error
      setBenefits(defaultBenefits as Benefit[]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize benefits with default values
  const initializeBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from('benefits')
        .insert(defaultBenefits)
        .select();

      if (error) throw new Error(error.message);
      
      if (data) {
        setBenefits(data as Benefit[]);
      }
      
      toast({
        title: 'Beneficios inicializados',
        description: 'Se han creado los beneficios predeterminados.',
      });
    } catch (err) {
      console.error("Error initializing benefits:", err);
      toast({
        title: 'Error',
        description: 'No se pudieron inicializar los beneficios.',
        variant: 'destructive',
      });
      // Use default benefits in case of error
      setBenefits(defaultBenefits as Benefit[]);
    }
  };

  // Create a new benefit
  const createBenefit = async (benefit: Omit<Benefit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('benefits')
        .insert([benefit])
        .select();
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setBenefits([...benefits, data[0] as Benefit]);
        toast({
          title: 'Beneficio creado',
          description: 'El beneficio ha sido creado exitosamente.',
        });
        return data[0] as Benefit;
      }
    } catch (err) {
      console.error("Error creating benefit:", err);
      toast({
        title: 'Error',
        description: 'No se pudo crear el beneficio.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Update an existing benefit
  const updateBenefit = async (id: string, updates: Partial<Omit<Benefit, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('benefits')
        .update(updates)
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      setBenefits(
        benefits.map((benefit) => (benefit.id === id ? { ...benefit, ...updates } : benefit))
      );
      
      toast({
        title: 'Beneficio actualizado',
        description: 'El beneficio ha sido actualizado exitosamente.',
      });
    } catch (err) {
      console.error("Error updating benefit:", err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el beneficio.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Delete a benefit
  const deleteBenefit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('benefits')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      setBenefits(benefits.filter((benefit) => benefit.id !== id));
      
      toast({
        title: 'Beneficio eliminado',
        description: 'El beneficio ha sido eliminado exitosamente.',
      });
    } catch (err) {
      console.error("Error deleting benefit:", err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el beneficio.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Update the order of benefits
  const reorderBenefits = async (reorderedBenefits: Benefit[]) => {
    try {
      // Update local state first for immediate UI feedback
      setBenefits(reorderedBenefits);
      
      // Update the order in the database
      for (let i = 0; i < reorderedBenefits.length; i++) {
        const benefit = reorderedBenefits[i];
        const { error } = await supabase
          .from('benefits')
          .update({ order: i + 1 })
          .eq('id', benefit.id);
          
        if (error) throw new Error(error.message);
      }
      
      toast({
        title: 'Orden actualizado',
        description: 'El orden de los beneficios ha sido actualizado.',
      });
    } catch (err) {
      console.error("Error reordering benefits:", err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el orden de los beneficios.',
        variant: 'destructive',
      });
      // Refresh benefits to ensure consistency
      fetchBenefits();
      throw err;
    }
  };

  // Load benefits on component mount
  useEffect(() => {
    fetchBenefits();
  }, []);

  return {
    benefits,
    loading,
    error,
    fetchBenefits,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    reorderBenefits
  };
}
