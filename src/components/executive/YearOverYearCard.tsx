import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useYearOverYearComparison } from '@/hooks/useYearOverYearComparison';
import { Loader2, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';

export const YearOverYearCard = () => {
  const { data, isLoading } = useYearOverYearComparison();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const isNegativeGrowth = data.growth.servicesPercent < 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Crecimiento 2024 vs 2025
          </CardTitle>
          {isNegativeGrowth && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Declive</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* YTD Services Comparison */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">YTD Servicios:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{data.current2025.ytdServices.toLocaleString()}</span>
              <div className={`flex items-center gap-1 ${isNegativeGrowth ? 'text-destructive' : 'text-success'}`}>
                <TrendingDown className="h-3 w-3" />
                <span className="text-xs font-medium">{data.growth.servicesPercent}%</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            vs 2024: {data.same2024.ytdServices.toLocaleString()} | Brecha: {data.growth.servicesGap.toLocaleString()}
          </div>
        </div>

        {/* YTD GMV Comparison */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">YTD GMV:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">${data.current2025.ytdGmv.toFixed(1)}M</span>
              <div className={`flex items-center gap-1 ${data.growth.gmvPercent < 0 ? 'text-destructive' : 'text-success'}`}>
                <TrendingDown className="h-3 w-3" />
                <span className="text-xs font-medium">{data.growth.gmvPercent}%</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            vs 2024: ${data.same2024.ytdGmv.toFixed(1)}M | Brecha: ${data.growth.gmvGap}M
          </div>
        </div>

        {/* Separator */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">Proyección Anual 2025</div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Servicios proyectados:</span>
              <span className="font-medium">{data.annualProjection.projected2025.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">vs 2024 total:</span>
              <div className={`flex items-center gap-2 ${data.annualProjection.vs2024Percent < 0 ? 'text-destructive' : 'text-success'}`}>
                <span className="font-medium">{data.annualProjection.vs2024Percent}%</span>
                <TrendingDown className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert */}
        {isNegativeGrowth && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Empresa en declive vs 2024</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};