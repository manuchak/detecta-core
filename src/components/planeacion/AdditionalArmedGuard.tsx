import { useCustodioVehicleData } from '@/hooks/useCustodioVehicleData';
import { Shield } from 'lucide-react';

interface AdditionalArmedGuardProps {
  custodioNombre?: string;
  armadoAsignado?: boolean;
  armadoNombre?: string;
}

export function AdditionalArmedGuard({ custodioNombre, armadoAsignado, armadoNombre }: AdditionalArmedGuardProps) {
  const custodianData = useCustodioVehicleData(custodioNombre);
  const isHybridCustodian = custodianData.isHybridCustodian();
  
  // Solo mostrar armado adicional si:
  // 1. Hay un armado nombre (puede ser string directo o flag boolean + nombre)
  // 2. El custodio NO es híbrido (porque ya tiene porte de arma)
  // FIX: armadoNombre is the primary indicator, armadoAsignado is legacy boolean
  const hasArmedGuard = !!armadoNombre && armadoNombre.trim() !== '';
  
  if (!hasArmedGuard || isHybridCustodian) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 mb-3 pt-2 border-t border-border/30">
      <Shield className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="apple-text-caption font-medium text-foreground">
        {armadoNombre}
      </span>
      <span className="apple-text-caption text-muted-foreground/60 italic">
        (Acompañante)
      </span>
    </div>
  );
}
