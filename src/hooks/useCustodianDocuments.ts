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
      if (!custodioTelefono) throw new Error('No se encontró número de teléfono');

      // Sanitizar teléfono para ruta de archivo (remover espacios y caracteres especiales)
      const sanitizedPhone = custodioTelefono.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
      
      // Validar que tenga al menos 8 dígitos (teléfono válido)
      const digitsOnly = sanitizedPhone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 8) {
        throw new Error('Tu número de teléfono no es válido. Por favor actualiza tu perfil.');
      }
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `documentos/${sanitizedPhone}/${tipoDocumento}_${Date.now()}.${fileExt}`;

      // 1. Subir archivo con validación
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('checklist-evidencias')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Error al subir foto: ${uploadError.message}`);
      }

      // 2. Verificar que el archivo existe
      const { data: fileCheck } = await supabase.storage
        .from('checklist-evidencias')
        .list(`documentos/${sanitizedPhone}`, {
          search: `${tipoDocumento}_`
        });

      if (!fileCheck || fileCheck.length === 0) {
        throw new Error('La foto no se guardó correctamente. Por favor intenta de nuevo.');
      }

      // 3. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('checklist-evidencias')
        .getPublicUrl(fileName);

      // 4. Guardar en base de datos
      const { error: dbError } = await supabase
        .from('documentos_custodio')
        .upsert(
          {
            custodio_telefono: custodioTelefono, // Original con formato
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
            fecha_vigencia: fechaVigencia,
            foto_url: urlData.publicUrl,
            verificado: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'custodio_telefono,tipo_documento' }
        );

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Error al guardar registro: ${dbError.message}`);
      }

      return { url: urlData.publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['custodian-documents', custodioTelefono],
      });
      toast.success('¡Documento guardado correctamente!', {
        description: 'La foto se subió y el registro fue creado.',
        duration: 4000
      });
    },
    onError: (error: Error) => {
      console.error('Error updating document:', error);
      toast.error('Error al guardar documento', {
        description: error.message || 'Por favor verifica tu conexión e intenta de nuevo.',
        duration: 5000
      });
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