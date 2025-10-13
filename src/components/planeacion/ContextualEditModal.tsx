import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartEditSuggestion } from './SmartEditSuggestion';
import { ContextualFeedback } from './ContextualFeedback';
import { EditServiceModal } from './EditServiceModal';
import { useEditWorkflow, type EditMode } from '@/contexts/EditWorkflowContext';
import { useSmartEditSuggestions } from '@/hooks/useSmartEditSuggestions';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { EditableService } from './EditServiceModal';

interface ContextualEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: EditableService | null;
  onSave: (id: string, data: Partial<EditableService>) => Promise<void>;
  isLoading?: boolean;
  onStartReassignment?: (type: 'custodian' | 'armed_guard', service: EditableService) => void;
}

export function ContextualEditModal({
  open,
  onOpenChange,
  service,
  onSave,
  isLoading = false,
  onStartReassignment
}: ContextualEditModalProps) {
  const [currentView, setCurrentView] = useState<'selection' | 'preview' | 'basic_form'>('selection');
  const [selectedEditMode, setSelectedEditMode] = useState<EditMode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { editIntent, resetEditMode, setEditIntent } = useEditWorkflow();
  const { heroSuggestion, suggestions } = useSmartEditSuggestions(service);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentView('selection');
      setSelectedEditMode(null);
    } else {
      resetEditMode();
    }
  }, [open, resetEditMode]);

  const handleEditModeSelect = async (mode: EditMode, description: string) => {
    console.log('[ContextualEditModal] onSelect', { mode });
    setSelectedEditMode(mode);
    setEditIntent({
      mode,
      changeDescription: description,
      skipSteps: []
    });
    
    // Para reasignación directa, disparar el flujo inmediatamente
    if (mode === 'custodian_only' || mode === 'armed_only') {
      if (!onStartReassignment) {
        toast.error('No se pudo iniciar la reasignación');
        return;
      }
      
      const type = mode === 'custodian_only' ? 'custodian' : 'armed_guard';
      
      if (service) {
        console.log('[ContextualEditModal] onStartReassignment llamada', { type });
        onStartReassignment(type, service);
      }
      
      return;
    }
    
    // Mostrar preview antes de proceder para otros modos
    if (mode === 'basic_info') {
      setCurrentView('basic_form');
    } else {
      setCurrentView('preview');
    }
  };

  const handleProceed = () => {
    if (selectedEditMode === 'basic_info') {
      setCurrentView('basic_form');
    } else {
      // Para otros modos, aplicar cambios directamente por ahora
      handleDirectAction();
    }
  };

  const handleDirectAction = async () => {
    if (!service || !selectedEditMode) return;
    
    setIsProcessing(true);
    try {
      let updatedData: Partial<EditableService> = {};
      
      switch (selectedEditMode) {
        case 'remove_armed':
          updatedData = {
            requiere_armado: false,
            armado_asignado: null,
            estado_planeacion: service.custodio_asignado 
              ? 'completamente_planeado'
              : service.estado_planeacion
          };
          await onSave(service.id_servicio, updatedData);
          toast.success('Armado removido del servicio', {
            duration: 3000,
            description: 'El servicio ahora es solo de custodia'
          });
          break;
          
        case 'add_armed':
          updatedData = {
            requiere_armado: true,
            estado_planeacion: 'pendiente_asignacion'
          };
          await onSave(service.id_servicio, updatedData);
          toast.success('Armado agregado al servicio', {
            duration: 3000,
            description: 'Ahora puedes asignar personal armado'
          });
          break;
          
        case 'armed_only':
          toast.info('Abriendo flujo de reasignación de armado...', { duration: 1500 });
          await new Promise(resolve => setTimeout(resolve, 500));
          onStartReassignment?.('armed_guard', service);
          // No cerrar el modal padre; PendingAssignmentModal controlará la vista
          return;
          
        case 'custodian_only':
          toast.info('Abriendo flujo de reasignación de custodio...', { duration: 1500 });
          await new Promise(resolve => setTimeout(resolve, 500));
          onStartReassignment?.('custodian', service);
          // No cerrar el modal padre; PendingAssignmentModal controlará la vista
          return;
          
        default:
          toast.info('Acción en desarrollo');
      }
      
      // Delay para que el usuario vea el toast
      await new Promise(resolve => setTimeout(resolve, 1500));
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Error al aplicar los cambios');
    } finally {
      setIsProcessing(false);
    }
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
        return `Servicio ${service.id_servicio || service.id || 'Sin Folio'}`;
      case 'preview':
        return 'Confirmar Cambios';
      case 'basic_form':
        return 'Editar Información';
      default:
        return 'Editar Servicio';
    }
  };


  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col apple-surface border-0 shadow-apple-lg">
          <DialogHeader className="flex-shrink-0 border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentView !== 'selection' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="apple-button-ghost -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <DialogTitle className="apple-text-title">
                  {getModalTitle()}
                </DialogTitle>
              </div>
              
            </div>
            <DialogDescription className="sr-only">
              Modal para editar servicio con opciones contextuales
            </DialogDescription>
          </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === 'selection' && (
            <>
              {heroSuggestion && (
                <div>
                  <SmartEditSuggestion
                    suggestion={heroSuggestion}
                    onSelect={handleEditModeSelect}
                    isHero={true}
                  />
                </div>
              )}
              
              {suggestions.length > 0 && (
                <div>
                  <h3 className="apple-text-subtitle mb-4">Otras opciones</h3>
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <SmartEditSuggestion
                        key={index}
                        suggestion={suggestion}
                        onSelect={handleEditModeSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {currentView === 'preview' && service && selectedEditMode && (
            <div className="space-y-6">
              <ContextualFeedback
                service={service}
                selectedMode={selectedEditMode}
              />
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="apple-button-secondary flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProceed}
                  className="apple-button-primary flex-1"
                  disabled={isLoading || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
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