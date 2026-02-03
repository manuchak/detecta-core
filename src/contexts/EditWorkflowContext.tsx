import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EditMode = 
  | 'full_workflow'      // Workflow completo desde el inicio
  | 'custodian_only'     // Solo cambiar custodio
  | 'armed_only'         // Solo cambiar armado
  | 'add_armed'          // Agregar armado a servicio sin armado
  | 'remove_armed'       // Remover armado de servicio con armado
  | 'basic_info'         // Solo datos básicos (cliente, fecha, etc.)
  | 'contextual'         // Detectar automáticamente qué cambiar
  | 'flexible_assign';   // Asignar custodio o armado en cualquier orden

export interface EditIntent {
  mode: EditMode;
  targetField?: string;
  changeDescription?: string;
  requiresValidation?: boolean;
  skipSteps?: string[];
}

interface EditWorkflowContextType {
  editIntent: EditIntent | null;
  setEditIntent: (intent: EditIntent | null) => void;
  isEditMode: boolean;
  canSkipStep: (stepId: string) => boolean;
  getNextStep: (currentStep: string, data: any) => string | null;
  resetEditMode: () => void;
}

const EditWorkflowContext = createContext<EditWorkflowContextType | undefined>(undefined);

export function EditWorkflowProvider({ children }: { children: ReactNode }) {
  const [editIntent, setEditIntent] = useState<EditIntent | null>(null);

  const isEditMode = editIntent !== null;

  const canSkipStep = (stepId: string): boolean => {
    if (!editIntent) return false;
    return editIntent.skipSteps?.includes(stepId) ?? false;
  };

  const getNextStep = (currentStep: string, data: any): string | null => {
    if (!editIntent) return null;

    // Lógica inteligente para determinar el siguiente paso basado en el modo de edición
    switch (editIntent.mode) {
      case 'custodian_only':
        if (currentStep === 'route') return 'assignment';
        if (currentStep === 'assignment') return null; // Completar
        break;
        
      case 'armed_only':
        if (currentStep === 'route') return 'armed_assignment';
        if (currentStep === 'armed_assignment') return null; // Completar
        break;
        
      case 'add_armed':
        if (currentStep === 'route') return 'armed_assignment';
        if (currentStep === 'armed_assignment') return null; // Completar
        break;
        
      case 'remove_armed':
        // No necesita pasos adicionales, cambio directo
        return null;
        
      case 'basic_info':
        if (currentStep === 'route') return 'service';
        if (currentStep === 'service') return null; // Completar
        break;
        
      case 'contextual':
        // Flujo normal pero con saltos inteligentes
        if (currentStep === 'route' && !data.needsRouteChange) return 'service';
        if (currentStep === 'service' && !data.needsServiceChange) return 'assignment';
        if (currentStep === 'assignment' && !data.incluye_armado) return null;
        if (currentStep === 'assignment' && data.incluye_armado) return 'armed_assignment';
        if (currentStep === 'armed_assignment') return null;
        break;
        
      default:
        // Flujo normal completo
        return null;
    }

    return null;
  };

  const resetEditMode = () => {
    setEditIntent(null);
  };

  return (
    <EditWorkflowContext.Provider value={{
      editIntent,
      setEditIntent,
      isEditMode,
      canSkipStep,
      getNextStep,
      resetEditMode
    }}>
      {children}
    </EditWorkflowContext.Provider>
  );
}

export function useEditWorkflow() {
  const context = useContext(EditWorkflowContext);
  if (context === undefined) {
    throw new Error('useEditWorkflow must be used within an EditWorkflowProvider');
  }
  return context;
}