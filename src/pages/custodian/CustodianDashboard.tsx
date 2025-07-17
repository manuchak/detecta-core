import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User, Phone, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useStableAuth } from "@/hooks/useStableAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustodianProfile {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  estado?: string;
  ciudad?: string;
  disponibilidad: boolean;
  fecha_ultima_actividad?: string;
}

interface AssignedService {
  id: string;
  client_name: string;
  origen: string;
  destino: string;
  fecha_programada: string;
  estado: string;
  tipo_servicio: string;
}

const CustodianDashboard = () => {
  const { user, loading } = useStableAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CustodianProfile | null>(null);
  const [assignedServices, setAssignedServices] = useState<AssignedService[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchCustodianData();
    }
  }, [user, loading]);

  const fetchCustodianData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch custodian profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch assigned services (mock data for now)
      setProfile({
        id: profileData.id,
        email: profileData.email,
        display_name: profileData.display_name,
        phone: profileData.phone,
        estado: 'CDMX',
        ciudad: 'Ciudad de México',
        disponibilidad: true,
        fecha_ultima_actividad: new Date().toISOString()
      });

      // Mock assigned services - will be replaced with real data later
      setAssignedServices([
        {
          id: '1',
          client_name: 'Empresa ABC',
          origen: 'Ciudad de México',
          destino: 'Guadalajara',
          fecha_programada: '2025-01-20T09:00:00Z',
          estado: 'programado',
          tipo_servicio: 'Custodia de carga'
        }
      ]);

    } catch (error) {
      console.error('Error fetching custodian data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del custodio",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    
    try {
      const newAvailability = !profile.disponibilidad;
      // Update availability in database here when table is ready
      setProfile({ ...profile, disponibilidad: newAvailability });
      
      toast({
        title: "Disponibilidad actualizada",
        description: `Ahora estás ${newAvailability ? 'disponible' : 'no disponible'} para servicios`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive"
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del custodio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido, {profile?.display_name || 'Custodio'}
            </h1>
            <p className="text-muted-foreground">Panel de control del custodio</p>
          </div>
          <Badge variant={profile?.disponibilidad ? "default" : "secondary"}>
            {profile?.disponibilidad ? "Disponible" : "No disponible"}
          </Badge>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile?.ciudad}, {profile?.estado}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Última actividad: {profile?.fecha_ultima_actividad ? 
                  new Date(profile.fecha_ultima_actividad).toLocaleDateString('es-ES') : 
                  'Nunca'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={toggleAvailability}
                variant={profile?.disponibilidad ? "outline" : "default"}
                size="sm"
              >
                {profile?.disponibilidad ? 'Marcar como no disponible' : 'Marcar como disponible'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Servicios Asignados
              </CardTitle>
              <CardDescription>
                Servicios programados y en progreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedServices.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tienes servicios asignados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedServices.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{service.client_name}</h4>
                        <Badge variant="outline">
                          {service.estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{service.tipo_servicio}</p>
                        <p>{service.origen} → {service.destino}</p>
                        <p>Fecha: {new Date(service.fecha_programada).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Funciones disponibles para custodios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <CheckCircle className="mr-2 h-4 w-4" />
                Ver tickets asignados
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <MapPin className="mr-2 h-4 w-4" />
                Actualizar ubicación
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Calendar className="mr-2 h-4 w-4" />
                Ver horarios
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                * Funciones en desarrollo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustodianDashboard;