import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Car,
  Shield,
  Award,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OperativeProfileFull, ArmadoProfileFull } from '../../hooks/useOperativeProfile';

interface InformacionPersonalTabProps {
  profile: OperativeProfileFull | ArmadoProfileFull | null | undefined;
  tipo: 'custodio' | 'armado';
}

export function InformacionPersonalTab({ profile, tipo }: InformacionPersonalTabProps) {
  if (!profile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  const isCustodio = tipo === 'custodio';
  const custodioProfile = isCustodio ? profile as OperativeProfileFull : null;
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
            label="Fecha de registro" 
            value={format(new Date(profile.created_at), "d 'de' MMMM yyyy", { locale: es })} 
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

      {/* Info específica por tipo */}
      {isCustodio && custodioProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información Operativa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow 
              icon={Car} 
              label="Vehículo propio" 
              value={custodioProfile.vehiculo_propio ? 'Sí' : 'No'} 
            />
            <InfoRow 
              icon={Shield} 
              label="Experiencia en seguridad" 
              value={custodioProfile.experiencia_seguridad ? 'Sí' : 'No'} 
            />
            <InfoRow 
              icon={MapPin} 
              label="Fuente de registro" 
              value={custodioProfile.fuente} 
            />
            {custodioProfile.certificaciones && custodioProfile.certificaciones.length > 0 && (
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificaciones
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {custodioProfile.certificaciones.map((cert, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Scores y Métricas Base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5" />
            Métricas de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow 
            icon={Award} 
            label="Rating promedio" 
            value={profile.rating_promedio ? `${profile.rating_promedio.toFixed(1)} / 5.0` : '-'} 
          />
          <InfoRow 
            icon={Clock} 
            label="Total de servicios" 
            value={profile.numero_servicios?.toString()} 
          />
          {isCustodio && custodioProfile && (
            <>
              <InfoRow 
                icon={Shield} 
                label="Tasa de aceptación" 
                value={custodioProfile.tasa_aceptacion ? `${custodioProfile.tasa_aceptacion.toFixed(0)}%` : '-'} 
              />
              <InfoRow 
                icon={Shield} 
                label="Tasa de respuesta" 
                value={custodioProfile.tasa_respuesta ? `${custodioProfile.tasa_respuesta.toFixed(0)}%` : '-'} 
              />
              <InfoRow 
                icon={Shield} 
                label="Score total" 
                value={custodioProfile.score_total ? `${custodioProfile.score_total.toFixed(0)} / 100` : '-'} 
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
