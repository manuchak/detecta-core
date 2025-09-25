import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, MessageSquare, CheckCircle, AlertTriangle, TrendingUp, Phone, Target } from "lucide-react";
import type { CustodioEnriquecido } from "@/hooks/useCustodiosWithTracking";

interface CustodioPerformanceCardProps {
  custodio: CustodioEnriquecido;
  onSelect?: (custodio: CustodioEnriquecido) => void;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
  availabilityStatus?: 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible';
  unavailableReason?: string;
}

export const CustodioPerformanceCard = ({ 
  custodio, 
  onSelect, 
  selected = false,
  compact = false,
  disabled = false,
  availabilityStatus = 'disponible',
  unavailableReason
}: CustodioPerformanceCardProps) => {
  const getPerformanceBadgeColor = (level: CustodioEnriquecido['performance_level']) => {
    switch (level) {
      case 'excelente': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'bueno': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'regular': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'malo': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'nuevo': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    }
  };

  const getRejectionBadgeColor = (risk: CustodioEnriquecido['rejection_risk']) => {
    switch (risk) {
      case 'bajo': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'medio': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'alto': return 'bg-red-500/10 text-red-700 border-red-500/20';
    }
  };

  const getSpeedIcon = (speed: CustodioEnriquecido['response_speed']) => {
    switch (speed) {
      case 'rapido': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'normal': return <Clock className="h-3 w-3 text-blue-600" />;
      case 'lento': return <AlertTriangle className="h-3 w-3 text-red-600" />;
    }
  };

  const getBadgeInfo = (custodio: CustodioEnriquecido) => {
    // Usar la nueva categoría de experiencia calculada
    const categoryInfo = {
      'experimentado': {
        label: 'Experimentado',
        description: `${custodio.numero_servicios || 50}+ servicios completados`,
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
      },
      'intermedio': {
        label: 'Intermedio',
        description: `${custodio.numero_servicios || 10}+ servicios`,
        color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
      },
      'rookie': {
        label: 'Rookie',
        description: 'Custodio en desarrollo',
        color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'
      },
      'nuevo': {
        label: 'Nuevo',
        description: 'Recién registrado',
        color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
      },
      'candidato': {
        label: 'Candidato',
        description: 'En proceso de validación',
        color: 'bg-orange-500/10 text-orange-700 border-orange-500/20'
      }
    };

    const category = custodio.experience_category || 'rookie';
    return categoryInfo[category] || categoryInfo.rookie;
  };

  const getAvailabilityIndicator = () => {
    switch (availabilityStatus) {
      case 'disponible':
        return { color: 'bg-green-500', label: 'Disponible', icon: '🟢' };
      case 'parcialmente_ocupado':
        return { color: 'bg-yellow-500', label: 'Parcialmente ocupado', icon: '🟡' };
      case 'ocupado':
        return { color: 'bg-orange-500', label: 'Ocupado disponible', icon: '🟠' };
      case 'no_disponible':
        return { color: 'bg-red-500', label: 'No disponible', icon: '🔴' };
      default:
        return { color: 'bg-gray-500', label: 'Sin información', icon: '⚪' };
    }
  };

  const availabilityInfo = getAvailabilityIndicator();

  if (compact) {
    return (
      <div 
        className={`
          p-3 border rounded-lg transition-all 
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:shadow-md'}
          ${selected ? 'ring-2 ring-primary border-primary bg-primary/5' : disabled ? 'border-gray-200' : 'border-border hover:border-gray-300'}
        `}
        onClick={() => !disabled && onSelect?.(custodio)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{custodio.nombre}</h4>
            <p className="text-xs text-muted-foreground">{custodio.telefono}</p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{availabilityInfo.icon}</span>
              <Badge variant={disabled ? "secondary" : "outline"} className={`text-xs px-1.5 py-0.5`}>
                {availabilityInfo.label}
              </Badge>
            </div>
            <Badge className={`text-xs px-1.5 py-0.5 ${getBadgeInfo(custodio).color}`}>
              {getBadgeInfo(custodio).label}
            </Badge>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium">{(custodio.score_total * 10).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {custodio.tasa_aceptacion.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {custodio.tasa_respuesta.toFixed(0)}%
          </span>
          {custodio.scoring_proximidad && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-primary font-medium cursor-help">
                    P.Op: {custodio.scoring_proximidad.score_operacional.toFixed(1)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Puntaje Operacional: Compatibilidad con el servicio basada en experiencia, ubicación y disponibilidad</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Mostrar razón si no está disponible */}
        {disabled && unavailableReason && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded">
            {unavailableReason}
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div 
        className={`
          p-4 border rounded-xl transition-all 
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:shadow-lg'}
          ${selected ? 'ring-2 ring-primary border-primary bg-primary/5' : disabled ? 'border-gray-200' : 'border-border hover:border-gray-300'}
        `}
        onClick={() => !disabled && onSelect?.(custodio)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{custodio.nombre}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{custodio.telefono}</span>
            </div>
            {custodio.zona_base && (
              <span className="text-xs text-muted-foreground">📍 {custodio.zona_base}</span>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{availabilityInfo.icon}</span>
              <Badge variant={disabled ? "secondary" : "outline"} className="text-xs">
                {availabilityInfo.label}
              </Badge>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${getBadgeInfo(custodio).color}`}>
                {getBadgeInfo(custodio).label}
              </Badge>
              <Badge className={`text-xs ${getRejectionBadgeColor(custodio.rejection_risk)}`}>
                Rechazo: {custodio.rejection_risk}
              </Badge>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-primary">
                  {(custodio.score_total * 10).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Compatibilidad</div>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm font-medium">{custodio.tasa_aceptacion.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Aceptación</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tasa de aceptación de servicios ofrecidos</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm font-medium">{custodio.tasa_respuesta.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Respuesta</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tasa de respuesta a comunicaciones</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {getSpeedIcon(custodio.response_speed)}
                </div>
                <div className="text-sm font-medium">
                  {custodio.performance_metrics?.tiempo_promedio_respuesta_minutos || 0}min
                </div>
                <div className="text-xs text-muted-foreground">Respuesta</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tiempo promedio de respuesta</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Barras de progreso de scores */}
        <div className="space-y-2 mb-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Comunicación</span>
              <span>{custodio.score_comunicacion.toFixed(1)}/10</span>
            </div>
            <Progress value={custodio.score_comunicacion * 10} className="h-1.5" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Aceptación</span>
              <span>{custodio.score_aceptacion.toFixed(1)}/10</span>
            </div>
            <Progress value={custodio.score_aceptacion * 10} className="h-1.5" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Confiabilidad</span>
              <span>{custodio.score_confiabilidad.toFixed(1)}/10</span>
            </div>
            <Progress value={custodio.score_confiabilidad * 10} className="h-1.5" />
          </div>
        </div>

        {/* Información adicional */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          {custodio.scoring_proximidad && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-primary font-medium cursor-help">
                  Puntaje Operacional: {custodio.scoring_proximidad.score_operacional.toFixed(1)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Evaluación integral de compatibilidad operacional con el servicio</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {custodio.performance_metrics && (
            <span>
              {custodio.performance_metrics.total_ofertas} ofertas
            </span>
          )}
          
          {custodio.disponibilidad && (
            <Badge variant="outline" className="text-xs">
              Disponible
            </Badge>
          )}
        </div>

        {/* Razones de recomendación si existen */}
        {custodio.scoring_proximidad?.detalles?.razones && custodio.scoring_proximidad.detalles.razones.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-1">Factores clave:</div>
            <div className="flex flex-wrap gap-1">
              {custodio.scoring_proximidad.detalles.razones.slice(0, 2).map((razon, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {razon}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Mostrar razón si no está disponible */}
        {disabled && unavailableReason && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-red-800">No disponible</div>
                <div className="text-xs text-red-700 mt-1">{unavailableReason}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};