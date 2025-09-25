import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Edit, Settings, AlertTriangle } from 'lucide-react';
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

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Edit className="h-5 w-5" />
          Acciones Rápidas de Edición
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona el tipo de cambio que necesitas hacer para optimizar el flujo de edición
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual del servicio */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-xs text-muted-foreground">Custodio</div>
              <div className="font-medium">
                {hasCustodio ? service.custodio_asignado : (
                  <span className="text-orange-600">Sin asignar</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-500" />
            <div>
              <div className="text-xs text-muted-foreground">Armado</div>
              <div className="font-medium">
                {hasArmado ? service.armado_asignado : 
                 service.requiere_armado ? (
                   <span className="text-orange-600">Pendiente</span>
                 ) : (
                   <span className="text-slate-500">No aplica</span>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de estado */}
        {needsArmedAssignment && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              Este servicio requiere armado pero no tiene uno asignado
            </span>
          </div>
        )}

        {/* Acciones rápidas por categoría */}
        <div className="space-y-4">
          {/* Cambios de asignación */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Cambios de Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickEdit('custodian_only', 'Cambiar solo el custodio asignado', ['route', 'service'])}
                className="justify-start"
                disabled={!hasCustodio}
              >
                <User className="h-3 w-3 mr-2" />
                Cambiar Custodio
              </Button>

              {service.requiere_armado && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickEdit('armed_only', 'Cambiar solo el armado asignado', ['route', 'service', 'assignment'])}
                  className="justify-start"
                  disabled={!hasArmado}
                >
                  <Shield className="h-3 w-3 mr-2" />
                  Cambiar Armado
                </Button>
              )}
            </div>
          </div>

          {/* Cambios de configuración de armado */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Configuración de Armado
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {!service.requiere_armado && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickEdit('add_armed', 'Agregar armado al servicio', ['route', 'service', 'assignment'])}
                  className="justify-start text-green-700 border-green-200 hover:bg-green-50"
                >
                  <Shield className="h-3 w-3 mr-2" />
                  Agregar Armado
                </Button>
              )}

              {service.requiere_armado && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickEdit('remove_armed', 'Remover armado del servicio')}
                  className="justify-start text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Shield className="h-3 w-3 mr-2" />
                  Remover Armado
                </Button>
              )}

              {needsArmedAssignment && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickEdit('armed_only', 'Completar asignación de armado pendiente', ['route', 'service', 'assignment'])}
                  className="justify-start text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  <Shield className="h-3 w-3 mr-2" />
                  Asignar Armado Pendiente
                </Button>
              )}
            </div>
          </div>

          {/* Cambios básicos */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Información Básica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickEdit('basic_info', 'Editar información básica del servicio', ['assignment', 'armed_assignment'])}
                className="justify-start"
              >
                <Settings className="h-3 w-3 mr-2" />
                Datos del Servicio
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickEdit('contextual', 'Flujo inteligente basado en cambios')}
                className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Edit className="h-3 w-3 mr-2" />
                Edición Contextual
              </Button>
            </div>
          </div>
        </div>

        {/* Estadísticas del servicio */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Estado: {service.estado_planeacion}</span>
            <Badge variant={service.requiere_armado ? 'default' : 'secondary'} className="text-xs">
              {service.requiere_armado ? 'Con Armado' : 'Solo Custodia'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}