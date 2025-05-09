
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormatters } from "@/hooks/useFormatters";

interface GmvProgressProps {
  totalGMV: number;
  targetGMV?: number;
}

export const GmvProgress = ({ totalGMV, targetGMV = 1200000 }: GmvProgressProps) => {
  const { formatCurrency } = useFormatters();
  const progressPercentage = Math.round((totalGMV / targetGMV) * 100);
  
  return (
    <Card className="card-apple mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Meta de GMV Anual</CardTitle>
        <CardDescription>
          Progreso actual: {formatCurrency(totalGMV)} / {formatCurrency(targetGMV)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progreso</span>
            <span className="text-sm font-medium">{progressPercentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
              style={{width: `${progressPercentage}%`}}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
