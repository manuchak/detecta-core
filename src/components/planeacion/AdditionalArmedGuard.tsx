import { useCustodioVehicleData } from '@/hooks/useCustodioVehicleData';
import { useArmadosDelServicio } from '@/hooks/useArmadosDelServicio';
import { Shield } from 'lucide-react';

interface AdditionalArmedGuardProps {
  custodioNombre?: string;
  armadoAsignado?: boolean;
  armadoNombre?: string;
  /** id_servicio para consultar multi-armados */
  servicioId?: string;
}

export function AdditionalArmedGuard({ custodioNombre, armadoAsignado, armadoNombre, servicioId }: AdditionalArmedGuardProps) {
  const custodianData = useCustodioVehicleData(custodioNombre);
  const isHybridCustodian = custodianData.isHybridCustodian();
  const { data: armadosRelacional } = useArmadosDelServicio(servicioId);
  
  // If we have relational data, use it; otherwise fall back to scalar
  const armadosList = armadosRelacional && armadosRelacional.length > 0
    ? armadosRelacional
    : null;

  // Legacy: single armado from scalar field
  const hasLegacyArmedGuard = !!armadoNombre && armadoNombre.trim() !== '';
  
  if (isHybridCustodian) return null;
  
  // Multi-armado: show list from asignacion_armados
  if (armadosList && armadosList.length > 0) {
    return (
      <div className="space-y-1 pt-2 border-t border-border/30">
        {armadosList.map((armado, idx) => (
          <div key={armado.id} className="flex items-center space-x-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="apple-text-caption font-medium text-foreground">
              {armado.armado_nombre_verificado || `Armado ${idx + 1}`}
            </span>
            <span className="apple-text-caption text-muted-foreground/60 italic">
              ({armado.tipo_asignacion === 'proveedor' ? 'Proveedor' : 'Acompañante'})
            </span>
          </div>
        ))}
      </div>
    );
  }
  
  // Legacy fallback: single armado
  if (!hasLegacyArmedGuard) return null;

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
