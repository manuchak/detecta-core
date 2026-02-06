import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerifyDocumentParams {
  docId: string;
  verificado: boolean;
  verificadoPor: string;
  notas?: string;
}

export function useVerifyDocument(telefono: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, verificado, verificadoPor, notas }: VerifyDocumentParams) => {
      const { data, error } = await supabase
        .from('documentos_custodio')
        .update({
          verificado,
          verificado_por: verificadoPor,
          fecha_verificacion: new Date().toISOString(),
          notas: notas || null
        })
        .eq('id', docId)
        .select()
        .single();
      
      if (error) throw error;
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
