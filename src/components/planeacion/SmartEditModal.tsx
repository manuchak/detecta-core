import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, X, User, Shield, Edit3, Calendar, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { PendingAssignmentModal } from './PendingAssignmentModal';
import { ContextualEditModal } from './ContextualEditModal';
import { EditServiceModal } from './EditServiceModal';
import { useEditWorkflow, type EditMode } from '@/contexts/EditWorkflowContext';
import type { EditableService } from './EditServiceModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SmartEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: EditableService | null;
  onSave: (id: string, data: Partial<EditableService>) => Promise<void>;
  onAssignmentComplete?: () => void;
  isLoading?: boolean;
}

type SmartViewMode = 'analysis' | 'direct_assign' | 'contextual_edit' | 'basic_edit';
type AssignmentMode = 'auto' | 'direct_armed' | 'direct_custodian';

export function SmartEditModal({
  open,
  onOpenChange,
  service,
  onSave,
  onAssignmentComplete,
  isLoading = false
}: SmartEditModalProps) {
  const [currentView, setCurrentView] = useState<SmartViewMode>('analysis');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('auto');
  const [serviceVersion, setServiceVersion] = useState(0);
  const { setEditIntent } = useEditWorkflow();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentView('analysis');
      setSelectedAction(null);
      setAssignmentMode('auto');
    }
  }, [open]);

  // 🔄 DYNAMIC: Detectar cambios en el servicio y recalcular sugerencias
  useEffect(() => {
    if (open && service) {
      setServiceVersion(v => v + 1);
    }
  }, [open, service?.custodio_asignado, service?.armado_asignado]);

  if (!service) return null;

  // Analyze service state for smart routing
  const hasArmado = service.requiere_armado && service.armado_asignado;
  const hasCustodio = service.custodio_asignado;
  const needsArmedAssignment = service.requiere_armado && !service.armado_asignado;
  const needsCustodianAssignment = !hasCustodio;
  const isComplete = hasCustodio && (!service.requiere_armado || hasArmado);

  // Quick Actions based on service state
  const getQuickActions = () => {
    const actions = [];

    // Flexible assignment: when both custodian AND armed are needed
    if (needsCustodianAssignment && needsArmedAssignment) {
      actions.push({
        id: 'flexible_assign',
        title: 'Asignar Personal',
        description: 'Asigna custodio y armado en cualquier orden',
        icon: User,
        color: 'info' as const,
        priority: 'high' as const,
        breadcrumb: 'Custodio ⏳ | Armado ⏳',
        action: () => {
          setAssignmentMode('auto');
          setCurrentView('direct_assign');
        }
      });
    }
    // Only armed needed (custodian already assigned)
    else if (needsArmedAssignment && hasCustodio) {
      actions.push({
        id: 'assign_armed',
        title: 'Asignar Armado Pendiente',
        description: 'El custodio ya está asignado, falta solo el armado',
        icon: Shield,
        color: 'warning' as const,
        priority: 'high' as const,
        breadcrumb: `${service.custodio_asignado} ✅ → Armado ⏳`,
        action: () => {
          setAssignmentMode('direct_armed');
          setCurrentView('direct_assign');
        }
      });
    }
    // Only custodian needed (no armed required)
    else if (needsCustodianAssignment && !service.requiere_armado) {
      actions.push({
        id: 'assign_custodian',
        title: 'Asignar Custodio',
        description: 'Completar la asignación básica del servicio',
        icon: User,
        color: 'info' as const,
        priority: 'high' as const,
        breadcrumb: 'Custodio ⏳',
        action: () => {
          setAssignmentMode('direct_custodian');
          setCurrentView('direct_assign');
        }
      });
    }

    // Reassignment options - visible when personnel is assigned (independent of isComplete)
    if (hasCustodio) {
      actions.push({
        id: 'change_custodian',
        title: 'Cambiar Custodio',
        description: `Actual: ${service.custodio_asignado}`,
        icon: User,
        color: 'info' as const,
        priority: 'medium' as const,
        action: () => {
          setSelectedAction('change_custodian');
          setCurrentView('contextual_edit');
        }
      });
    }

    if (hasArmado) {
      actions.push({
        id: 'change_armed',
        title: 'Cambiar Armado',
        description: `Actual: ${service.armado_asignado}`,
        icon: Shield,
        color: 'info' as const,
        priority: 'medium' as const,
        action: () => {
          setSelectedAction('change_armed');
          setCurrentView('contextual_edit');
        }
      });
    }

    // Configuration changes - Solo si tiene custodio y estado permite cambios
    if (!service.requiere_armado && 
        service.custodio_asignado && 
        !['cancelado', 'finalizado'].includes(service.estado_planeacion || '')) {
      actions.push({
        id: 'add_armed',
        title: 'Agregar Armado',
        description: 'Convertir a servicio con protección armada',
        icon: Shield,
        color: 'success' as const,
        priority: 'low' as const,
        action: () => {
          setSelectedAction('add_armed');
          setCurrentView('contextual_edit');
        }
      });
    } else if (service.requiere_armado) {
      actions.push({
        id: 'remove_armed',
        title: 'Remover Armado',
        description: 'Convertir a servicio solo de custodia',
        icon: Shield,
        color: 'destructive' as const,
        priority: 'low' as const,
        action: () => {
          setSelectedAction('remove_armed');
          setCurrentView('contextual_edit');
        }
      });
    }

    // Basic editing
    actions.push({
      id: 'edit_basic',
      title: 'Editar Información',
      description: 'Modificar datos básicos del servicio',
      icon: Edit3,
      color: 'secondary' as const,
      priority: 'low' as const,
      action: () => setCurrentView('basic_edit')
    });

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getStatusBadge = () => {
    if (needsArmedAssignment) {
      return <Badge className="bg-warning text-warning-foreground">Armado Pendiente</Badge>;
    }
    if (needsCustodianAssignment) {
      return <Badge className="bg-destructive text-destructive-foreground">Custodio Pendiente</Badge>;
    }
    if (isComplete) {
      return <Badge className="bg-success text-success-foreground">Completamente Asignado</Badge>;
    }
    return <Badge variant="secondary">En Proceso</Badge>;
  };

  const handleBack = () => {
    setCurrentView('analysis');
    setSelectedAction(null);
  };

  const actions = getQuickActions();
  const heroAction = actions.find(a => a.priority === 'high');

  // Convert to PendingService format for PendingAssignmentModal
  const pendingService = {
    id: service.id,
    id_servicio: service.id_servicio,
    nombre_cliente: service.nombre_cliente || 'Cliente',
    origen: service.origen || 'Origen',
    destino: service.destino || 'Destino',
    fecha_hora_cita: service.fecha_hora_cita || new Date().toISOString(),
    tipo_servicio: service.tipo_servicio || 'custodia',
    requiere_armado: service.requiere_armado || false,
    observaciones: service.observaciones,
    created_at: new Date().toISOString(),
    estado_planeacion: service.estado_planeacion || 'pendiente_asignacion',
    custodio_asignado: service.custodio_asignado,
    armado_asignado: service.armado_asignado
  };

  return (
    <>
      <Dialog open={open && currentView === 'analysis'} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col apple-surface border-0 shadow-apple-lg">
          <DialogHeader className="flex-shrink-0 border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="apple-text-title">
                  {service.id_servicio}
                </DialogTitle>
                {getStatusBadge()}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="apple-button-ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              Modal inteligente de análisis y edición de servicio
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Service Summary */}
            <Card className="apple-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="apple-text-caption">Cliente</div>
                        <div className="apple-text-body font-medium">{service.nombre_cliente}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="apple-text-caption">Ruta</div>
                        <div className="apple-text-body">{service.origen} → {service.destino}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="apple-text-caption">Fecha y Hora</div>
                        <div className="apple-text-body font-medium">
                          {service.fecha_hora_cita ? 
                            format(new Date(service.fecha_hora_cita), 'PPP p', { locale: es }) 
                            : 'No programada'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="apple-text-caption">Asignaciones</div>
                        <div className="flex items-center gap-2">
                          <span className={`apple-text-caption ${hasCustodio ? 'text-success' : 'text-muted-foreground'}`}>
                            Custodio: {hasCustodio ? service.custodio_asignado : 'Sin asignar'}
                          </span>
                          {service.requiere_armado && (
                            <span className={`apple-text-caption ${hasArmado ? 'text-success' : 'text-warning'}`}>
                              | Armado: {hasArmado ? service.armado_asignado : 'Pendiente'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hero Action */}
            {heroAction && (
              <div>
                <h3 className="apple-text-subtitle mb-4">Acción Recomendada</h3>
                <Card 
                  className="apple-card-hero cursor-pointer apple-hover-lift apple-press-scale" 
                  onClick={heroAction.action}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-${heroAction.color}/10`}>
                        <heroAction.icon className={`h-6 w-6 text-${heroAction.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="apple-text-headline">{heroAction.title}</h4>
                          <Badge className={`bg-${heroAction.color}/10 text-${heroAction.color} border-${heroAction.color}/20`}>
                            Prioritario
                          </Badge>
                        </div>
                        <p className="apple-text-body text-muted-foreground mb-2">
                          {heroAction.description}
                        </p>
                        {heroAction.breadcrumb && (
                          <div className="apple-text-caption text-muted-foreground font-mono">
                            {heroAction.breadcrumb}
                          </div>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5 text-muted-foreground opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other Actions */}
            {actions.filter(a => a.priority !== 'high').length > 0 && (
              <div>
                <h3 className="apple-text-subtitle mb-4">Otras Opciones</h3>
                <div className="apple-grid-actions">
                  {actions.filter(a => a.priority !== 'high').map((action) => (
                    <Card 
                      key={action.id}
                      className="apple-card cursor-pointer apple-hover-lift apple-press-scale"
                      onClick={action.action}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${action.color}/10`}>
                            <action.icon className={`h-4 w-4 text-${action.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="apple-text-callout">{action.title}</h4>
                            <p className="apple-text-caption text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Assignment Modal */}
      <PendingAssignmentModal
        open={currentView === 'direct_assign'}
        onOpenChange={(open) => !open && handleBack()}
        service={pendingService}
        mode={assignmentMode}
        onAssignmentComplete={() => {
          onAssignmentComplete?.();
          // 🔄 DYNAMIC: Volver a 'analysis' para recalcular sugerencias
          setCurrentView('analysis');
        }}
      />

      {/* Contextual Edit Modal */}
      <ContextualEditModal
        open={currentView === 'contextual_edit'}
        onOpenChange={(open) => !open && handleBack()}
        service={service}
        onSave={onSave}
        isLoading={isLoading}
        onStartReassignment={(type, svc) => {
          setCurrentView('direct_assign');
          setAssignmentMode(type === 'armed_guard' ? 'direct_armed' : 'direct_custodian');
        }}
      />

      {/* Basic Edit Modal */}
      <EditServiceModal
        open={currentView === 'basic_edit'}
        onOpenChange={(open) => !open && handleBack()}
        service={service}
        onSave={onSave}
        isLoading={isLoading}
      />
    </>
  );
}
