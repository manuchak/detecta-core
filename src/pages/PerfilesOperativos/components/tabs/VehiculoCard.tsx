import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Loader2 } from 'lucide-react';
import type { ProfileVehicle } from '../../hooks/useProfileVehicle';

interface VehiculoCardProps {
  vehicle: ProfileVehicle | null | undefined;
  isLoading: boolean;
  tieneVehiculo: boolean;
}

export function VehiculoCard({ vehicle, isLoading, tieneVehiculo }: VehiculoCardProps) {
  if (!tieneVehiculo) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!vehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tiene vehículo propio pero no hay datos registrados en el sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium text-sm">{value || '-'}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehículo
          {vehicle.es_principal && (
            <Badge variant="secondary" className="text-xs ml-auto">Principal</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <InfoRow label="Marca" value={vehicle.marca} />
        <InfoRow label="Modelo" value={vehicle.modelo} />
        <InfoRow label="Color" value={vehicle.color} />
        <InfoRow 
          label="Placas" 
          value={
            vehicle.placa ? (
              <Badge variant="outline" className="font-mono">
                {vehicle.placa}
              </Badge>
            ) : '-'
          } 
        />
      </CardContent>
    </Card>
  );
}
