 /**
  * Página del checklist de servicio para custodios
  * Recibe servicioId de la URL y renderiza el wizard
  */
 import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
 import { useState, useEffect } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistWizard } from '@/components/custodian/checklist/ChecklistWizard';
import { normalizePhone } from '@/lib/phoneUtils';
 import { Button } from '@/components/ui/button';
 import { AlertCircle, ArrowLeft } from 'lucide-react';
 
 export default function ServiceChecklistPage() {
   const { serviceId } = useParams<{ serviceId: string }>();
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const { user } = useAuth();
   
   // Fetch user profile to get phone
   const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
     queryKey: ['user-profile', user?.id],
     queryFn: async () => {
       if (!user?.id) return null;
       const { data, error } = await supabase
         .from('profiles')
         .select('phone, display_name')
         .eq('id', user.id)
         .maybeSingle();
       if (error) throw error;
       return data;
     },
     enabled: !!user?.id
   });
   
   // Get origin coordinates from URL params if provided
   const origenLat = searchParams.get('lat');
   const origenLng = searchParams.get('lng');
   
   const origenCoords = origenLat && origenLng 
     ? { lat: parseFloat(origenLat), lng: parseFloat(origenLng) }
     : null;
 
   // Validate required data
   if (!serviceId) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4">
         <AlertCircle className="h-12 w-12 text-destructive mb-4" />
         <h1 className="text-xl font-semibold mb-2">Error</h1>
         <p className="text-muted-foreground text-center mb-6">
           No se encontró el ID del servicio
         </p>
         <Button onClick={() => navigate('/custodian')}>
           <ArrowLeft className="h-4 w-4 mr-2" />
           Volver al inicio
         </Button>
       </div>
     );
   }
 
   if (isLoadingProfile) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
       </div>
     );
   }
 
   if (!userProfile?.phone) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4">
         <AlertCircle className="h-12 w-12 text-destructive mb-4" />
         <h1 className="text-xl font-semibold mb-2">Error</h1>
         <p className="text-muted-foreground text-center mb-6">
           No se encontró tu número de teléfono. Contacta a soporte.
         </p>
         <Button onClick={() => navigate('/custodian')}>
           <ArrowLeft className="h-4 w-4 mr-2" />
           Volver al inicio
         </Button>
       </div>
     );
   }
 
   return (
     <ChecklistWizard
       servicioId={serviceId}
       custodioTelefono={normalizePhone(userProfile.phone)}
       origenCoords={origenCoords}
       onComplete={() => navigate('/custodian')}
     />
   );
 }