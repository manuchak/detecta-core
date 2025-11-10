import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendInverted?: boolean;
  icon?: React.ReactNode;
  iconColor?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendInverted = false,
  icon,
  iconColor = 'text-corporate-blue'
}: MetricCardProps) {
  const trendValue = trend ?? 0;
  const isTrendPositive = trendInverted 
    ? trendValue < 0 
    : trendValue > 0;
  
  return (
    <Card className="shadow-apple-soft hover:shadow-apple-raised transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">
                {value}
              </p>
              {trend !== undefined && trend !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isTrendPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isTrendPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(trendValue)}%</span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          
          {icon && (
            <div className={`p-2 rounded-lg bg-muted/50 ${iconColor}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
