import { Building2, MapPin, DollarSign, User, Navigation, Tag, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingResult, MatchType } from '../hooks/useRouteSubSteps';

interface RouteConfirmSubStepProps {
  cliente: string;
  origen: string;
  destino: string;
  pricingResult: PricingResult;
  matchType: MatchType;
  isNewRoute?: boolean;
  onEdit: () => void;
  onConfirm: () => void;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getMatchBadge(matchType: MatchType) {
  switch (matchType) {
    case 'exact':
      return { label: 'Coincidencia exacta', variant: 'default' as const };
    case 'flexible':
      return { label: 'Coincidencia flexible', variant: 'secondary' as const };
    case 'destination-only':
      return { label: 'Por destino', variant: 'outline' as const };
    default:
      return null;
  }
}

export function RouteConfirmSubStep({
  cliente,
  origen,
  destino,
  pricingResult,
  matchType,
  isNewRoute = false,
  onEdit,
  onConfirm,
}: RouteConfirmSubStepProps) {
  const matchBadge = getMatchBadge(matchType);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 animate-in fade-in-50 duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Ruta Configurada
          </div>
          <div className="flex items-center gap-2">
            {isNewRoute && (
              <Badge className="gap-1 bg-green-600 hover:bg-green-700">
                <Sparkles className="h-3 w-3" />
                Ruta Nueva
              </Badge>
            )}
            {matchBadge && (
              <Badge variant={matchBadge.variant}>{matchBadge.label}</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Route visual */}
        <div className="bg-background rounded-lg p-4 space-y-4">
          {/* Client */}
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-lg">{cliente}</span>
          </div>

          {/* Route path */}
          <div className="flex items-center gap-3 pl-1">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-0.5 h-8 bg-border" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{origen}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{destino}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing details */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Valor Bruto</span>
            </div>
            <p className="font-semibold text-lg">
              {formatCurrency(pricingResult.precio_sugerido)}
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs">Pago Custodio</span>
            </div>
            <p className="font-semibold text-lg">
              {formatCurrency(pricingResult.precio_custodio)}
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Navigation className="h-4 w-4" />
              <span className="text-xs">Distancia</span>
            </div>
            <p className="font-semibold text-lg">
              {pricingResult.distancia_km ? `${pricingResult.distancia_km} km` : '-'}
            </p>
          </div>
        </div>

        {/* Service type */}
        {pricingResult.tipo_servicio && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span>
              Tipo: {pricingResult.tipo_servicio}
              {pricingResult.incluye_armado && ' (con armado)'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1 sm:flex-none"
          >
            ← Editar Ruta
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 sm:flex-none"
          >
            Continuar a Servicio →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
