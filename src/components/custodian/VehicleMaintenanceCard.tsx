import { useState } from "react";
import { Wrench, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MaintenanceStatus } from "@/hooks/useCustodianMaintenance";
import RecordMaintenanceDialog from "./RecordMaintenanceDialog";

interface VehicleMaintenanceCardProps {
  pendingMaintenance: MaintenanceStatus[];
  allMaintenance: MaintenanceStatus[];
  currentKm: number;
  onRecordMaintenance: (data: any) => Promise<boolean>;
  onViewAll: () => void;
}

const VehicleMaintenanceCard = ({
  pendingMaintenance,
  allMaintenance,
  currentKm,
  onRecordMaintenance,
  onViewAll,
}: VehicleMaintenanceCardProps) => {
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasUrgent = pendingMaintenance.some(m => m.estado === 'vencido');
  const hasWarnings = pendingMaintenance.length > 0;

  const displayItems = pendingMaintenance.length > 0 
    ? pendingMaintenance.slice(0, 3) 
    : allMaintenance.filter(m => m.prioridad === 'alta').slice(0, 3);

  const handleItemClick = (item: MaintenanceStatus) => {
    setSelectedMaintenance(item);
    setDialogOpen(true);
  };

  const handleConfirmMaintenance = async (data: any) => {
    const success = await onRecordMaintenance(data);
    if (success) {
      setDialogOpen(false);
      setSelectedMaintenance(null);
    }
    return success;
  };

  return (
    <>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className={cn(
          "px-4 py-3 flex items-center justify-between",
          hasUrgent ? "bg-red-500/10" : hasWarnings ? "bg-amber-500/10" : "bg-green-500/10"
        )}>
          <div className="flex items-center gap-2">
            <Wrench className={cn(
              "w-5 h-5",
              hasUrgent ? "text-red-600" : hasWarnings ? "text-amber-600" : "text-green-600"
            )} />
            <span className="font-semibold text-foreground">Estado del Vehículo</span>
          </div>
          <button 
            onClick={onViewAll}
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            Ver todo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="divide-y divide-border">
          {displayItems.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm">Todo en orden 👍</p>
            </div>
          ) : (
            displayItems.map((item) => (
              <button
                key={item.tipo}
                onClick={() => handleItemClick(item)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Status indicator */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                  item.estado === 'vencido' ? "bg-red-500/10" :
                  item.estado === 'proximo' ? "bg-amber-500/10" : "bg-green-500/10"
                )}>
                  {item.icono}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {item.nombre}
                    </span>
                    {item.estado === 'vencido' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs",
                    item.estado === 'vencido' ? "text-red-600 font-medium" :
                    item.estado === 'proximo' ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {item.estado === 'vencido' 
                      ? `Vencido hace ${Math.abs(item.km_restantes).toLocaleString()} km`
                      : item.estado === 'proximo'
                        ? `En ${item.km_restantes.toLocaleString()} km`
                        : `OK - próximo en ${item.km_restantes.toLocaleString()} km`
                    }
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-16">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.estado === 'vencido' ? "bg-red-500" :
                        item.estado === 'proximo' ? "bg-amber-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.max(0, item.porcentaje_vida)}%` }}
                    />
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Dialog para registrar mantenimiento */}
      <RecordMaintenanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        maintenance={selectedMaintenance}
        currentKm={currentKm}
        onConfirm={handleConfirmMaintenance}
      />
    </>
  );
};

export default VehicleMaintenanceCard;
