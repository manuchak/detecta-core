import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface SIERCPDecisionBadgeProps {
  nivel: string;
  size?: 'sm' | 'md' | 'lg';
}

const getDecisionConfig = (nivel: string) => {
  switch (nivel) {
    case 'Alta':
      return {
        icon: CheckCircle,
        text: 'RECOMENDADO CONTRATAR',
        subtext: 'Con alta confianza',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
      };
    case 'Media':
      return {
        icon: AlertTriangle,
        text: 'CONTRATAR CON PRECAUCIÓN',
        subtext: 'Requiere seguimiento',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
      };
    case 'Baja':
      return {
        icon: AlertTriangle,
        text: 'NO RECOMENDADO',
        subtext: 'Alto riesgo identificado',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
      };
    case 'No apto':
      return {
        icon: XCircle,
        text: 'NO CONTRATAR',
        subtext: 'Perfil incompatible',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      };
    default:
      return {
        icon: HelpCircle,
        text: 'PENDIENTE DE EVALUACIÓN',
        subtext: 'Análisis incompleto',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-400',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-500',
      };
  }
};

export const SIERCPDecisionBadge: React.FC<SIERCPDecisionBadgeProps> = ({
  nivel,
  size = 'md',
}) => {
  const config = getDecisionConfig(nivel);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-5',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-3 rounded-xl border-2
        ${config.bgColor} ${config.borderColor} ${sizeClasses[size]}
        shadow-sm
      `}
    >
      <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
      <div>
        <p className={`font-bold tracking-wide ${config.textColor} ${textSizes[size]}`}>
          {config.text}
        </p>
        <p className={`text-xs ${config.textColor} opacity-75`}>
          {config.subtext}
        </p>
      </div>
    </div>
  );
};

export default SIERCPDecisionBadge;
