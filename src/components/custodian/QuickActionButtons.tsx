import { CalendarDays, AlertCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionButtonsProps {
  onViewServices: () => void;
  onReportProblem: () => void;
  onViewHistory?: () => void;
  ticketsAbiertos?: number;
}

const QuickActionButtons = ({ 
  onViewServices, 
  onReportProblem, 
  onViewHistory,
  ticketsAbiertos = 0 
}: QuickActionButtonsProps) => {
  return (
    <div className="space-y-3">
      {/* Ver mis servicios */}
      <button
        onClick={onViewServices}
        className="w-full flex items-center gap-4 bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all rounded-2xl p-5 border border-primary/20"
      >
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
          <CalendarDays className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-lg font-semibold text-foreground">
            Ver mis servicios
          </p>
          <p className="text-sm text-muted-foreground">
            Próximos y completados
          </p>
        </div>
      </button>
      
      {/* Reportar problema */}
      <button
        onClick={onReportProblem}
        className="w-full flex items-center gap-4 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] transition-all rounded-2xl p-5 border border-amber-500/20"
      >
        <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center relative">
          <AlertCircle className="w-7 h-7 text-amber-600" />
          {ticketsAbiertos > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {ticketsAbiertos > 9 ? '9+' : ticketsAbiertos}
            </span>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-lg font-semibold text-foreground">
            Reportar problema
          </p>
          <p className="text-sm text-muted-foreground">
            Pagos, gastos, equipamiento
          </p>
        </div>
      </button>

      {/* Ver historial (opcional) */}
      {onViewHistory && (
        <button
          onClick={onViewHistory}
          className="w-full flex items-center gap-4 bg-muted hover:bg-muted/80 active:scale-[0.98] transition-all rounded-2xl p-5"
        >
          <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center">
            <History className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-lg font-semibold text-foreground">
              Ver historial
            </p>
            <p className="text-sm text-muted-foreground">
              Servicios anteriores
            </p>
          </div>
        </button>
      )}
    </div>
  );
};

export default QuickActionButtons;
