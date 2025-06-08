
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import type { AnalisisRiesgo } from '@/types/serviciosMonitoreo';

interface RiskIndicatorProps {
  analisis?: AnalisisRiesgo | null;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskIndicator = ({ analisis, size = 'md' }: RiskIndicatorProps) => {
  if (!analisis) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <FileText className="h-3 w-3" />
        Sin Análisis
      </Badge>
    );
  }

  const getScoreColor = (score: number) => {
    if (score <= 25) return 'bg-green-100 text-green-800';
    if (score <= 45) return 'bg-yellow-100 text-yellow-800';
    if (score <= 70) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
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
        return AlertTriangle;
      default:
        return Shield;
    }
  };

  const score = analisis.score_riesgo || 50;
  const Icon = getRecommendationIcon(analisis.recomendacion || 'requiere_revision');

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getScoreColor(score)} flex items-center gap-1 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 
        size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2 py-1'
      }`}>
        <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        Riesgo {getScoreLabel(score)} ({score.toFixed(0)}%)
      </Badge>
    </div>
  );
};
