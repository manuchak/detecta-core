import { cn } from '@/lib/utils';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showDot?: boolean;
  className?: string;
}

export function MiniSparkline({
  data,
  color = 'currentColor',
  height = 24,
  width = 80,
  showDot = true,
  className
}: MiniSparklineProps) {
  if (!data.length || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 4;
  
  // Normalizar valores a coordenadas SVG
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  const lastPoint = data[data.length - 1];
  const lastX = width;
  const lastY = height - padding - ((lastPoint - min) / range) * (height - padding * 2);
  
  // Determinar tendencia para color
  const firstPoint = data[0];
  const trend = lastPoint >= firstPoint ? 'up' : 'down';
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={cn('overflow-visible flex-shrink-0', className)}
      aria-label={`Tendencia: ${trend === 'up' ? 'ascendente' : 'descendente'}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      {showDot && (
        <circle
          cx={lastX}
          cy={lastY}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
}
