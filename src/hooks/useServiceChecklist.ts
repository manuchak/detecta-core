 /**
  * Hook principal para gestionar el checklist de servicio
  * Maneja estado local, guardado offline y sincronización
  */
 import { useState, useCallback, useEffect } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
  import { toast } from 'sonner';
  import { useNetworkStatus } from './useNetworkStatus';
  import { withSmartRetry } from '@/lib/retryUtils';
 import {
   saveDraft,
   getDraft,
   deleteDraft,
   savePhotoBlob,
   getPhotosByServicio,
   addToSyncQueue,
   deletePhotoBlob,
 } from '@/lib/offlineStorage';
import { compressImage, needsCompression } from '@/lib/imageUtils';
import {
  getCurrentPositionSafe,
  validarUbicacionFoto,
} from '@/lib/geoUtils';
import { normalizePhone } from '@/lib/phoneUtils';
 import {
   type ChecklistServicio,
   type ItemsInspeccion,
   type FotoValidada,
   type AnguloFoto,
   type ValidacionGeo,
   DEFAULT_ITEMS_INSPECCION,
   GEO_CONFIG,
 } from '@/types/checklist';
 
 interface UseServiceChecklistOptions {
   servicioId: string;
   custodioTelefono: string;
   origenCoords?: { lat: number; lng: number } | null;
 }
 
