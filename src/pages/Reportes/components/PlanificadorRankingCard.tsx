import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Medal } from 'lucide-react';
import type { PlanificadorPerformance } from '../types';

interface PlanificadorRankingCardProps {
  planificador: PlanificadorPerformance;
  position: number;
}

export default function PlanificadorRankingCard({ planificador, position }: PlanificadorRankingCardProps) {
  const getMedalIcon = () => {
    switch (position) {
      case 1:
        return <Trophy className="h-8 w-8 text-amber-500" />;
      case 2:
        return <Award className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Medal className="h-8 w-8 text-amber-700" />;
      default:
        return null;
    }
  };
  
  const getMedalBg = () => {
    switch (position) {
      case 1:
        return 'from-amber-500/10 to-amber-500/5 border-amber-500/30';
      case 2:
        return 'from-gray-400/10 to-gray-400/5 border-gray-400/30';
      case 3:
        return 'from-amber-700/10 to-amber-700/5 border-amber-700/30';
      default:
        return '';
    }
  };
  
  return (
    <Card className={`shadow-apple-raised bg-gradient-to-br ${getMedalBg()} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {getMedalIcon()}
          <Badge 
            variant="default" 
            className="text-lg px-3 py-1 bg-corporate-blue text-white"
          >
            {planificador.score}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{planificador.nombre}</h3>
          <p className="text-sm text-muted-foreground">{planificador.email}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Servicios</p>
            <p className="text-xl font-bold">{planificador.serviciosCreados}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tasa Aceptación</p>
            <p className="text-xl font-bold">{planificador.tasaAceptacion}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Por Día</p>
            <p className="text-xl font-bold">{planificador.serviciosPorDia.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completado</p>
            <p className="text-xl font-bold">{planificador.tasaCompletado}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
