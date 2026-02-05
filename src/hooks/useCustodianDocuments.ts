 /**
  * Hook para gestionar documentos del custodio con vigencias
  * Incluye detección de documentos vencidos y por vencer
  */
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import type {
   DocumentoCustodio,
   TipoDocumentoCustodio,
 } from '@/types/checklist';
 
 export function useCustodianDocuments(custodioTelefono: string | undefined) {
   const queryClient = useQueryClient();
 
   const query = useQuery({
     queryKey: ['custodian-documents', custodioTelefono],
     queryFn: async () => {
       if (!custodioTelefono) return [];
 
       const { data, error } = await supabase
         .from('documentos_custodio')
         .select('*')
         .eq('custodio_telefono', custodioTelefono)
         .order('tipo_documento');
 
       if (error) throw error;
       return data as DocumentoCustodio[];
     },
     enabled: !!custodioTelefono,
     staleTime: 5 * 60 * 1000,
   });
 
   const updateDocument = useMutation({
     mutationFn: async ({
       tipoDocumento,
       file,
       fechaVigencia,
       numeroDocumento,
     }: {
       tipoDocumento: TipoDocumentoCustodio;
       file: File;
       fechaVigencia: string;
       numeroDocumento?: string;
     }) => {
       if (!custodioTelefono) throw new Error('No phone');
 
       const fileExt = file.name.split('.').pop();
       const fileName = `${custodioTelefono}/${tipoDocumento}_${Date.now()}.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from('checklist-evidencias')
         .upload(`documentos/${fileName}`, file, { upsert: true });
 
       if (uploadError) throw uploadError;
 
       const { data: urlData } = supabase.storage
         .from('checklist-evidencias')
         .getPublicUrl(`documentos/${fileName}`);
 
       const { error: dbError } = await supabase
         .from('documentos_custodio')
         .upsert(
           {
             custodio_telefono: custodioTelefono,
             tipo_documento: tipoDocumento,
             numero_documento: numeroDocumento,
             fecha_vigencia: fechaVigencia,
             foto_url: urlData.publicUrl,
             verificado: false,
             updated_at: new Date().toISOString(),
           },
           { onConflict: 'custodio_telefono,tipo_documento' }
         );
 
       if (dbError) throw dbError;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({
         queryKey: ['custodian-documents', custodioTelefono],
       });
       toast.success('Documento actualizado');
     },
     onError: (error) => {
       console.error('Error updating document:', error);
       toast.error('Error al actualizar documento');
     },
   });
 
   const getExpiredDocuments = () => {
     if (!query.data) return [];
     const today = new Date().toISOString().split('T')[0];
     return query.data.filter((doc) => doc.fecha_vigencia < today);
   };
 
   const getExpiringDocuments = (days: number = 30) => {
     if (!query.data) return [];
     const today = new Date();
     const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
       .toISOString()
       .split('T')[0];
     const todayStr = today.toISOString().split('T')[0];
 
     return query.data.filter(
       (doc) =>
         doc.fecha_vigencia >= todayStr && doc.fecha_vigencia <= futureDate
     );
   };
 
   const hasExpiredDocuments = () => getExpiredDocuments().length > 0;
 
   const getDocumentByType = (tipo: TipoDocumentoCustodio) => {
     return query.data?.find((doc) => doc.tipo_documento === tipo);
   };
 
  const isDocumentExpired = (tipo: TipoDocumentoCustodio) => {
    const doc = getDocumentByType(tipo);
    if (!doc) return false;
    const today = new Date().toISOString().split('T')[0];
    return doc.fecha_vigencia < today;
  };

  /**
   * Obtiene documentos obligatorios faltantes
   */
  const getMissingDocuments = (requiredTypes: TipoDocumentoCustodio[]) => {
    if (!query.data) return requiredTypes;
    return requiredTypes.filter(
      tipo => !query.data?.find(doc => doc.tipo_documento === tipo)
    );
  };

  /**
   * Verifica si todos los documentos obligatorios existen y están vigentes
   */
  const hasAllRequiredDocuments = (requiredTypes: TipoDocumentoCustodio[]) => {
    const missing = getMissingDocuments(requiredTypes);
    const expired = getExpiredDocuments().filter(
      doc => requiredTypes.includes(doc.tipo_documento as TipoDocumentoCustodio)
    );
    return missing.length === 0 && expired.length === 0;
  };

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateDocument,
    getExpiredDocuments,
    getExpiringDocuments,
    hasExpiredDocuments,
    getDocumentByType,
    isDocumentExpired,
    getMissingDocuments,
    hasAllRequiredDocuments,
    refetch: query.refetch,
  };
}