import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppleTimePicker } from '@/components/ui/apple-time-picker';
import { SmartLocationDropdown } from '@/components/ui/smart-location-dropdown';
import { ArmedCallManagementModal } from './ArmedCallManagementModal';
import { Shield, User, MapPin, Clock, Phone, CheckCircle2, AlertCircle, Star, ChevronDown, ChevronUp, PhoneCall } from 'lucide-react';

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

interface ExpandableArmedCardProps {
  guard?: ArmedGuard;
  provider?: ArmedProvider;
  type: 'interno' | 'proveedor';
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onConfirmAssignment: (data: {
    id: string;
    type: 'interno' | 'proveedor';
    puntoEncuentro: string;
    horaEncuentro: string;
  }) => void;
  onCallManagement?: (guardId: string) => void;
  serviceData?: {
    id_servicio: string;
    fecha_hora_cita: string;
    origen: string;
    destino: string;
    nombre_cliente: string;
    tipo_servicio?: string;
  };
  calculatedMeetingTime?: string;
  formatDisplayTime?: (time: string) => string;
  getTimeRecommendation?: (selectedTime: string) => string;
}

export function ExpandableArmedCard({
  guard,
  provider,
  type,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onConfirmAssignment,
  onCallManagement,
  serviceData,
  calculatedMeetingTime,
  formatDisplayTime,
  getTimeRecommendation
}: ExpandableArmedCardProps) {
  const [puntoEncuentro, setPuntoEncuentro] = useState('');
  const [horaEncuentro, setHoraEncuentro] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const entity = guard || provider;
  const displayName = guard?.nombre || provider?.nombre_empresa || '';
  const id = entity?.id || '';

  // Set default meeting time when calculated
  useEffect(() => {
    if (calculatedMeetingTime && !horaEncuentro && isExpanded) {
      setHoraEncuentro(calculatedMeetingTime);
    }
  }, [calculatedMeetingTime, horaEncuentro, isExpanded]);

  // Validate form when fields change
  useEffect(() => {
    setIsValidated(Boolean(puntoEncuentro.trim() && horaEncuentro.trim()));
  }, [puntoEncuentro, horaEncuentro]);

  // Auto-scroll to card when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const cardTop = cardRef.current.offsetTop;
      const scrollOffset = cardTop - 100; // 100px from top for better visibility
      
      window.scrollTo({
        top: scrollOffset,
        behavior: 'smooth'
      });
    }
  }, [isExpanded]);

  // Reset fields when card is collapsed
  useEffect(() => {
    if (!isExpanded) {
      setPuntoEncuentro('');
      setHoraEncuentro('');
      setIsValidated(false);
    }
  }, [isExpanded]);

  const handleCardClick = () => {
    if (!isSelected) {
      onSelect();
    }
    if (isSelected && !isExpanded) {
      onExpand();
    }
  };

  const handleConfirm = () => {
    if (isValidated) {
      onConfirmAssignment({
        id,
        type,
        puntoEncuentro,
        horaEncuentro
      });
    }
  };

  const getAvailabilityStatus = () => {
    if (guard) {
      return guard.disponibilidad === 'disponible' ? 'success' : 'warning';
    }
    if (provider) {
      return provider.activo ? 'success' : 'secondary';
    }
    return 'secondary';
  };

  const getAvailabilityText = () => {
    if (guard) {
      return guard.disponibilidad === 'disponible' ? 'Disponible' : 'Ocupado';
    }
    if (provider) {
      return provider.activo ? 'Activo' : 'Inactivo';
    }
    return 'Estado desconocido';
  };

  return (
    <Card 
      ref={cardRef}
      className={`
        transition-all duration-300 cursor-pointer relative
        ${isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg' 
          : 'border-border hover:border-primary/50 hover:shadow-md'
        }
        ${isExpanded ? 'transform-none' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-md animate-pulse">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {/* Main Card Content */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0">
                {type === 'interno' ? (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getAvailabilityStatus() === 'success' ? 'default' : 'secondary'}>
                    {getAvailabilityText()}
                  </Badge>
                  {(guard?.rating_promedio || provider?.rating_proveedor) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{guard?.rating_promedio || provider?.rating_proveedor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact and Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4" />
                <span>{guard?.telefono || provider?.telefono_contacto}</span>
              </div>
              
              {guard && onCallManagement && serviceData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallManagement(id);
                    setShowCallModal(true);
                  }}
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Gestionar Llamada
                </Button>
              )}
            </div>

            {/* Stats */}
            {guard && (
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Experiencia</div>
                  <div className="font-medium">{guard.experiencia_anos} años</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Servicios</div>
                  <div className="font-medium">{guard.numero_servicios}</div>
                </div>
              </div>
            )}

            {provider && (
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Servicios Completados</div>
                  <div className="font-medium">{provider.servicios_completados}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tiempo Respuesta</div>
                  <div className="font-medium">{provider.tiempo_respuesta_promedio || 'N/A'} min</div>
                </div>
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {isSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Expanded Content - Meeting Details */}
        <div className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}
        `}>
          <div className="border-t pt-6 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <h4 className="font-semibold">Detalles del Encuentro</h4>
            </div>

            <div className="grid gap-4">
              {/* Meeting Point */}
              <div>
                <SmartLocationDropdown
                  value={puntoEncuentro}
                  onChange={setPuntoEncuentro}
                  label="Punto de Encuentro *"
                  placeholder="Selecciona el punto de encuentro"
                />
              </div>

              {/* Meeting Time */}
              <div>
                <AppleTimePicker
                  value={horaEncuentro}
                  onChange={setHoraEncuentro}
                  label="Hora de Encuentro *"
                  defaultTime={calculatedMeetingTime}
                />
                {horaEncuentro && getTimeRecommendation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTimeRecommendation(horaEncuentro)}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                }}
                disabled={!isValidated}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Asignación
              </Button>
              
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(); // This will collapse the card
                }}
                className="px-4"
              >
                Cancelar
              </Button>
            </div>

            {/* Validation Status */}
            <div className={`
              flex items-center gap-2 text-sm p-3 rounded-lg
              ${isValidated 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }
            `}>
              {isValidated ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>
                {isValidated 
                  ? 'Todos los campos están completos' 
                  : 'Completa el punto de encuentro y la hora'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Call Management Modal */}
        {guard && serviceData && (
          <ArmedCallManagementModal
            isOpen={showCallModal}
            onClose={() => setShowCallModal(false)}
            guard={guard as any}
            serviceData={serviceData}
            onAccept={(guardId) => {
              // Handle acceptance - could trigger automatic assignment flow
              console.log('Guard accepted:', guardId);
              setShowCallModal(false);
              onExpand(); // Show assignment details
            }}
            onReject={(guardId, reason, unavailabilityDays) => {
              // Handle rejection with reason and possible unavailability
              console.log('Guard rejected:', guardId, reason, unavailabilityDays);
              setShowCallModal(false);
              // Could trigger notification to parent component to try next guard
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}