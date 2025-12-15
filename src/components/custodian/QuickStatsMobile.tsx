import { DollarSign, Calendar } from "lucide-react";

interface QuickStatsMobileProps {
  serviciosEstaSemana: number;
  montosPorCobrar: number;
}

const QuickStatsMobile = ({ serviciosEstaSemana, montosPorCobrar }: QuickStatsMobileProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Servicios esta semana */}
      <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-4xl font-bold text-blue-600 mb-1">
          {serviciosEstaSemana}
        </p>
        <p className="text-sm text-muted-foreground">
          Esta semana
        </p>
      </div>
      
      {/* Monto por cobrar */}
      <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/20">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-3xl font-bold text-green-600 mb-1">
          ${montosPorCobrar.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          Por cobrar
        </p>
      </div>
    </div>
  );
};

export default QuickStatsMobile;
