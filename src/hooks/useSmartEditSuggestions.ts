import { useMemo } from 'react';
import type { EditableService } from '@/components/planeacion/EditServiceModal';
import type { EditMode } from '@/contexts/EditWorkflowContext';

export interface EditSuggestion {
  mode: EditMode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'gray';
  estimatedTime: string;
  consequences?: string[];
}

export function useSmartEditSuggestions(service: EditableService | null): {
  heroSuggestion: EditSuggestion | null;
  suggestions: EditSuggestion[];
} {
  return useMemo(() => {
    if (!service) {
      return { heroSuggestion: null, suggestions: [] };
    }

    const suggestions: EditSuggestion[] = [];
    
    const hasArmado = service.requiere_armado && service.armado_asignado;
    const hasCustodio = service.custodio_asignado;
    const needsArmedAssignment = service.requiere_armado && !service.armado_asignado;
    const isPending = service.estado_planeacion === 'pendiente_asignacion';

    // Detectar la acción más crítica (Hero Action)
    // ORDEN LÓGICO: Cliente → Custodio → Armado
    let heroSuggestion: EditSuggestion | null = null;

    // PRIORIDAD 1: Ambos pendientes - flujo flexible
    if (!hasCustodio && needsArmedAssignment && isPending) {
      heroSuggestion = {
        mode: 'flexible_assign',
        title: 'Asignar Personal',
        description: 'Asigna custodio y/o armado en cualquier orden',
        priority: 'high',
        icon: 'Users',
        color: 'blue',
        estimatedTime: '3 min',
        consequences: [
          'Puedes asignar el armado primero si ya confirmó disponibilidad',
          'El custodio puede asignarse después'
        ]
      };
    }
    // PRIORIDAD 2: Solo custodio pendiente (sin armado requerido)
    else if (!hasCustodio && !service.requiere_armado && isPending) {
      heroSuggestion = {
        mode: 'custodian_only',
        title: 'Asignar Custodio',
        description: 'El servicio necesita un custodio para completar la planeación',
        priority: 'high',
        icon: 'User',
        color: 'blue',
        estimatedTime: '1 min',
        consequences: [
          'El servicio estará listo para operar'
        ]
      };
    } 
    // PRIORIDAD 3: Armado pendiente (ya hay custodio)
    else if (needsArmedAssignment && hasCustodio) {
      heroSuggestion = {
        mode: 'armed_only',
        title: 'Asignar Armado Pendiente',
        description: 'Este servicio requiere un armado asignado para proceder',
        priority: 'high',
        icon: 'Shield',
        color: 'orange',
        estimatedTime: '2 min',
        consequences: ['El servicio pasará a estado confirmado', 'Se notificará al armado asignado']
      };
    }

    // Sugerencias secundarias basadas en contexto
    if (hasCustodio) {
      suggestions.push({
        mode: 'custodian_only',
        title: 'Cambiar Custodio',
        description: 'Reasignar a otro custodio disponible',
        priority: 'medium',
        icon: 'User',
        color: 'blue',
        estimatedTime: '1 min'
      });
    }

    if (hasArmado) {
      suggestions.push({
        mode: 'armed_only',
        title: 'Cambiar Armado',
        description: 'Reasignar a otro armado disponible',
        priority: 'medium',
        icon: 'Shield',
        color: 'blue',
        estimatedTime: '2 min'
      });
    }

    // Solo mostrar "Agregar Armado" si tiene custodio y el estado permite cambios
    if (!service.requiere_armado && 
        service.custodio_asignado && 
        !['cancelado', 'finalizado'].includes(service.estado_planeacion || '')) {
      suggestions.push({
        mode: 'add_armed',
        title: 'Agregar Armado',
        description: 'Convertir a servicio con armado',
        priority: 'low',
        icon: 'Shield',
        color: 'green',
        estimatedTime: '3 min',
        consequences: ['Se requerirá asignar personal armado', 'Puede cambiar la tarifa del servicio']
      });
    } else if (service.requiere_armado) {
      suggestions.push({
        mode: 'remove_armed',
        title: 'Remover Armado',
        description: 'Convertir a servicio solo de custodia',
        priority: 'low',
        icon: 'Shield',
        color: 'red',
        estimatedTime: '1 min',
        consequences: ['Se liberará el armado asignado', 'El servicio pasará a confirmado']
      });
    }

    suggestions.push({
      mode: 'basic_info',
      title: 'Editar Información',
      description: 'Modificar datos básicos del servicio',
      priority: 'low',
      icon: 'Edit',
      color: 'gray',
      estimatedTime: '2 min'
    });

    // Filtrar hero suggestion de las sugerencias regulares
    const filteredSuggestions = suggestions.filter(s => s.mode !== heroSuggestion?.mode);

    return {
      heroSuggestion,
      suggestions: filteredSuggestions
    };
  }, [service]);
}