import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield,
  Award,
  Clock,
  Home,
  Power,
  Settings,
  Plane
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OperativeProfileFull, ArmadoProfileFull } from '../../hooks/useOperativeProfile';
import { useProfileVehicle } from '../../hooks/useProfileVehicle';
import { useProfileEconomics } from '../../hooks/useProfileEconomics';
import { useProfileUbicacion } from '../../hooks/useProfileUbicacion';
import { VehiculoCard } from './VehiculoCard';
import { PermanenciaCard } from './PermanenciaCard';
import { CambioEstatusModal } from '@/components/operatives/CambioEstatusModal';
import { PreferenciaServicioSelector, PreferenciaTipoServicio } from '@/components/operatives/PreferenciaServicioSelector';
import { useUpdateOperativoPreferencia } from '@/hooks/useUpdateOperativoPreferencia';

interface InformacionPersonalTabProps {
  profile: OperativeProfileFull | ArmadoProfileFull | null | undefined;
  tipo: 'custodio' | 'armado';
}

export function InformacionPersonalTab({ profile, tipo }: InformacionPersonalTabProps) {
  const isCustodio = tipo === 'custodio';
  const custodioProfile = isCustodio ? profile as OperativeProfileFull : null;
  
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const preferenciaMutation = useUpdateOperativoPreferencia();
  
  const { data: vehicleData, isLoading: loadingVehicle } = useProfileVehicle(
    isCustodio && custodioProfile?.vehiculo_propio ? profile?.id : undefined
  );

  // Obtener datos de economics para fecha de primer servicio (solo custodios)
  const { data: economics } = useProfileEconomics(isCustodio ? profile?.nombre : undefined);
  
  // Obtener datos de ubicación desde liberación (solo custodios)
  const { data: ubicacionData } = useProfileUbicacion(
    isCustodio ? custodioProfile?.pc_custodio_id || undefined : undefined
  );

  // Calcular fecha de inicio REAL: la más antigua entre created_at y primer servicio
  const fechaInicioReal = useMemo(() => {
    if (!profile) return new Date();
    
    const fechaCreated = new Date(profile.created_at);
    
    if (isCustodio && economics?.primerServicio) {
      const fechaPrimerServicio = new Date(economics.primerServicio);
      // Usar la fecha más antigua
      return fechaPrimerServicio < fechaCreated ? fechaPrimerServicio : fechaCreated;
    }
    
    return fechaCreated;
  }, [profile?.created_at, economics?.primerServicio, isCustodio]);

  // Handle preference change
  const handlePreferenciaChange = (newPreferencia: PreferenciaTipoServicio) => {
    if (profile) {
      preferenciaMutation.mutate({
        operativoId: profile.id,
        operativoTipo: tipo,
        nuevaPreferencia: newPreferencia
      });
    }
  };

  // Get current preference
  const currentPreferencia = (profile as any)?.preferencia_tipo_servicio || 'indistinto';
  const isUpdatingPreferencia = preferenciaMutation.isPending;

  if (!profile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  const armadoProfile = !isCustodio ? profile as ArmadoProfileFull : null;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Datos de Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow icon={User} label="Nombre completo" value={profile.nombre} />
          <InfoRow icon={Phone} label="Teléfono" value={profile.telefono} />
          <InfoRow icon={Mail} label="Correo electrónico" value={profile.email} />
          <InfoRow icon={MapPin} label="Zona base" value={profile.zona_base} />
        </CardContent>
      </Card>

      {/* Estado y Disponibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estado y Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow 
            icon={Shield} 
            label="Estado" 
            value={
              <Badge variant={profile.estado === 'activo' ? 'default' : 'secondary'}>
                {profile.estado}
              </Badge>
            } 
          />
          <InfoRow 
            icon={Clock} 
            label="Disponibilidad" 
            value={profile.disponibilidad} 
          />
          <InfoRow 
            icon={Calendar} 
            label={isCustodio && economics?.primerServicio ? "Activo desde" : "Fecha de registro"} 
            value={format(fechaInicioReal, "d 'de' MMMM yyyy", { locale: es })} 
          />
          {isCustodio && custodioProfile?.fecha_ultimo_servicio && (
            <InfoRow 
              icon={Calendar} 
              label="Último servicio" 
              value={format(new Date(custodioProfile.fecha_ultimo_servicio), "d 'de' MMMM yyyy", { locale: es })} 
            />
          )}
        </CardContent>
      </Card>

      {/* Configuración Operativa - Phase 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Operativa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Preference Selector */}
          <PreferenciaServicioSelector
            value={currentPreferencia}
            onChange={handlePreferenciaChange}
            disabled={isUpdatingPreferencia}
          />
          
          {/* Status Change Button */}
          <div className="pt-2 border-t">
            <Button 
              variant={profile.estado === 'activo' ? 'outline' : 'default'}
              onClick={() => setShowEstatusModal(true)}
              className="w-full"
            >
              <Power className="h-4 w-4 mr-2" />
              {profile.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permanencia y Actividad */}
      <PermanenciaCard 
        createdAt={fechaInicioReal.toISOString()}
        fechaUltimoServicio={isCustodio ? custodioProfile?.fecha_ultimo_servicio || null : null}
        numeroServicios={profile.numero_servicios}
      />

      {/* Ubicación de Residencia (solo custodios) */}
      {isCustodio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-5 w-5" />
              Ubicación de Residencia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {ubicacionData ? (
              <>
                {ubicacionData.direccion && (
                  <InfoRow 
                    icon={MapPin} 
                    label="Dirección" 
                    value={ubicacionData.direccion} 
                  />
                )}
                {ubicacionData.ciudad && (
                  <InfoRow 
                    icon={MapPin} 
                    label="Ciudad" 
                    value={ubicacionData.ciudad} 
                  />
                )}
                <InfoRow 
                  icon={MapPin} 
                  label="Estado / Zona Base" 
                  value={
                    ubicacionData.estadoNombre ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">
                        {ubicacionData.estadoNombre}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">{profile.zona_base || 'No especificado'}</span>
                    )
                  } 
                />
              </>
            ) : (
              <div className="py-3 text-center text-muted-foreground text-sm">
                <p>Zona base actual: <Badge variant="outline">{profile.zona_base || 'No especificada'}</Badge></p>
                <p className="mt-1 text-xs">Ubicación detallada no disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehículo (solo si tiene vehículo propio) */}
      {isCustodio && custodioProfile && (
        <VehiculoCard 
          vehicle={vehicleData}
          isLoading={loadingVehicle}
          tieneVehiculo={custodioProfile.vehiculo_propio || false}
        />
      )}

      {/* Info específica Armado */}
      {!isCustodio && armadoProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Información de Armado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow 
              icon={Shield} 
              label="Tipo de armado" 
              value={armadoProfile.tipo_armado} 
            />
            <InfoRow 
              icon={Award} 
              label="Licencia de portación" 
              value={armadoProfile.licencia_portacion} 
            />
            {armadoProfile.fecha_vencimiento_licencia && (
              <InfoRow 
                icon={Calendar} 
                label="Vencimiento de licencia" 
                value={format(new Date(armadoProfile.fecha_vencimiento_licencia), "d 'de' MMMM yyyy", { locale: es })} 
              />
            )}
            <InfoRow 
              icon={Clock} 
              label="Años de experiencia" 
              value={armadoProfile.experiencia_anos ? `${armadoProfile.experiencia_anos} años` : '-'} 
            />
            {armadoProfile.equipamiento_disponible && armadoProfile.equipamiento_disponible.length > 0 && (
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Equipamiento disponible
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {armadoProfile.equipamiento_disponible.map((equip, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {equip}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certificaciones (custodios) */}
      {isCustodio && custodioProfile?.certificaciones && custodioProfile.certificaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {custodioProfile.certificaciones.map((cert, idx) => (
                <Badge key={idx} variant="secondary">
                  {cert}
                </Badge>
              ))}
            </div>
        </CardContent>
      </Card>
      )}

      {/* Status Change Modal */}
      <CambioEstatusModal
        open={showEstatusModal}
        onOpenChange={setShowEstatusModal}
        operativo={{
          id: profile.id,
          nombre: profile.nombre,
          tipo,
          estado: profile.estado
        }}
      />
    </div>
  );
}
