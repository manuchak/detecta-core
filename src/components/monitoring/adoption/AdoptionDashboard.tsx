import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, ShieldCheck, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResumenAdopcion, FiltroAdopcion } from "@/hooks/useAdopcionDigital";

interface Props {
  resumen: ResumenAdopcion;
  isLoading: boolean;
  filtroActivo: FiltroAdopcion;
  onFiltroChange: (filtro: FiltroAdopcion) => void;
}

const cards = [
  {
    key: "todos" as FiltroAdopcion,
    label: "Total Base Operativa",
    icon: Users,
    getValue: (r: ResumenAdopcion) => r.total,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "sin_cuenta" as FiltroAdopcion,
    label: "Sin Cuenta",
    icon: UserX,
    getValue: (r: ResumenAdopcion) => r.sinCuenta,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    key: "sin_rol" as FiltroAdopcion,
    label: "Con Cuenta, Sin Rol",
    icon: UserCheck,
    getValue: (r: ResumenAdopcion) => r.conCuenta - r.conRol,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    key: "activos_digitalmente" as FiltroAdopcion,
    label: "Activos Digitalmente",
    icon: ShieldCheck,
    getValue: (r: ResumenAdopcion) => r.conRol,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const AdoptionDashboard = ({ resumen, isLoading, filtroActivo, onFiltroChange }: Props) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const pctAdopcion = resumen.total > 0 ? ((resumen.conRol / resumen.total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={Number(pctAdopcion) < 10 ? "destructive" : Number(pctAdopcion) < 50 ? "default" : "success"}>
          {pctAdopcion}% adopción
        </Badge>
        <span className="text-sm text-muted-foreground">
          {resumen.conRol} de {resumen.total} custodios pueden operar digitalmente
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = filtroActivo === card.key;
          return (
            <Card
              key={card.key}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary" : ""}`}
              onClick={() => onFiltroChange(isActive ? "todos" : card.key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.getValue(resumen)}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdoptionDashboard;
