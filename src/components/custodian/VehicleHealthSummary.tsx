import { MaintenanceStatus } from "@/hooks/useCustodianMaintenance";
import { cn } from "@/lib/utils";

interface VehicleHealthSummaryProps {
  maintenanceStatus: MaintenanceStatus[];
}

const VehicleHealthSummary = ({ maintenanceStatus }: VehicleHealthSummaryProps) => {
  const counts = {
    vencido: maintenanceStatus.filter(m => m.estado === 'vencido').length,
    proximo: maintenanceStatus.filter(m => m.estado === 'proximo').length,
    ok: maintenanceStatus.filter(m => m.estado === 'ok').length,
  };

  const items = [
    { 
      key: 'vencido', 
      count: counts.vencido, 
      label: 'Vencidos', 
      bgColor: 'bg-red-500/10', 
      textColor: 'text-red-600',
      emoji: '🔴'
    },
    { 
      key: 'proximo', 
      count: counts.proximo, 
      label: 'Próximos', 
      bgColor: 'bg-amber-500/10', 
      textColor: 'text-amber-600',
      emoji: '🟡'
    },
    { 
      key: 'ok', 
      count: counts.ok, 
      label: 'Al día', 
      bgColor: 'bg-green-500/10', 
      textColor: 'text-green-600',
      emoji: '🟢'
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div 
          key={item.key}
          className={cn(
            "rounded-xl p-3 text-center",
            item.bgColor
          )}
        >
          <div className="text-2xl mb-1">{item.emoji}</div>
          <p className={cn("text-2xl font-bold", item.textColor)}>{item.count}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default VehicleHealthSummary;
