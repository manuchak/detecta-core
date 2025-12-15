import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Wrench, ChevronRight } from "lucide-react";
import { MaintenanceStatus } from "@/hooks/useCustodianMaintenance";
import { cn } from "@/lib/utils";

interface DashboardHeroAlertProps {
  maintenanceStatus: MaintenanceStatus[];
  onRegisterService?: () => void;
}

const DashboardHeroAlert = ({ maintenanceStatus, onRegisterService }: DashboardHeroAlertProps) => {
  const navigate = useNavigate();
  
  // Prioritize: overdue > upcoming > all OK
  const vencidos = maintenanceStatus.filter(m => m.estado === 'vencido');
  const proximos = maintenanceStatus.filter(m => m.estado === 'proximo');
  
  // All OK state
  if (vencidos.length === 0 && proximos.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-5 border border-green-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-700">¡Todo en orden!</h3>
            <p className="text-sm text-green-600/80">Tu vehículo está al día con el mantenimiento</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Has urgent items
  const isOverdue = vencidos.length > 0;
  const urgentItems = isOverdue ? vencidos : proximos;
  const mainItem = urgentItems[0];
  
  return (
    <button
      onClick={() => navigate('/custodian/vehicle')}
      className={cn(
        "w-full rounded-2xl p-5 border text-left transition-all active:scale-[0.98]",
        isOverdue 
          ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20" 
          : "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
          isOverdue ? "bg-red-500/20" : "bg-amber-500/20"
        )}>
          <AlertTriangle className={cn(
            "w-7 h-7",
            isOverdue ? "text-red-600" : "text-amber-600"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "text-lg font-bold",
              isOverdue ? "text-red-700" : "text-amber-700"
            )}>
              {isOverdue ? "Mantenimiento vencido" : "Mantenimiento próximo"}
            </h3>
            {urgentItems.length > 1 && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isOverdue ? "bg-red-500/20 text-red-700" : "bg-amber-500/20 text-amber-700"
              )}>
                +{urgentItems.length - 1} más
              </span>
            )}
          </div>
          
          <p className={cn(
            "text-base font-medium mb-2",
            isOverdue ? "text-red-600" : "text-amber-600"
          )}>
            {mainItem.nombre}
          </p>
          
          <div className="flex items-center gap-2">
            <Wrench className={cn(
              "w-4 h-4",
              isOverdue ? "text-red-500" : "text-amber-500"
            )} />
            <span className={cn(
              "text-sm",
              isOverdue ? "text-red-500" : "text-amber-500"
            )}>
            {mainItem.km_restantes < 0 
              ? `Vencido hace ${Math.abs(mainItem.km_restantes).toLocaleString()} km`
              : `Faltan ${mainItem.km_restantes.toLocaleString()} km`
            }
            </span>
            <ChevronRight className={cn(
              "w-4 h-4 ml-auto",
              isOverdue ? "text-red-500" : "text-amber-500"
            )} />
          </div>
        </div>
      </div>
    </button>
  );
};

export default DashboardHeroAlert;