export function useServiceChecklist({
  servicioId,
  custodioTelefono: rawTelefono,
  origenCoords,
}: UseServiceChecklistOptions) {
  const custodioTelefono = normalizePhone(rawTelefono);
   const queryClient = useQueryClient();
   const { isOnline } = useNetworkStatus();
 
   const [items, setItems] = useState<ItemsInspeccion>(DEFAULT_ITEMS_INSPECCION);
   const [fotos, setFotos] = useState<FotoValidada[]>([]);
   const [observaciones, setObservaciones] = useState('');
   const [firma, setFirma] = useState<string | null>(null);
   const [isSaving, setIsSaving] = useState(false);
   const [isLoadingDraft, setIsLoadingDraft] = useState(true);
 
   const existingChecklistQuery = useQuery({
     queryKey: ['service-checklist', servicioId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('checklist_servicio')
         .select('*')
         .eq('servicio_id', servicioId)
         .eq('custodio_telefono', custodioTelefono)
         .maybeSingle();
 
       if (error) throw error;
       return data as ChecklistServicio | null;
     },
     enabled: !!servicioId && !!custodioTelefono && isOnline,
   });
 
   // Cargar borrador offline o datos existentes
   useEffect(() => {
     const loadInitialData = async () => {
       setIsLoadingDraft(true);
 
       try {
         const draft = await getDraft(servicioId);
         if (draft) {
           setItems(draft.items);
           setObservaciones(draft.observaciones);
           if (draft.firma) setFirma(draft.firma);
 
           const localPhotos = await getPhotosByServicio(servicioId);
           if (localPhotos.length > 0) {
             setFotos(
               localPhotos.map((p) => ({
                 angle: p.angle,
                 localBlobId: p.id,
                 geotag_lat: p.geotagLat,
                 geotag_lng: p.geotagLng,
                 distancia_origen_m: p.distanciaOrigen,
                 validacion: p.validacion,
                 captured_at: p.capturedAt,
                 capturado_offline: true,
               }))
             );
           }
 
           setIsLoadingDraft(false);
           return;
         }
 
         if (existingChecklistQuery.data) {
           setItems(existingChecklistQuery.data.items_inspeccion);
           setFotos(existingChecklistQuery.data.fotos_validadas);
           setObservaciones(existingChecklistQuery.data.observaciones || '');
           setFirma(existingChecklistQuery.data.firma_base64 || null);
         }
       } catch (error) {
         console.error('[Checklist] Error loading initial data:', error);
       }
 
       setIsLoadingDraft(false);
     };
 
     loadInitialData();
   }, [servicioId, existingChecklistQuery.data]);
 
   // Auto-guardado de borrador cada 30 segundos
   useEffect(() => {
     const interval = setInterval(() => {
       saveDraft({
         servicioId,
         custodioPhone: custodioTelefono,
         items,
         observaciones,
         firma: firma || undefined,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       });
     }, 30000);
 
     return () => clearInterval(interval);
   }, [servicioId, custodioTelefono, items, observaciones, firma]);
 
   const updateItem = useCallback(
     (
       categoria: 'vehiculo' | 'equipamiento',
       key: string,
       value: boolean | string | null
     ) => {
       setItems((prev) => ({
         ...prev,
         [categoria]: {
           ...prev[categoria],
           [key]: value,
         },
       }));
     },
     []
   );
 
   const capturePhoto = useCallback(
     async (angle: AnguloFoto, file: File): Promise<FotoValidada> => {
        // Comprimir imagen si es necesario (>500KB)
        let processedFile: Blob = file;
        let mimeType = file.type;
        
        if (needsCompression(file)) {
          try {
            const compressed = await compressImage(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.7,
            });
            processedFile = compressed.blob;
            mimeType = 'image/jpeg';
            console.log(`[Checklist] Foto ${angle} comprimida: ${compressed.compressionRatio.toFixed(0)}% reducción`);
          } catch (compressionError) {
            console.warn('[Checklist] Error comprimiendo foto, usando original:', compressionError);
          }
        }

       const coords = await getCurrentPositionSafe();
 
       let distancia: number | null = null;
       let validacion: ValidacionGeo = 'pendiente';
 
       if (coords && origenCoords) {
         const result = validarUbicacionFoto(
           coords.lat,
           coords.lng,
           origenCoords.lat,
           origenCoords.lng
         );
         distancia = result.distancia;
         validacion =
           result.distancia === null
             ? 'sin_gps'
             : result.distancia <= GEO_CONFIG.TOLERANCIA_METROS
               ? 'ok'
               : 'fuera_rango';
        } else if (!coords) {
          validacion = 'sin_gps';
        } else {
          // GPS captured but no origin to compare - mark as ok
          validacion = 'ok';
        }
 
       const photoId = crypto.randomUUID();
       const newFoto: FotoValidada = {
         angle,
         localBlobId: photoId,
         geotag_lat: coords?.lat || null,
         geotag_lng: coords?.lng || null,
         distancia_origen_m: distancia,
         validacion,
         captured_at: new Date().toISOString(),
         capturado_offline: !isOnline,
       };
 
       await savePhotoBlob({
         id: photoId,
         servicioId,
         angle,
          blob: processedFile,
          mimeType,
         geotagLat: coords?.lat || null,
         geotagLng: coords?.lng || null,
         distanciaOrigen: distancia,
         validacion,
         capturedAt: newFoto.captured_at,
       });
 
       setFotos((prev) => {
         const filtered = prev.filter((f) => f.angle !== angle);
         return [...filtered, newFoto];
       });
 
       return newFoto;
     },
     [servicioId, origenCoords, isOnline]
   );
 
   const removePhoto = useCallback(
     async (angle: AnguloFoto) => {
       const foto = fotos.find((f) => f.angle === angle);
       if (foto?.localBlobId) {
         await deletePhotoBlob(foto.localBlobId);
       }
       setFotos((prev) => prev.filter((f) => f.angle !== angle));
     },
     [fotos]
   );
 
    const saveChecklist = useMutation({
      mutationFn: async () => {
        if (!firma) {
          throw new Error('La firma digital es obligatoria');
        }

        setIsSaving(true);

        const now = new Date().toISOString();
        const ubicacion = await getCurrentPositionSafe();

        const checklistData: Partial<ChecklistServicio> = {
          servicio_id: servicioId,
          custodio_telefono: custodioTelefono,
          estado: 'completo',
          items_inspeccion: items,
          fotos_validadas: fotos,
          observaciones,
          firma_base64: firma,
         ubicacion_lat: ubicacion?.lat,
         ubicacion_lng: ubicacion?.lng,
         fecha_captura_local: now,
         sincronizado_offline: !isOnline,
       };
 
        if (isOnline) {
          const fotosConUrl: FotoValidada[] = [];

          for (const foto of fotos) {
            if (foto.localBlobId) {
              const localPhotos = await getPhotosByServicio(servicioId);
              const localPhoto = localPhotos.find(
                (p) => p.id === foto.localBlobId
              );

              if (localPhoto) {
                const fileName = `${servicioId}/${foto.angle}_${Date.now()}.jpg`;

                const { error } = await supabase.storage
                  .from('checklist-evidencias')
                  .upload(fileName, localPhoto.blob, { upsert: true });

                if (error) throw error;

                const { data: urlData } = supabase.storage
                  .from('checklist-evidencias')
                  .getPublicUrl(fileName);

                fotosConUrl.push({
                  ...foto,
                  url: urlData.publicUrl,
                  localBlobId: undefined,
                });

                await deletePhotoBlob(localPhoto.id);
              }
            } else {
              fotosConUrl.push(foto);
            }
          }

          checklistData.fotos_validadas = fotosConUrl;
          checklistData.fecha_sincronizacion = now;
          checklistData.sincronizado_offline = false;

          // Save with retry for transient errors
          await withSmartRetry(
            async () => {
              const { error } = await supabase
                .from('checklist_servicio')
                .upsert(checklistData, {
                  onConflict: 'servicio_id,custodio_telefono',
                });

              if (error) {
                console.error('[Checklist] DB save error:', {
                  code: error.code,
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                  servicioId,
                  custodioTelefono,
                });
                throw new Error(`DB error ${error.code}: ${error.message}`);
              }
            },
            { maxAttempts: 3, baseDelayMs: 1000 },
            (attempt, delay) => {
              console.log(`[Checklist] Retry ${attempt}, waiting ${delay}ms...`);
            }
          );

          await deleteDraft(servicioId);
       } else {
         await addToSyncQueue({
           action: 'save_checklist',
           payload: checklistData as Record<string, unknown>,
         });
 
         await saveDraft({
           servicioId,
           custodioPhone: custodioTelefono,
           items,
           observaciones,
           firma: firma || undefined,
           createdAt: now,
           updatedAt: now,
         });
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({
         queryKey: ['service-checklist', servicioId],
       });
       toast.success(
         isOnline
           ? 'Checklist guardado correctamente'
           : 'Checklist guardado localmente - Se sincronizará cuando tengas conexión'
       );
       setIsSaving(false);
     },
      onError: (error) => {
        console.error('[Checklist] Save failed permanently:', error);
        toast.error('Error al guardar checklist. Por favor intenta de nuevo.', {
          duration: Infinity,
          description: 'Si el problema persiste, contacta a soporte.',
        });
        setIsSaving(false);
      },
   });
 
   const isComplete = useCallback(() => {
     const vehiculoComplete = Object.values(items.vehiculo).every(
       (v) => v !== null
     );
     const fotosComplete = fotos.length === 4;
     const firmaComplete = !!firma;
 
     return vehiculoComplete && fotosComplete && firmaComplete;
   }, [items, fotos, firma]);
 
   const getGeoAlerts = useCallback(() => {
     return fotos.filter(
       (f) => f.validacion === 'sin_gps' || f.validacion === 'fuera_rango'
     );
   }, [fotos]);
 
   const getPhotoByAngle = useCallback(
     (angle: AnguloFoto) => {
       return fotos.find((f) => f.angle === angle);
     },
     [fotos]
   );
 
   return {
     items,
     fotos,
     observaciones,
     firma,
     isLoading: isLoadingDraft || existingChecklistQuery.isLoading,
     isSaving,
     isOnline,
     existingChecklist: existingChecklistQuery.data,
 
     updateItem,
     setObservaciones,
     setFirma,
     capturePhoto,
     removePhoto,
     saveChecklist: saveChecklist.mutate,
 
     isComplete,
     getGeoAlerts,
     getPhotoByAngle,
   };
 }