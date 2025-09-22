import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppleTimePicker } from '@/components/ui/apple-time-picker';
import { SmartLocationDropdown } from '@/components/ui/smart-location-dropdown';
import { useMeetingTimeCalculator } from '@/hooks/useMeetingTimeCalculator';
import { Shield, User, MapPin, Clock, Phone, MessageCircle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ArmedGuard {
  id: string;
  nombre: string;
  telefono?: string;
  zona_base?: string;
  disponibilidad: string;
  estado: string;
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  experiencia_anos: number;
  rating_promedio: number;
  numero_servicios: number;
  tasa_respuesta: number;
  tasa_confirmacion: number;
  equipamiento_disponible?: string[];
  observaciones?: string;
}

interface ArmedProvider {
  id: string;
  nombre_empresa: string;
  contacto_principal: string;
  telefono_contacto: string;
  zonas_cobertura: string[];
  tarifa_por_servicio?: number;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio?: number;
  rating_proveedor: number;
  servicios_completados: number;
  activo: boolean;
}

interface ServiceDataWithCustodian {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  incluye_armado?: boolean;
  tipo_servicio?: string;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
  destino_texto?: string;
  cliente_nombre?: string;
}

interface ArmedGuardAssignmentData extends ServiceDataWithCustodian {
  armado_asignado_id?: string;
  armado_nombre?: string;
  tipo_asignacion?: 'interno' | 'proveedor';
  proveedor_id?: string;
  punto_encuentro?: string;
  hora_encuentro?: string;
  estado_asignacion?: 'pendiente' | 'confirmado' | 'rechazado';
}

interface ArmedGuardAssignmentStepProps {
  serviceData: ServiceDataWithCustodian;
  onComplete: (data: ArmedGuardAssignmentData) => void;
  onBack: () => void;
}

export function ArmedGuardAssignmentStep({ serviceData, onComplete, onBack }: ArmedGuardAssignmentStepProps) {
  const [selectedArmed, setSelectedArmed] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'interno' | 'proveedor'>('interno');
  const [armedGuards, setArmedGuards] = useState<ArmedGuard[]>([]);
  const [providers, setProviders] = useState<ArmedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [puntoEncuentro, setPuntoEncuentro] = useState('');
  const [horaEncuentro, setHoraEncuentro] = useState('');

  // Calculate recommended meeting time
  const { calculatedMeetingTime, formatDisplayTime, getTimeRecommendation } = useMeetingTimeCalculator({
    appointmentTime: serviceData.hora_ventana_inicio,
    appointmentDate: serviceData.fecha_programada,
    preparationMinutes: 90
  });

  // Set default meeting time when calculated
  useEffect(() => {
    if (calculatedMeetingTime && !horaEncuentro) {
      setHoraEncuentro(calculatedMeetingTime);
    }
  }, [calculatedMeetingTime, horaEncuentro]);

  // Mock data for now - replace with actual API calls
  useEffect(() => {
    const loadArmedGuards = async () => {
      setLoading(true);
      try {
        // Simulated data - replace with actual Supabase queries
        const mockArmedGuards: ArmedGuard[] = [
          {
            id: '1',
            nombre: 'Carlos Mendoza',
            telefono: '+52 55 1234 5678',
            zona_base: 'Ciudad de México',
            disponibilidad: 'disponible',
            estado: 'activo',
            licencia_portacion: 'LIC-001-2024',
            fecha_vencimiento_licencia: '2025-12-31',
            experiencia_anos: 8,
            rating_promedio: 4.8,
            numero_servicios: 145,
            tasa_respuesta: 95,
            tasa_confirmacion: 92,
            equipamiento_disponible: ['Pistola Glock 19', 'Radio comunicación', 'Chaleco antibalas'],
            observaciones: 'Especialista en custodia ejecutiva'
          },
          {
            id: '2',
            nombre: 'Miguel Rodriguez',
            telefono: '+52 55 9876 5432',
            zona_base: 'Ciudad de México',
            disponibilidad: 'ocupado',
            estado: 'activo',
            experiencia_anos: 5,
            rating_promedio: 4.5,
            numero_servicios: 89,
            tasa_respuesta: 88,
            tasa_confirmacion: 85,
            equipamiento_disponible: ['Pistola Beretta', 'Radio comunicación']
          }
        ];

        const mockProviders: ArmedProvider[] = [
          {
            id: 'p1',
            nombre_empresa: 'Seguridad Elite SA',
            contacto_principal: 'Ana García',
            telefono_contacto: '+52 55 4567 8901',
            zonas_cobertura: ['Ciudad de México', 'Estado de México'],
            tarifa_por_servicio: 2500,
            disponibilidad_24h: true,
            tiempo_respuesta_promedio: 25,
            rating_proveedor: 4.7,
            servicios_completados: 234,
            activo: true
          }
        ];

        setArmedGuards(mockArmedGuards);
        setProviders(mockProviders);
      } catch (error) {
        console.error('Error loading armed guards:', error);
        toast.error('Error al cargar los armados disponibles');
      } finally {
        setLoading(false);
      }
    };

    loadArmedGuards();
  }, []);

  const handleAssignArmed = () => {
    if (!selectedArmed || !puntoEncuentro || !horaEncuentro) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const selectedGuard = selectedType === 'interno' 
      ? armedGuards.find(g => g.id === selectedArmed)
      : providers.find(p => p.id === selectedArmed);

    if (!selectedGuard) return;

    const assignmentData: ArmedGuardAssignmentData = {
      ...serviceData,
      armado_asignado_id: selectedArmed,
      armado_nombre: selectedType === 'interno' 
        ? (selectedGuard as ArmedGuard).nombre 
        : (selectedGuard as ArmedProvider).nombre_empresa,
      tipo_asignacion: selectedType,
      proveedor_id: selectedType === 'proveedor' ? selectedArmed : undefined,
      punto_encuentro: puntoEncuentro,
      hora_encuentro: horaEncuentro,
      estado_asignacion: 'pendiente'
    };

    onComplete(assignmentData);
    toast.success('Armado asignado exitosamente');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cargando armados disponibles...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Asignación de Armado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-sm text-muted-foreground">Servicio</div>
              <div className="font-medium">{serviceData.cliente_nombre} → {serviceData.destino_texto}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Custodio Asignado</div>
              <div className="font-medium">{serviceData.custodio_nombre}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Fecha/Hora</div>
              <div className="font-medium">{serviceData.fecha_programada} {serviceData.hora_ventana_inicio}</div>
            </div>
          </div>

          {/* Type Selection */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-3">Tipo de Asignación</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoAsignacion"
                  value="interno"
                  checked={selectedType === 'interno'}
                  onChange={(e) => setSelectedType(e.target.value as 'interno' | 'proveedor')}
                  className="text-primary"
                />
                <span>Armado Interno</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoAsignacion"
                  value="proveedor"
                  checked={selectedType === 'proveedor'}
                  onChange={(e) => setSelectedType(e.target.value as 'interno' | 'proveedor')}
                  className="text-primary"
                />
                <span>Proveedor Externo</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Armed Guards List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedType === 'interno' ? 'Armados Internos Disponibles' : 'Proveedores Externos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedType === 'interno' ? (
            <div className="space-y-4">
              {armedGuards.filter(guard => guard.disponibilidad === 'disponible').map((guard) => (
                <div
                  key={guard.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedArmed === guard.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedArmed(guard.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5" />
                        <div>
                          <h3 className="font-semibold">{guard.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{guard.telefono}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Experiencia</div>
                          <div className="font-medium">{guard.experiencia_anos} años</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-medium">{guard.rating_promedio}/5.0</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Servicios</div>
                          <div className="font-medium">{guard.numero_servicios}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Tasa Confirmación</div>
                          <div className="font-medium">{guard.tasa_confirmacion}%</div>
                        </div>
                      </div>

                      {guard.licencia_portacion && (
                        <div className="mt-2">
                          <Badge variant="success" className="text-xs">
                            Licencia: {guard.licencia_portacion}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Badge variant={guard.disponibilidad === 'disponible' ? 'success' : 'secondary'}>
                        {guard.disponibilidad === 'disponible' ? 'Disponible' : 'Ocupado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {providers.filter(provider => provider.activo).map((provider) => (
                <div
                  key={provider.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedArmed === provider.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedArmed(provider.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-5 w-5" />
                        <div>
                          <h3 className="font-semibold">{provider.nombre_empresa}</h3>
                          <p className="text-sm text-muted-foreground">
                            {provider.contacto_principal} - {provider.telefono_contacto}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Tarifa</div>
                          <div className="font-medium">${provider.tarifa_por_servicio?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-medium">{provider.rating_proveedor}/5.0</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Servicios</div>
                          <div className="font-medium">{provider.servicios_completados}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Respuesta</div>
                          <div className="font-medium">{provider.tiempo_respuesta_promedio}min</div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">
                          Cobertura: {provider.zonas_cobertura.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Badge variant={provider.disponibilidad_24h ? 'success' : 'secondary'}>
                        {provider.disponibilidad_24h ? '24/7' : 'Horario Limitado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details */}
      {selectedArmed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Detalles del Encuentro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Time Recommendation */}
              {calculatedMeetingTime && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-primary">
                        Hora recomendada: {formatDisplayTime(calculatedMeetingTime)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getTimeRecommendation(serviceData.hora_ventana_inicio || '', horaEncuentro)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SmartLocationDropdown
                  value={puntoEncuentro}
                  onChange={setPuntoEncuentro}
                  label="Punto de Encuentro"
                  placeholder="Buscar ubicación favorita o escribir nueva dirección"
                />
                
                <AppleTimePicker
                  value={horaEncuentro}
                  onChange={setHoraEncuentro}
                  defaultTime={calculatedMeetingTime || undefined}
                  label="Hora de Encuentro"
                  maxTime={serviceData.hora_ventana_inicio}
                  appointmentDate={serviceData.fecha_programada}
                />
              </div>

              {/* Meeting Summary */}
              {puntoEncuentro && horaEncuentro && (
                <div className="bg-accent/50 border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Resumen del Encuentro</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        📍 {puntoEncuentro}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        🕐 {formatDisplayTime(horaEncuentro)}
                      </div>
                      {serviceData.hora_ventana_inicio && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                          Cita con cliente: {formatDisplayTime(serviceData.hora_ventana_inicio)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleAssignArmed}
          disabled={!selectedArmed || !puntoEncuentro || !horaEncuentro}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirmar Asignación de Armado
        </Button>
      </div>
    </div>
  );
}