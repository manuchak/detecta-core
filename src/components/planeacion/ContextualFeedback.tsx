import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info, Clock, Users } from 'lucide-react';
import type { EditMode } from '@/contexts/EditWorkflowContext';
import type { EditableService } from './EditServiceModal';

interface ContextualFeedbackProps {
  service: EditableService;
  selectedMode: EditMode;
  onCancel?: () => void;
}

export function ContextualFeedback({ service, selectedMode }: ContextualFeedbackProps) {
  const getFeedbackContent = () => {
    const hasArmado = service.requiere_armado && service.armado_asignado;
    const hasCustodio = service.custodio_asignado;
    
    switch (selectedMode) {
      case 'flexible_assign':
        return {
          icon: <Users className="h-4 w-4 text-blue-600" />,
          title: 'Asignación Flexible',
          description: 'Asigna custodio y armado en el orden que prefieras',
          details: [
            'Puedes empezar por custodio o por armado',
            'Ambas asignaciones son requeridas',
            'El servicio se completará cuando ambos estén asignados'
          ],
          estimatedTime: '3 minutos',
          color: 'blue'
        };
        
      case 'custodian_only':
        return {
          icon: <Info className="h-4 w-4 text-blue-600" />,
          title: 'Cambio de Custodio',
          description: 'Solo se modificará el custodio asignado',
          details: [
            'El armado y configuraciones se mantendrán',
            'Se notificará al nuevo custodio',
            hasCustodio ? 'Se liberará al custodio actual' : 'Se completará la asignación pendiente'
          ],
          estimatedTime: '1 minuto',
          color: 'blue'
        };
        
      case 'armed_only':
        return {
          icon: <Info className="h-4 w-4 text-blue-600" />,
          title: 'Cambio de Armado',
          description: 'Solo se modificará el armado asignado',
          details: [
            'El custodio y configuraciones se mantendrán',
            'Se notificará al nuevo armado',
            hasArmado ? 'Se liberará al armado actual' : 'Se completará la asignación pendiente'
          ],
          estimatedTime: '2 minutos',
          color: 'blue'
        };
        
      case 'add_armed':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
          title: 'Agregar Armado',
          description: 'Se convertirá a servicio con armado',
          details: [
            'Se requerirá asignar personal armado',
            'Puede afectar la tarifa del servicio',
            'El estado cambiará a "pendiente_asignacion" si no hay armado disponible'
          ],
          estimatedTime: '3 minutos',
          color: 'orange'
        };
        
      case 'remove_armed':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />,
          title: 'Remover Armado',
          description: 'Se convertirá a servicio solo de custodia',
          details: [
            hasArmado ? 'Se liberará al armado actual' : 'Se cancelará la búsqueda de armado',
            'El servicio pasará a estado "confirmado"',
            'La tarifa puede reducirse'
          ],
          estimatedTime: '1 minuto',
          color: 'red'
        };
        
      case 'basic_info':
        return {
          icon: <Info className="h-4 w-4 text-slate-600" />,
          title: 'Edición Básica',
          description: 'Solo se modificarán los datos del servicio',
          details: [
            'Las asignaciones de personal se mantendrán',
            'Datos como cliente, fecha, ruta pueden cambiar',
            'No afectará el estado del servicio'
          ],
          estimatedTime: '2 minutos',
          color: 'gray'
        };
        
      default:
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          title: 'Edición Contextual',
          description: 'Flujo inteligente adaptado a tus cambios',
          details: [
            'Se detectarán automáticamente los pasos necesarios',
            'Solo verás las opciones relevantes',
            'Máxima eficiencia en el proceso'
          ],
          estimatedTime: 'Variable',
          color: 'green'
        };
    }
  };

  const feedback = getFeedbackContent();
  
  const colorStyles = {
    blue: 'border-blue-200/50 bg-blue-50/50',
    green: 'border-green-200/50 bg-green-50/50',
    orange: 'border-orange-200/50 bg-orange-50/50',
    red: 'border-red-200/50 bg-red-50/50',
    gray: 'border-border/50 bg-secondary/50'
  };

  return (
    <Card className={`apple-card ${colorStyles[feedback.color]} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/80 shadow-apple-sm">
            {feedback.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="apple-text-title text-base">{feedback.title}</h3>
              <Badge variant="outline" className="apple-text-caption flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {feedback.estimatedTime}
              </Badge>
            </div>
            
            <p className="apple-text-body mb-3">{feedback.description}</p>
            
            <div className="space-y-2">
              <p className="apple-text-caption font-medium">Qué va a pasar:</p>
              <ul className="space-y-1.5">
                {feedback.details.map((detail, index) => (
                  <li key={index} className="apple-text-caption flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-1.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}