import { CheckCircle2, MapPin, DollarSign, Car, Shield, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PricingResult, MatchType } from '../hooks/usePricingSearch';

interface PricingResultCardProps {
  result: PricingResult;
  matchType: MatchType;
  onConfirm: () => void;
}

const matchTypeLabels: Record<NonNullable<MatchType>, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  'exact': { label: 'Coincidencia exacta', variant: 'default' },
  'flexible': { label: 'Coincidencia flexible', variant: 'secondary' },
  'destination-only': { label: 'Coincidencia por destino', variant: 'outline' }
};

export function PricingResultCard({ result, matchType, onConfirm }: PricingResultCardProps) {
  const matchInfo = matchType ? matchTypeLabels[matchType] : null;

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="border-2 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardContent className="pt-6 space-y-4">
        {/* Header with success indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800 dark:text-green-200">
              Pricing Encontrado
            </span>
          </div>
          {matchInfo && (
            <Badge variant={matchInfo.variant}>
              {matchInfo.label}
            </Badge>
          )}
        </div>

        {/* Route info */}
        <div className="flex items-center gap-2 text-sm bg-background/80 rounded-lg p-3">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium truncate">{result.ruta_encontrada}</span>
        </div>

        {/* Pricing details grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" />
              Valor Bruto
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(result.precio_sugerido)}
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Shield className="h-3 w-3" />
              Pago Custodio
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(result.precio_custodio)}
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Car className="h-3 w-3" />
              Distancia
            </div>
            <p className="text-lg font-bold text-foreground">
              {result.distancia_km ? `${result.distancia_km} km` : '-'}
            </p>
          </div>
        </div>

        {/* Service type and armed status */}
        <div className="flex flex-wrap items-center gap-2">
          {result.tipo_servicio && (
            <Badge variant="outline">
              {result.tipo_servicio}
            </Badge>
          )}
          {result.incluye_armado && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <Shield className="h-3 w-3 mr-1" />
              Con armado
            </Badge>
          )}
        </div>

        {/* Match type info for non-exact matches */}
        {matchType && matchType !== 'exact' && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {matchType === 'flexible' 
                ? 'Se encontró una ruta similar. Verifica que los datos sean correctos.'
                : 'Se encontró una ruta con el mismo destino. El origen puede variar.'}
            </span>
          </div>
        )}

        {/* Confirm button */}
        <div className="flex justify-end pt-2">
          <Button onClick={onConfirm} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirmar Ruta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
