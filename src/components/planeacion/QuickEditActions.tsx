import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Edit3, Settings, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useEditWorkflow, type EditMode } from '@/contexts/EditWorkflowContext';
import type { EditableService } from './EditServiceModal';

interface QuickEditActionsProps {
  service: EditableService;
  onEditModeSelect: (mode: EditMode, description: string) => void;
}

export function QuickEditActions({ service, onEditModeSelect }: QuickEditActionsProps) {
  const { setEditIntent } = useEditWorkflow();

  const handleQuickEdit = (mode: EditMode, description: string, skipSteps?: string[]) => {
    setEditIntent({
      mode,
      changeDescription: description,
      skipSteps: skipSteps || []
    });
    onEditModeSelect(mode, description);
  };

  const hasArmado = service.requiere_armado && service.armado_asignado;
  const hasCustodio = service.custodio_asignado;
  const needsArmedAssignment = service.requiere_armado && !service.armado_asignado;
  const isComplete = hasCustodio && (!service.requiere_armado || hasArmado);

  // Determine primary action
  const getPrimaryAction = () => {
    if (needsArmedAssignment && hasCustodio) {
      return {
        mode: 'armed_only' as EditMode,
        title: 'Asignar Armado Pendiente',
        description: 'Completar asignación crítica',
        icon: Shield,
        color: 'warning',
        urgent: true
      };
    }
    if (!hasCustodio) {
      return {
        mode: 'custodian_only' as EditMode,
        title: 'Asignar Custodio',
        description: 'Asignación básica requerida',
        icon: User,
        color: 'info',
        urgent: true
      };
    }
    return null;
  };

  const primaryAction = getPrimaryAction();

  return (
    <Card className="apple-card border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 apple-text-title">
              <Edit3 className="h-5 w-5" />
              Acciones Inteligentes
            </CardTitle>
            <p className="apple-text-body text-muted-foreground mt-1">
              Opciones optimizadas basadas en el estado actual del servicio
            </p>
          </div>
          {isComplete ? (
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          ) : (
            <Badge className="bg-warning/10 text-warning border-warning/20">
              <Clock className="h-3 w-3 mr-1" />
              Pendiente
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Service Status Overview */}
        <div className="apple-surface-secondary rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasCustodio ? 'bg-success/10' : 'bg-muted'}`}>
                <User className={`h-4 w-4 ${hasCustodio ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="apple-text-caption">Custodio</div>
                <div className="apple-text-callout">
                  {hasCustodio ? service.custodio_asignado : 'Sin asignar'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                hasArmado ? 'bg-success/10' : 
                service.requiere_armado ? 'bg-warning/10' : 'bg-muted'
              }`}>
                <Shield className={`h-4 w-4 ${
                  hasArmado ? 'text-success' : 
                  service.requiere_armado ? 'text-warning' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <div className="apple-text-caption">Armado</div>
                <div className="apple-text-callout">
                  {hasArmado ? service.armado_asignado : 
                   service.requiere_armado ? 'Pendiente' : 'No aplica'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action */}
        {primaryAction && (
          <div className="space-y-3">
            <h4 className="apple-text-subtitle flex items-center gap-2">
              Acción Prioritaria
              {primaryAction.urgent && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 apple-text-caption">
                  Urgente
                </Badge>
              )}
            </h4>
            
            <Card 
              className="apple-card-hero cursor-pointer apple-hover-lift apple-press-scale border-0 bg-gradient-to-r from-primary/5 to-primary/10"
              onClick={() => handleQuickEdit(primaryAction.mode, primaryAction.description)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${primaryAction.color}/10`}>
                    <primaryAction.icon className={`h-5 w-5 text-${primaryAction.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="apple-text-headline">{primaryAction.title}</h4>
                    <p className="apple-text-body text-muted-foreground">
                      {primaryAction.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <h4 className="apple-text-subtitle">Opciones Adicionales</h4>
          
          <div className="apple-grid-actions">
            {/* Personnel Changes */}
            {isComplete && (
              <>
                <Button
                  variant="outline"
                  className="apple-button-secondary justify-start h-auto p-4"
                  onClick={() => handleQuickEdit('custodian_only', 'Cambiar custodio asignado')}
                >
                  <User className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="apple-text-callout">Cambiar Custodio</div>
                    <div className="apple-text-caption text-muted-foreground">
                      Actual: {service.custodio_asignado}
                    </div>
                  </div>
                </Button>

                {service.requiere_armado && hasArmado && (
                  <Button
                    variant="outline"
                    className="apple-button-secondary justify-start h-auto p-4"
                    onClick={() => handleQuickEdit('armed_only', 'Cambiar armado asignado')}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="apple-text-callout">Cambiar Armado</div>
                      <div className="apple-text-caption text-muted-foreground">
                        Actual: {service.armado_asignado}
                      </div>
                    </div>
                  </Button>
                )}
              </>
            )}

            {/* Configuration Changes */}
            {!service.requiere_armado ? (
              <Button
                variant="outline"
                className="apple-button-secondary justify-start h-auto p-4 border-success/20 hover:bg-success/5"
                onClick={() => handleQuickEdit('add_armed', 'Agregar protección armada')}
              >
                <Shield className="h-4 w-4 mr-3 text-success" />
                <div className="text-left">
                  <div className="apple-text-callout text-success">Agregar Armado</div>
                  <div className="apple-text-caption text-muted-foreground">
                    Convertir a servicio con protección
                  </div>
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="apple-button-secondary justify-start h-auto p-4 border-destructive/20 hover:bg-destructive/5"
                onClick={() => handleQuickEdit('remove_armed', 'Remover protección armada')}
              >
                <Shield className="h-4 w-4 mr-3 text-destructive" />
                <div className="text-left">
                  <div className="apple-text-callout text-destructive">Remover Armado</div>
                  <div className="apple-text-caption text-muted-foreground">
                    Convertir a solo custodia
                  </div>
                </div>
              </Button>
            )}

            {/* Basic Information */}
            <Button
              variant="outline"
              className="apple-button-secondary justify-start h-auto p-4"
              onClick={() => handleQuickEdit('basic_info', 'Editar información básica')}
            >
              <Settings className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="apple-text-callout">Editar Información</div>
                <div className="apple-text-caption text-muted-foreground">
                  Modificar datos del servicio
                </div>
              </div>
            </Button>

            {/* Contextual Edit */}
            <Button
              variant="outline"
              className="apple-button-secondary justify-start h-auto p-4 border-info/20 hover:bg-info/5"
              onClick={() => handleQuickEdit('contextual', 'Flujo inteligente contextual')}
            >
              <Edit3 className="h-4 w-4 mr-3 text-info" />
              <div className="text-left">
                <div className="apple-text-callout text-info">Edición Contextual</div>
                <div className="apple-text-caption text-muted-foreground">
                  Flujo guiado inteligente
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Service Status Footer */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="apple-text-caption text-muted-foreground">
                Estado: {service.estado_planeacion}
              </div>
            </div>
            <Badge variant={service.requiere_armado ? 'default' : 'secondary'} className="apple-text-caption">
              {service.requiere_armado ? 'Con Armado' : 'Solo Custodia'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}