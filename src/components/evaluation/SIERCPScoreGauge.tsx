import React from 'react';

interface SIERCPScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
}

const sizeConfig = {
  sm: { width: 60, strokeWidth: 6, fontSize: 'text-sm', labelSize: 'text-xs' },
  md: { width: 80, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
  lg: { width: 120, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-sm' },
  xl: { width: 180, strokeWidth: 14, fontSize: 'text-5xl', labelSize: 'text-base' },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return { stroke: '#16a34a', bg: '#dcfce7' }; // Green
  if (score >= 60) return { stroke: '#ca8a04', bg: '#fef9c3' }; // Yellow
  if (score >= 40) return { stroke: '#ea580c', bg: '#fed7aa' }; // Orange
  return { stroke: '#dc2626', bg: '#fecaca' }; // Red
};

export const SIERCPScoreGauge: React.FC<SIERCPScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = false,
  label,
}) => {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${config.fontSize}`} style={{ color: colors.stroke }}>
            {score}
          </span>
          {size === 'xl' && (
            <span className="text-sm text-gray-500">/100</span>
          )}
        </div>
      </div>
      {showLabel && label && (
        <span className={`mt-1 font-medium text-gray-700 text-center ${config.labelSize}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default SIERCPScoreGauge;
