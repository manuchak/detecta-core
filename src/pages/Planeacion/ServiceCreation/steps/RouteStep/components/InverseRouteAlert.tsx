import { ArrowLeftRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InverseRouteInfo } from '../hooks/useRouteCreation';

interface InverseRouteAlertProps {
  inverseRoute: InverseRouteInfo;
  origen: string;
  destino: string;
  onUseAsTemplate: (valorBruto: number, precioCustodio: number) => void;
}

export function InverseRouteAlert({
  inverseRoute,
  origen,
  destino,
  onUseAsTemplate,
}: InverseRouteAlertProps) {
  if (!inverseRoute.exists || !inverseRoute.route) {
    return null;
  }

  const { route } = inverseRoute;

  const handleUseAsTemplate = () => {
    onUseAsTemplate(route.valor_bruto, route.precio_custodio);
  };

  return (
    <Alert className="bg-accent/50 border-accent">
      <ArrowLeftRight className="h-4 w-4 text-accent-foreground" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-sm">
          Existe la ruta inversa:{' '}
          <strong className="text-foreground">
            {route.origen_texto} → {route.destino_texto}
          </strong>
          {' '}(${route.valor_bruto.toLocaleString('es-MX')})
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseAsTemplate}
          className="shrink-0"
        >
          Usar precios como referencia
        </Button>
      </AlertDescription>
    </Alert>
  );
}
