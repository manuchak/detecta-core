import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, User, AlertCircle, RefreshCw } from "lucide-react";
import { ResumenTurno, COLORES_ESTADO, EstadoVisual } from "@/hooks/useServiciosTurno";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ShiftSummaryCardsProps {
  resumen: ResumenTurno;
  isLoading?: boolean;
  lastUpdated?: Date;
  onFilterChange?: (estado: EstadoVisual | null) => void;
  activeFilter?: EstadoVisual | null;
}

const iconMap = {
  en_sitio: CheckCircle,
  proximo: Clock,
  asignado: User,
  sin_asignar: AlertCircle
};

const ShiftSummaryCards = ({ 
  resumen, 
  isLoading, 
  lastUpdated,
  onFilterChange,
  activeFilter 
}: ShiftSummaryCardsProps) => {
  const cards: { key: EstadoVisual; value: number }[] = [
    { key: 'en_sitio', value: resumen.enSitio },
    { key: 'proximo', value: resumen.proximos },
    { key: 'asignado', value: resumen.asignados },
    { key: 'sin_asignar', value: resumen.sinAsignar },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Posicionamiento del Turno (±8 hrs)</h2>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {format(lastUpdated, "HH:mm", { locale: es })}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ key, value }) => {
          const config = COLORES_ESTADO[key];
          const Icon = iconMap[key];
          const isActive = activeFilter === key;
          const isFiltering = activeFilter !== null && activeFilter !== undefined;
          
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                isActive 
                  ? 'ring-2 ring-offset-2' 
                  : isFiltering 
                    ? 'opacity-50' 
                    : ''
              }`}
              style={{ 
                borderColor: config.border,
                ...(isActive && { ringColor: config.primary })
              }}
              onClick={() => onFilterChange?.(isActive ? null : key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {config.label}
                    </p>
                    <p 
                      className="text-3xl font-bold mt-1"
                      style={{ color: config.primary }}
                    >
                      {isLoading ? '—' : value}
                    </p>
                  </div>
                  <div 
                    className="p-2 rounded-full"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon 
                      className="h-5 w-5" 
                      style={{ color: config.primary }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Total */}
      <div className="text-center text-sm text-muted-foreground">
        Total de posicionamientos programados: <span className="font-semibold">{resumen.total}</span>
      </div>
    </div>
  );
};

export default ShiftSummaryCards;
