import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerifyDocumentParams {
  docId: string;
  verificado: boolean;
  verificadoPor: string;
  notas?: string;
}

interface RejectDocumentParams {
  docId: string;
  motivoRechazo: string;
  rechazadoPor: string;
}

export function useVerifyDocument(telefono: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, verificado, verificadoPor, notas }: VerifyDocumentParams) => {
      const updateData: Record<string, unknown> = {
        verificado,
        verificado_por: verificadoPor,
        fecha_verificacion: new Date().toISOString(),
        notas: notas || null
      };
      // Al verificar, limpiar estado de rechazo
      if (verificado) {
        updateData.rechazado = false;
        updateData.motivo_rechazo = null;
        updateData.rechazado_por = null;
        updateData.fecha_rechazo = null;
      }
      const { data, error } = await supabase
        .from('documentos_custodio')
        .update(updateData)
        .eq('id', docId)
        .select('id')
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No se pudo verificar el documento — operación bloqueada por permisos');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custodian-docs-profile', telefono] });
      toast.success(
        variables.verificado 
          ? 'Documento verificado correctamente' 
          : 'Documento marcado como no verificado'
      );
    },
    onError: (error) => {
      console.error('Error verifying document:', error);
      toast.error('Error al actualizar el documento');
    }
  });
}

export function useRejectDocument(telefono: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, motivoRechazo, rechazadoPor }: RejectDocumentParams) => {
      const { data, error } = await supabase
        .from('documentos_custodio')
        .update({
          rechazado: true,
          verificado: false,
          motivo_rechazo: motivoRechazo,
          rechazado_por: rechazadoPor,
          fecha_rechazo: new Date().toISOString()
        })
        .eq('id', docId)
        .select('id')
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No se pudo rechazar el documento — operación bloqueada por permisos');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-docs-profile', telefono] });
      toast.success('Documento rechazado');
    },
    onError: (error) => {
      console.error('Error rejecting document:', error);
      toast.error('Error al rechazar el documento');
    }
  });
}
