import { MaintenanceStatus } from "@/hooks/useCustodianMaintenance";
import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgentMaintenanceAlertProps {
  maintenanceStatus: MaintenanceStatus[];
  onRegisterService: () => void;
}

const UrgentMaintenanceAlert = ({ maintenanceStatus, onRegisterService }: UrgentMaintenanceAlertProps) => {
  // Get most urgent items (vencidos first, then proximos)
  const urgentItems = maintenanceStatus
    .filter(m => m.estado === 'vencido' || m.estado === 'proximo')
    .sort((a, b) => {
      if (a.estado === 'vencido' && b.estado !== 'vencido') return -1;
      if (b.estado === 'vencido' && a.estado !== 'vencido') return 1;
      return a.km_restantes - b.km_restantes;
    })
    .slice(0, 2);

  const hasVencidos = urgentItems.some(i => i.estado === 'vencido');
  const allOk = urgentItems.length === 0;

  if (allOk) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-700">¡Tu vehículo está al día!</p>
            <p className="text-sm text-green-600/80">Todos los mantenimientos al corriente</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl p-5 border",
      hasVencidos 
        ? "bg-red-500/10 border-red-500/20" 
        : "bg-amber-500/10 border-amber-500/20"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          hasVencidos ? "bg-red-500/20" : "bg-amber-500/20"
        )}>
          <AlertTriangle className={cn(
            "w-6 h-6",
            hasVencidos ? "text-red-600" : "text-amber-600"
          )} />
        </div>
        <div>
          <p className={cn(
            "font-semibold",
            hasVencidos ? "text-red-700" : "text-amber-700"
          )}>
            {hasVencidos ? "Atención requerida" : "Próximos servicios"}
          </p>
          <p className={cn(
            "text-sm",
            hasVencidos ? "text-red-600/80" : "text-amber-600/80"
          )}>
            {urgentItems.length} mantenimiento{urgentItems.length > 1 ? 's' : ''} pendiente{urgentItems.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Urgent Items */}
      <div className="space-y-2 mb-4">
        {urgentItems.map((item) => (
          <div 
            key={item.tipo}
            className="bg-background/60 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-xl">{item.icono}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.nombre}</p>
              <p className={cn(
                "text-xs",
                item.estado === 'vencido' ? "text-red-600" : "text-amber-600"
              )}>
                {item.estado === 'vencido' 
                  ? `Vencido hace ${Math.abs(item.km_restantes).toLocaleString()} km`
                  : `Próximo en ${item.km_restantes.toLocaleString()} km`
                }
              </p>
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              item.estado === 'vencido' 
                ? "bg-red-500/20 text-red-700" 
                : "bg-amber-500/20 text-amber-700"
            )}>
              {item.estado === 'vencido' ? 'Urgente' : 'Próximo'}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={onRegisterService}
        className={cn(
          "w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform",
          hasVencidos 
            ? "bg-red-600 text-white" 
            : "bg-amber-500 text-white"
        )}
      >
        <Wrench className="w-5 h-5" />
        Registrar servicio realizado
      </button>
    </div>
  );
};

export default UrgentMaintenanceAlert;
