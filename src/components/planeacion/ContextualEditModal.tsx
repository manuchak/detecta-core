import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartEditSuggestion } from './SmartEditSuggestion';
import { ContextualFeedback } from './ContextualFeedback';
import { EditServiceForm, EditableService } from './EditServiceForm';
import { useEditWorkflow, type EditMode } from '@/contexts/EditWorkflowContext';
import { useSmartEditSuggestions } from '@/hooks/useSmartEditSuggestions';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  // Reset state ONLY on open transitions (false -> true)
  const wasOpenRef = useRef(open);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    if (open && !wasOpen) {
      // Modal just opened
      setCurrentView('selection');
      setSelectedEditMode(null);
    }
    if (!open && wasOpen) {
      // Modal just closed
      resetEditMode();
    }
    wasOpenRef.current = open;
  }, [open, resetEditMode]);

  // 🔍 DEBUG: Detectar cambios en currentView
  useEffect(() => {
    console.log('[ContextualEditModal] currentView changed to:', currentView, {
      hasService: !!service,
      serviceId: service?.id_servicio,
      open
    });
    if (currentView === 'basic_form') {
      console.log('[ContextualEditModal] ✅ basic_form view activated', {
        hasService: !!service,
        serviceId: service?.id_servicio,
        serviceData: service ? {
          id: service.id,
          nombre_cliente: service.nombre_cliente,
          origen: service.origen
        } : null
      });
    }
  }, [currentView, service, open]);

  const handleEditModeSelect = async (mode: EditMode, description: string) => {
    console.log('[ContextualEditModal] 🎯 handleEditModeSelect START', { 
      mode,
      description,
      hasReassignmentCallback: !!onStartReassignment,
      serviceId: service?.id_servicio,
      currentView
    });
    
    // Set common state first
    setSelectedEditMode(mode);
    setEditIntent({
      mode,
      changeDescription: description,
      skipSteps: []
    });
    
    // 🚀 Handle each mode explicitly with switch
    switch (mode) {
      case 'custodian_only':
      case 'armed_only':
        // Handle reassignment flow
        console.log('[ContextualEditModal] 🔄 Reassignment mode detected', { mode });
        if (!onStartReassignment) {
          toast.error('No se pudo iniciar la reasignación');
          return;
        }
        
        const type = mode === 'custodian_only' ? 'custodian' : 'armed_guard';
        
        if (service) {
          console.log('[ContextualEditModal] 📞 Calling onStartReassignment', { type });
          onStartReassignment(type, service);
          
          // Después de la asignación, volver a 'selection' para recalcular
          setTimeout(() => {
            setCurrentView('selection');
            setSelectedEditMode(null);
          }, 500);
        }
        break;
        
      case 'add_armed':
      case 'remove_armed':
        // Execute config change directly
        console.log('[ContextualEditModal] ⚙️ Config change mode detected', { mode });
        await executeConfigChange(mode);
        break;
        
      case 'basic_info':
        // 🎯 CRITICAL: Direct state change for basic info
        console.log('[ContextualEditModal] 📝 Basic info mode - switching to basic_form view');
        // Use setTimeout to ensure state update happens after React batching
        setTimeout(() => {
          console.log('[ContextualEditModal] ⏰ Executing setCurrentView(basic_form)');
          setCurrentView('basic_form');
        }, 0);
        break;
        
      default:
        console.log('[ContextualEditModal] 🔀 Default mode - switching to preview', { mode });
        setCurrentView('preview');
    }
    
    console.log('[ContextualEditModal] 🏁 handleEditModeSelect END', { mode });
  };

  const executeConfigChange = async (mode: EditMode) => {
    if (!service) return;
    
    console.log('[ContextualEditModal] executeConfigChange', { mode, serviceId: service.id_servicio });
    setIsProcessing(true);
    
    try {
      let updatedData: Partial<EditableService> = {};
      
      switch (mode) {
        case 'remove_armed':
          updatedData = {
            requiere_armado: false,
            armado_asignado: null,
            estado_planeacion: service.custodio_asignado 
              ? 'completamente_planeado'
              : service.estado_planeacion
          };
          await onSave(service.id_servicio, updatedData);
          console.log('[ContextualEditModal] Armado removido exitosamente');
          toast.success('Armado removido del servicio', {
            duration: 3000,
            description: 'El servicio ahora es solo de custodia'
          });
          break;
          
        case 'add_armed':
          // 🚨 VALIDACIÓN: Si el custodio es híbrido (armado_vehiculo), no permitir agregar armado
          // Primero necesitamos obtener el tipo de custodio
          const { data: custodioData } = await supabase.rpc('get_custodio_vehicle_data', {
            p_custodio_nombre: service.custodio_asignado || ''
          }).single() as { data: { tipo_custodio?: string } | null };
          
          if (custodioData?.tipo_custodio === 'armado_vehiculo') {
            toast.warning('Custodio ya cuenta con porte de arma', {
              description: 'Este custodio híbrido no requiere armado adicional'
            });
            onOpenChange(false);
            return;
          }
          
          updatedData = {
            requiere_armado: true,
            estado_planeacion: 'pendiente_asignacion'
          };
          await onSave(service.id_servicio, updatedData);
          console.log('[ContextualEditModal] Armado agregado, iniciando asignación automática');
          
          toast.success('Armado agregado al servicio', {
            duration: 2000,
            description: 'Ahora selecciona el personal armado'
          });
          
          // 🚀 Transición automática al paso de asignación de armado
          if (onStartReassignment) {
            // Pequeño delay para que el usuario vea el toast
            setTimeout(() => {
              onStartReassignment('armed_guard', service);
            }, 400);
          } else {
            onOpenChange(false);
          }
          return; // Salir sin ejecutar el onOpenChange del final
          
        default:
          toast.info('Acción en desarrollo');
      }
      
      // Cerrar modal inmediatamente después del toast
      onOpenChange(false);
    } catch (error) {
      console.error('[ContextualEditModal] Error applying config change:', error);
      toast.error('Error al aplicar los cambios');
    } finally {
      setIsProcessing(false);
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
          if (onStartReassignment) {
            onStartReassignment('armed_guard', service);
          } else {
            toast.error('No se pudo iniciar la reasignación');
          }
          return;
          
        case 'custodian_only':
          if (onStartReassignment) {
            onStartReassignment('custodian', service);
          } else {
            toast.error('No se pudo iniciar la reasignación');
          }
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

  // 🔍 DEBUG: Log render state
  console.log('[ContextualEditModal] 🎨 RENDER', {
    currentView,
    open,
    hasService: !!service,
    serviceId: service?.id_servicio,
    selectedEditMode
  });

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

          {/* Basic Form - Edición Completa */}
          {currentView === 'basic_form' && (
            <div className="space-y-4">
              {!service && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">⚠️ Debug: Service is null/undefined</p>
                  <pre className="text-xs mt-2">{JSON.stringify({ currentView, hasService: !!service }, null, 2)}</pre>
                </div>
              )}
              {service && (
                <EditServiceForm
                  service={service}
                  onSave={handleBasicFormSave}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}