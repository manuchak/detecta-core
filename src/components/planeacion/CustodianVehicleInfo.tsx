import React from 'react';
import { User, Shield, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCustodioVehicleData } from '@/hooks/useCustodioVehicleData';

interface CustodianVehicleInfoProps {
  custodioNombre: string | null | undefined;
  className?: string;
}

export function CustodianVehicleInfo({ custodioNombre, className = '' }: CustodianVehicleInfoProps) {
  const { vehicleData, shouldShowVehicle, isHybridCustodian } = useCustodioVehicleData(custodioNombre || undefined);

  if (!custodioNombre) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <User className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="apple-text-caption text-muted-foreground">
          Sin custodio asignado
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center space-x-2">
        <User className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="apple-text-caption font-medium text-foreground">
          {custodioNombre}
        </span>
        {isHybridCustodian() && (
          <Badge variant="secondary" className="apple-text-caption ml-1.5">
            <Shield className="w-3 h-3 mr-1" />
            Con porte de arma
          </Badge>
        )}
      </div>
      
      {/* Vehículo (solo si aplica: custodio_vehiculo o armado_vehiculo) */}
      {shouldShowVehicle() && vehicleData && (
        <div className="flex items-center space-x-2 ml-5 text-muted-foreground/80">
          <Car className="w-3 h-3" />
          <span className="apple-text-caption">
            {vehicleData.marca} {vehicleData.modelo}
          </span>
          {vehicleData.placa !== 'Sin placa' && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="apple-text-caption font-mono">
                {vehicleData.placa}
              </span>
            </>
          )}
          {vehicleData.color !== 'No especificado' && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="apple-text-caption">
                {vehicleData.color}
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Mensaje sutil para custodios híbridos sin datos de vehículo */}
      {isHybridCustodian() && !shouldShowVehicle() && (
        <div className="ml-5">
          <span className="apple-text-caption text-muted-foreground/60 italic">
            Vehículo pendiente de registro
          </span>
        </div>
      )}
    </div>
  );
}
