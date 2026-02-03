interface ZoneProgressBarProps {
  percentage: number;
  className?: string;
}

export function ZoneProgressBar({ percentage, className = '' }: ZoneProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  const getColorClass = () => {
    if (percentage >= 70) return 'bg-success';
    if (percentage >= 30) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className={`h-1.5 w-full bg-muted rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-500 ease-out rounded-full ${getColorClass()}`}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}
