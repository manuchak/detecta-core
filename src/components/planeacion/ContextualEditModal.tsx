import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuickEditActions } from './QuickEditActions';
import { RequestCreationWorkflow } from '@/pages/Planeacion/components/RequestCreationWorkflow';
import { EditServiceModal } from './EditServiceModal';
import { useEditWorkflow, type EditMode } from '@/contexts/EditWorkflowContext';
import { ArrowLeft, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { EditableService } from './EditServiceModal';

interface ContextualEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: EditableService | null;
  onSave: (id: string, data: Partial<EditableService>) => Promise<void>;
  isLoading?: boolean;
}

export function ContextualEditModal({
  open,
  onOpenChange,
  service,
  onSave,
  isLoading = false
}: ContextualEditModalProps) {
  const [currentView, setCurrentView] = useState<'selection' | 'workflow' | 'basic_form'>('selection');
  const [selectedEditMode, setSelectedEditMode] = useState<EditMode | null>(null);
  const { editIntent, resetEditMode, isEditMode } = useEditWorkflow();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentView('selection');
      setSelectedEditMode(null);
    } else {
      resetEditMode();
    }
  }, [open, resetEditMode]);

  const handleEditModeSelect = (mode: EditMode, description: string) => {
    setSelectedEditMode(mode);
    
    // Determinar qué vista mostrar basado en el modo
    if (mode === 'basic_info' || mode === 'remove_armed') {
      setCurrentView('basic_form');
    } else {
      setCurrentView('workflow');
    }

    toast.info(`Modo de edición: ${description}`);
  };

  const handleWorkflowComplete = () => {
    toast.success('Servicio actualizado exitosamente');
    onOpenChange(false);
  };

  const handleBasicFormSave = async (id: string, data: Partial<EditableService>) => {
    try {
      // Lógica especial para remover armado
      if (selectedEditMode === 'remove_armed') {
        const updatedData = {
          ...data,
          requiere_armado: false,
          armado_asignado: null,
          // Cambiar estado si el servicio estaba pendiente por armado
          estado_planeacion: service?.estado_planeacion === 'pendiente_asignacion' 
            ? 'confirmado' 
            : service?.estado_planeacion
        };
        
        await onSave(id, updatedData);
        toast.success('Armado removido del servicio');
      } else {
        await onSave(id, data);
        toast.success('Información básica actualizada');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving basic form:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  const handleCancel = () => {
    if (currentView !== 'selection') {
      // Volver a la selección
      setCurrentView('selection');
      setSelectedEditMode(null);
      resetEditMode();
    } else {
      // Cerrar modal completamente
      onOpenChange(false);
    }
  };

  const getModalTitle = () => {
    if (!service) return 'Editar Servicio';
    
    switch (currentView) {
      case 'selection':
        return `Editar Servicio - ${service.id_servicio}`;
      case 'workflow':
        return `Workflow de Edición - ${editIntent?.changeDescription || 'Editando servicio'}`;
      case 'basic_form':
        return `Edición Básica - ${service.id_servicio}`;
      default:
        return 'Editar Servicio';
    }
  };

  const getContentInfo = () => {
    if (!selectedEditMode) return null;
    
    const infoByMode = {
      'custodian_only': {
        icon: <Info className="h-4 w-4 text-blue-600" />,
        message: 'Solo se cambiará el custodio asignado. El armado y demás configuraciones se mantendrán.',
        type: 'info'
      },
      'armed_only': {
        icon: <Info className="h-4 w-4 text-blue-600" />,
        message: 'Solo se cambiará el armado asignado. El custodio y configuraciones se mantendrán.',
        type: 'info'
      },
      'add_armed': {
        icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
        message: 'Se agregará armado al servicio y se requerirá asignar personal armado.',
        type: 'warning'
      },
      'remove_armed': {
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        message: 'Se removerá el armado del servicio y se actualizará el estado automáticamente.',
        type: 'danger'
      },
      'basic_info': {
        icon: <Info className="h-4 w-4 text-blue-600" />,
        message: 'Solo se editarán los datos básicos como cliente, fecha, origen, destino.',
        type: 'info'
      },
      'contextual': {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        message: 'Flujo inteligente que detectará automáticamente qué pasos son necesarios.',
        type: 'success'
      }
    };

    const info = infoByMode[selectedEditMode as keyof typeof infoByMode];
    if (!info) return null;

    const bgColor = {
      'info': 'bg-blue-50 border-blue-200',
      'warning': 'bg-amber-50 border-amber-200', 
      'danger': 'bg-red-50 border-red-200',
      'success': 'bg-green-50 border-green-200'
    };

    return (
      <div className={`flex items-start gap-2 p-3 rounded-lg border ${bgColor[info.type]}`}>
        {info.icon}
        <span className="text-sm">{info.message}</span>
      </div>
    );
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {currentView !== 'selection' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {getModalTitle()}
            </DialogTitle>
            
            {currentView === 'selection' && (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {selectedEditMode && (
            <div className="mt-2">
              {getContentInfo()}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {currentView === 'selection' && (
            <div className="space-y-6 p-1">
              <QuickEditActions 
                service={service} 
                onEditModeSelect={handleEditModeSelect}
              />
            </div>
          )}

          {currentView === 'workflow' && service && (
            <div className="h-full">
              {/* TODO: Aquí iría el RequestCreationWorkflow adaptado para edición */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="text-lg font-medium mb-2">
                      Workflow de Edición en Desarrollo
                    </div>
                    <p className="text-muted-foreground mb-4">
                      El workflow inteligente para {editIntent?.changeDescription} estará disponible próximamente.
                    </p>
                    <Badge variant="outline">
                      Modo: {selectedEditMode}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'basic_form' && (
            <div className="h-full">
              <EditServiceModal
                open={true}
                onOpenChange={() => setCurrentView('selection')}
                service={service}
                onSave={handleBasicFormSave}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}