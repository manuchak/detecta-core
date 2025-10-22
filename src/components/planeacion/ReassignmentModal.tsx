import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, User, Shield, AlertTriangle, CheckCircle2, X, Trash2, Building2, MapPin, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProveedoresArmados } from '@/hooks/useProveedoresArmados';

export interface ServiceForReassignment {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  custodio_asignado?: string;
  armado_asignado?: string;
  requiere_armado: boolean;
  estado_planeacion: string;
}

interface ReassignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceForReassignment | null;
  assignmentType: 'custodian' | 'armed_guard';
  onReassign: (data: {
    serviceId: string;
    newName: string;
    newId?: string;
    reason: string;
    assignmentType?: 'interno' | 'proveedor';
    providerId?: string;
    puntoEncuentro?: string;
    horaEncuentro?: string;
    tarifaAcordada?: number;
    nombrePersonal?: string;
  }) => Promise<void>;
  onRemove?: (data: {
    serviceId: string;
    assignmentType: 'custodian' | 'armed_guard';
    reason: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ReassignmentModal({
  open,
  onOpenChange,
  service,
  assignmentType,
  onReassign,
  onRemove,
  isLoading = false
}: ReassignmentModalProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  
  // Campos adicionales para proveedores externos
  const [selectedType, setSelectedType] = useState<'interno' | 'proveedor'>('interno');
  const [puntoEncuentro, setPuntoEncuentro] = useState<string>('');
  const [horaEncuentro, setHoraEncuentro] = useState<string>('09:00');
  const [tarifaAcordada, setTarifaAcordada] = useState<string>('');
  const [nombrePersonal, setNombrePersonal] = useState<string>('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // Hook para proveedores externos
  const { proveedores: proveedoresExternos, loading: loadingProveedores } = useProveedoresArmados();
  
  // Fetch available custodians or armed guards
  const { data: availableOptions, isLoading: loadingOptions } = useQuery({
    queryKey: [assignmentType === 'custodian' ? 'custodios' : 'armados', 'available'],
    queryFn: async () => {
      if (assignmentType === 'custodian') {
        const { data, error } = await supabase
          .from('custodios_operativos')
          .select('id, nombre, telefono, estado, disponibilidad')
          .eq('estado', 'activo')
          .eq('disponibilidad', 'disponible')
          .order('nombre');
        
        if (error) throw error;
        return data || [];
      } else {
        // Solo armados internos
        const { data, error } = await supabase
          .from('armados_operativos')
          .select('id, nombre, telefono, estado, disponibilidad, tipo_armado')
          .eq('estado', 'activo')
          .eq('tipo_armado', 'interno')
          .eq('disponibilidad', 'disponible')
          .order('nombre');
        
        if (error) throw error;
        return data || [];
      }
    },
    enabled: open && !!service
  });
  
  // Filtrar proveedores disponibles
  const availableProviders = proveedoresExternos.filter(p => 
    p.activo && 
    p.capacidad_actual < p.capacidad_maxima &&
    p.licencias_vigentes &&
    p.documentos_completos
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedId('');
      setSelectedName('');
      setReason('');
      setShowRemoveConfirm(false);
      setSelectedType('interno');
      setPuntoEncuentro('');
      setHoraEncuentro('09:00');
      setTarifaAcordada('');
      setNombrePersonal('');
      setSelectedProviderId('');
    }
  }, [open]);

  const handleReassign = async () => {
    if (!service || !selectedName.trim() || !reason.trim()) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Validaciones adicionales para proveedores
    if (selectedType === 'proveedor') {
      if (!puntoEncuentro.trim()) {
        toast.error('Debe especificar el punto de encuentro');
        return;
      }
      if (!horaEncuentro) {
        toast.error('Debe especificar la hora de encuentro');
        return;
      }
      if (!selectedProviderId) {
        toast.error('Error: No se identificó el proveedor seleccionado');
        return;
      }
    }

    try {
      await onReassign({
        serviceId: service.id,
        newName: selectedName,
        newId: selectedId || undefined,
        reason: reason.trim(),
        assignmentType: selectedType,
        providerId: selectedType === 'proveedor' ? selectedProviderId : undefined,
        puntoEncuentro: selectedType === 'proveedor' ? puntoEncuentro.trim() : undefined,
        horaEncuentro: selectedType === 'proveedor' ? horaEncuentro : undefined,
        tarifaAcordada: selectedType === 'proveedor' && tarifaAcordada ? parseFloat(tarifaAcordada) : undefined,
        nombrePersonal: selectedType === 'proveedor' && nombrePersonal.trim() ? nombrePersonal.trim() : undefined
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error in reassignment:', error);
    }
  };

  const handleRemove = async () => {
    if (!service || !onRemove || !reason.trim()) {
      toast.error('Por favor proporcione una razón para la remoción');
      return;
    }

    try {
      await onRemove({
        serviceId: service.id,
        assignmentType,
        reason: reason.trim()
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  if (!service) return null;

  const currentAssignment = assignmentType === 'custodian' 
    ? service.custodio_asignado 
    : service.armado_asignado;

  const typeLabel = assignmentType === 'custodian' ? 'Custodio' : 'Armado';
  const Icon = assignmentType === 'custodian' ? User : Shield;
  const actionLabel = currentAssignment ? 'Reasignar' : 'Agregar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {actionLabel} {typeLabel} - {service.id_servicio}
          </DialogTitle>
        </DialogHeader>

        {/* Current Service Info */}
        <Card className="border-slate-200/60 bg-slate-50/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-caption">Cliente</div>
                <div className="font-medium">{service.nombre_cliente}</div>
              </div>
              <div>
                <div className="text-caption">Ruta</div>
                <div className="font-medium">{service.origen} → {service.destino}</div>
              </div>
              <div>
                <div className="text-caption">{typeLabel} Actual</div>
                <div className="font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {currentAssignment || <span className="text-slate-500">Sin asignar</span>}
                </div>
              </div>
              <div>
                <div className="text-caption">Estado</div>
                <Badge variant="outline" className="text-xs">
                  {service.estado_planeacion}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showRemoveConfirm ? (
          <div className="space-y-6">
            {/* New Assignment Selection */}
            <div className="space-y-4">
              <h3 className="text-subtitle flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {currentAssignment ? `Nuevo ${typeLabel}` : typeLabel}
              </h3>
              
              {loadingOptions || (assignmentType === 'armed_guard' && loadingProveedores) ? (
                <div className="flex items-center gap-2 py-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-body">Cargando opciones disponibles...</span>
                </div>
              ) : assignmentType === 'custodian' ? (
                // Solo custodios
                availableOptions && availableOptions.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="assignment-select">Seleccionar {typeLabel} *</Label>
                    <Select
                      value={selectedId}
                      onValueChange={(value) => {
                        setSelectedId(value);
                        const selected = availableOptions.find(option => option.id === value);
                        setSelectedName(selected?.nombre || '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Seleccionar ${typeLabel.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{option.nombre}</span>
                              {option.telefono && (
                                <span className="text-slate-500">({option.telefono})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-amber-800">
                          No hay custodios disponibles
                        </div>
                        <div className="text-amber-700 text-sm">
                          Todos los custodios están ocupados o inactivos
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // Armados internos y proveedores externos
                <div className="space-y-2">
                  <Label htmlFor="assignment-select">Seleccionar Armado o Proveedor *</Label>
                  <Select
                    value={selectedId}
                    onValueChange={(value) => {
                      setSelectedId(value);
                      
                      const isProvider = value.startsWith('provider-');
                      
                      if (isProvider) {
                        const providerId = value.replace('provider-', '');
                        const provider = availableProviders.find(p => p.id === providerId);
                        if (provider) {
                          setSelectedName(provider.nombre_empresa);
                          setSelectedType('proveedor');
                          setSelectedProviderId(providerId);
                          if (provider.tarifa_base_local) {
                            setTarifaAcordada(provider.tarifa_base_local.toString());
                          }
                        }
                      } else {
                        const selected = availableOptions?.find(option => option.id === value);
                        if (selected) {
                          setSelectedName(selected.nombre);
                          setSelectedType('interno');
                          setSelectedProviderId('');
                          setPuntoEncuentro('');
                          setTarifaAcordada('');
                          setNombrePersonal('');
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar armado o proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Armados Internos */}
                      {availableOptions && availableOptions.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Armados Internos
                          </SelectLabel>
                          {availableOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5" />
                                <span>{option.nombre}</span>
                                {option.telefono && (
                                  <span className="text-slate-500 text-xs">({option.telefono})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      
                      {/* Proveedores Externos */}
                      {availableProviders.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Proveedores Externos
                          </SelectLabel>
                          {availableProviders.map((provider) => (
                            <SelectItem key={`provider-${provider.id}`} value={`provider-${provider.id}`}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>{provider.nombre_empresa}</span>
                                {provider.tarifa_base_local && (
                                  <Badge variant="outline" className="text-xs ml-1">
                                    ${provider.tarifa_base_local}
                                  </Badge>
                                )}
                                <span className="text-slate-500 text-xs">
                                  ({provider.capacidad_maxima - provider.capacidad_actual} disponibles)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      
                      {(!availableOptions || availableOptions.length === 0) && availableProviders.length === 0 && (
                        <SelectItem value="empty" disabled>
                          No hay armados ni proveedores disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Campos condicionales para proveedores */}
                  {selectedType === 'proveedor' && (
                    <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4" />
                        <span>Información del Proveedor Externo</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="punto-encuentro" className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Punto de Encuentro *
                        </Label>
                        <Input
                          id="punto-encuentro"
                          value={puntoEncuentro}
                          onChange={(e) => setPuntoEncuentro(e.target.value)}
                          placeholder="Ej: Oficina Central, Gasolinera X..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hora-encuentro" className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Hora de Encuentro *
                        </Label>
                        <Input
                          id="hora-encuentro"
                          type="time"
                          value={horaEncuentro}
                          onChange={(e) => setHoraEncuentro(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tarifa-acordada" className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          Tarifa Acordada (MXN)
                        </Label>
                        <Input
                          id="tarifa-acordada"
                          type="number"
                          step="0.01"
                          value={tarifaAcordada}
                          onChange={(e) => setTarifaAcordada(e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nombre-personal">
                          Nombre del Armado del Proveedor
                        </Label>
                        <Input
                          id="nombre-personal"
                          value={nombrePersonal}
                          onChange={(e) => setNombrePersonal(e.target.value)}
                          placeholder="Opcional"
                        />
                        <p className="text-xs text-slate-500">
                          Se puede especificar después si aún no se conoce
                        </p>
                      </div>
                      
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Recuerde confirmar punto y hora de encuentro con el custodio
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Entry Option */}
              <div className="space-y-2">
                <Label htmlFor="manual-name">O ingrese nombre manualmente</Label>
                <Input
                  id="manual-name"
                  value={selectedName}
                  onChange={(e) => {
                    setSelectedName(e.target.value);
                    setSelectedId(''); // Clear selection when typing manually
                  }}
                  placeholder={`Nombre del ${typeLabel.toLowerCase()}`}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">{currentAssignment ? 'Razón del cambio' : 'Razón de la asignación'} *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={currentAssignment ? "Describa la razón para esta reasignación..." : "Describa la razón para esta asignación..."}
                rows={3}
              />
            </div>

            {/* Conflict Warning */}
            {selectedName && assignmentType === 'custodian' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800">
                      Validación de conflictos
                    </div>
                    <div className="text-blue-700 text-sm">
                      El sistema validará automáticamente conflictos de horario antes de confirmar la reasignación
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Remove Confirmation */
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">
                    ¿Confirmar remoción de {typeLabel.toLowerCase()}?
                  </div>
                  <div className="text-red-700 text-sm">
                    Se removerá a "{currentAssignment}" de este servicio. Esta acción no se puede deshacer.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remove-reason">Razón de la remoción *</Label>
              <Textarea
                id="remove-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa la razón para remover esta asignación..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {!showRemoveConfirm && onRemove && currentAssignment && (
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover {typeLabel}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (showRemoveConfirm) {
                    setShowRemoveConfirm(false);
                    setReason('');
                  } else {
                    onOpenChange(false);
                  }
                }}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              {!showRemoveConfirm ? (
                <Button
                  onClick={handleReassign}
                  disabled={
                    !selectedName.trim() || 
                    !reason.trim() || 
                    (selectedType === 'proveedor' && (!puntoEncuentro.trim() || !horaEncuentro)) ||
                    isLoading
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isLoading ? 'Procesando...' : selectedType === 'proveedor' ? 'Asignar Proveedor' : `${actionLabel} ${typeLabel}`}
                </Button>
              ) : (
                <Button
                  onClick={handleRemove}
                  disabled={!reason.trim() || isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isLoading ? 'Removiendo...' : `Confirmar Remoción`}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}