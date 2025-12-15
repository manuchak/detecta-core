import { MaintenanceStatus } from "@/hooks/useCustodianMaintenance";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MaintenanceListCollapsibleProps {
  maintenanceStatus: MaintenanceStatus[];
  onSelectItem: (item: MaintenanceStatus) => void;
}

const MaintenanceListCollapsible = ({ maintenanceStatus, onSelectItem }: MaintenanceListCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3 hover:bg-muted transition-colors">
        <span className="font-medium text-sm">
          Ver todos los mantenimientos ({maintenanceStatus.length})
        </span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-2">
        {maintenanceStatus.map((item) => (
          <button
            key={item.tipo}
            onClick={() => onSelectItem(item)}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
              item.estado === 'vencido' ? "bg-red-500/10" :
              item.estado === 'proximo' ? "bg-amber-500/10" : "bg-green-500/10"
            )}>
              {item.icono}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.nombre}</p>
              <p className={cn(
                "text-xs",
                item.estado === 'vencido' ? "text-red-600" :
                item.estado === 'proximo' ? "text-amber-600" : "text-muted-foreground"
              )}>
                {item.estado === 'vencido' 
                  ? `Vencido hace ${Math.abs(item.km_restantes).toLocaleString()} km`
                  : `Próximo en ${item.km_restantes.toLocaleString()} km`
                }
              </p>
            </div>
            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  item.estado === 'vencido' ? "bg-red-500" :
                  item.estado === 'proximo' ? "bg-amber-500" : "bg-green-500"
                )}
                style={{ width: `${Math.max(0, item.porcentaje_vida)}%` }}
              />
            </div>
          </button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MaintenanceListCollapsible;
