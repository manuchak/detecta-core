
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, FileText, XCircle, Clock } from 'lucide-react';
import type { AnalisisRiesgo } from '@/types/serviciosMonitoreo';

interface RiskIndicatorProps {
  analisis?: AnalisisRiesgo | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const RiskIndicator = ({ analisis, size = 'md', showDetails = false }: RiskIndicatorProps) => {
  if (!analisis) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pendiente Análisis
      </Badge>
    );
  }

  const getScoreColor = (score: number) => {
    if (score <= 25) return 'bg-green-100 text-green-800 border-green-300';
    if (score <= 45) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score <= 70) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 25) return 'Bajo';
    if (score <= 45) return 'Medio';
    if (score <= 70) return 'Alto';
    return 'Muy Alto';
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'aprobar':
        return CheckCircle;
      case 'aprobar_con_condiciones':
        return AlertTriangle;
      case 'requiere_revision':
        return FileText;
      case 'rechazar':
        return XCircle;
      default:
        return Shield;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'aprobar':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'aprobar_con_condiciones':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'requiere_revision':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rechazar':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'aprobar':
        return 'Aprobado';
      case 'aprobar_con_condiciones':
        return 'Aprobado c/Condiciones';
      case 'requiere_revision':
        return 'Requiere Revisión';
      case 'rechazar':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  const score = analisis.score_riesgo || 50;
  const ScoreIcon = Shield;
  const RecommendationIcon = getRecommendationIcon(analisis.recomendacion || 'requiere_revision');

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (showDetails) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className={`${getScoreColor(score)} border flex items-center gap-1 ${sizeClasses[size]}`}>
            <ScoreIcon className={iconSizes[size]} />
            Riesgo {getScoreLabel(score)} ({score.toFixed(0)}%)
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getRecommendationColor(analisis.recomendacion || 'requiere_revision')} border flex items-center gap-1 ${sizeClasses[size]}`}>
            <RecommendationIcon className={iconSizes[size]} />
            {getRecommendationLabel(analisis.recomendacion || 'requiere_revision')}
          </Badge>
        </div>
        {analisis.fecha_evaluacion && (
          <p className="text-xs text-gray-500">
            Evaluado: {new Date(analisis.fecha_evaluacion).toLocaleDateString('es-MX')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getScoreColor(score)} border flex items-center gap-1 ${sizeClasses[size]}`}>
        <ScoreIcon className={iconSizes[size]} />
        {getScoreLabel(score)} ({score.toFixed(0)}%)
      </Badge>
      <Badge className={`${getRecommendationColor(analisis.recomendacion || 'requiere_revision')} border flex items-center gap-1 ${sizeClasses[size]}`}>
        <RecommendationIcon className={iconSizes[size]} />
        {getRecommendationLabel(analisis.recomendacion || 'requiere_revision')}
      </Badge>
    </div>
  );
};
