import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EsquemaPagoArmado {
  id: string;
  nombre_esquema: string;
  tipo_esquema: string;
  configuracion: {
    tarifa_base_12h: number;
    tarifa_hora_extra: number;
    viaticos_diarios: number;
    horas_base_incluidas: number;
    aplica_viaticos_foraneos: boolean;
  };
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEsquemaData {
  nombre_esquema: string;
  tipo_esquema: string;
  configuracion: {
    tarifa_base_12h: number;
    tarifa_hora_extra: number;
    viaticos_diarios: number;
    horas_base_incluidas: number;
    aplica_viaticos_foraneos: boolean;
  };
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateEsquemaData extends CreateEsquemaData {
  id: string;
}

export function useEsquemasArmados() {
  const [esquemas, setEsquemas] = useState<EsquemaPagoArmado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadEsquemas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('esquemas_pago_armados')
        .select('*')
        .order('nombre_esquema');

      if (fetchError) throw fetchError;

      setEsquemas(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar esquemas';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const createEsquema = async (esquemaData: CreateEsquemaData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('esquemas_pago_armados')
        .insert([{
          nombre_esquema: esquemaData.nombre_esquema,
          tipo_esquema: esquemaData.tipo_esquema,
          configuracion: esquemaData.configuracion,
          descripcion: esquemaData.descripcion,
          activo: esquemaData.activo ?? true,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Esquema creado',
        description: `Se creó el esquema "${esquemaData.nombre_esquema}" exitosamente.`,
      });

      await loadEsquemas();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear esquema';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      throw err;
    }
  };

  const updateEsquema = async (esquemaData: UpdateEsquemaData) => {
    try {
      const { error: updateError } = await supabase
        .from('esquemas_pago_armados')
        .update({
          nombre_esquema: esquemaData.nombre_esquema,
          tipo_esquema: esquemaData.tipo_esquema,
          configuracion: esquemaData.configuracion,
          descripcion: esquemaData.descripcion,
          activo: esquemaData.activo,
        })
        .eq('id', esquemaData.id);

      if (updateError) throw updateError;

      toast({
        title: 'Esquema actualizado',
        description: `Se actualizó el esquema "${esquemaData.nombre_esquema}" exitosamente.`,
      });

      await loadEsquemas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar esquema';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      throw err;
    }
  };

  const deleteEsquema = async (id: string) => {
    try {
      // Verificar si hay proveedores usando este esquema
      const { data: proveedores, error: checkError } = await supabase
        .from('proveedores_armados')
        .select('id, nombre_empresa')
        .eq('esquema_pago_id', id);

      if (checkError) throw checkError;

      if (proveedores && proveedores.length > 0) {
        toast({
          variant: 'destructive',
          title: 'No se puede eliminar',
          description: `Este esquema está siendo usado por ${proveedores.length} proveedor(es). Desactívalo en su lugar.`,
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from('esquemas_pago_armados')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Esquema eliminado',
        description: 'El esquema se eliminó exitosamente.',
      });

      await loadEsquemas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar esquema';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      throw err;
    }
  };

  const getEsquemaById = (id: string): EsquemaPagoArmado | undefined => {
    return esquemas.find(e => e.id === id);
  };

  const getEsquemaEstandar = (): EsquemaPagoArmado | undefined => {
    return esquemas.find(e => e.nombre_esquema.toLowerCase().includes('estándar') || e.nombre_esquema.toLowerCase().includes('estandar'));
  };

  useEffect(() => {
    loadEsquemas();
  }, []);

  return {
    esquemas,
    loading,
    error,
    loadEsquemas,
    createEsquema,
    updateEsquema,
    deleteEsquema,
    getEsquemaById,
    getEsquemaEstandar,
  };
}
