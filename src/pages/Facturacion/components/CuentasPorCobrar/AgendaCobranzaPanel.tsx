import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, 
  Calendar, 
  AlertTriangle,
  HandCoins,
  Clock,
  ChevronRight,
  DollarSign,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useAgendaCobranza, AccionPendiente } from '../../hooks/useAgendaCobranza';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgendaCobranzaPanelProps {
  onAccionClick?: (accion: AccionPendiente) => void;
}

const getAccionIcon = (tipo: AccionPendiente['tipo']) => {
  switch (tipo) {
    case 'llamada':
      return <Phone className="h-4 w-4" />;
    case 'vencimiento':
      return <Calendar className="h-4 w-4" />;
    case 'promesa':
      return <HandCoins className="h-4 w-4" />;
    case 'seguimiento':
      return <Bell className="h-4 w-4" />;
  }
};

const getAccionColor = (tipo: AccionPendiente['tipo'], prioridad: AccionPendiente['prioridad']) => {
  if (prioridad === 'alta') {
    return 'bg-red-500/10 text-red-700 border-red-500/30';
  }
  switch (tipo) {
    case 'llamada':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
    case 'vencimiento':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    case 'promesa':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/30';
    case 'seguimiento':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
  }
};

const getPrioridadBadge = (prioridad: AccionPendiente['prioridad']) => {
  switch (prioridad) {
    case 'alta':
      return <Badge variant="destructive" className="text-[10px] px-1.5 h-4">Urgente</Badge>;
    case 'media':
      return <Badge variant="secondary" className="text-[10px] px-1.5 h-4">Hoy</Badge>;
    default:
      return null;
  }
};

export function AgendaCobranzaPanel({ onAccionClick }: AgendaCobranzaPanelProps) {
  const { data, isLoading } = useAgendaCobranza();

  const metrics = data?.metrics;
  const acciones = data?.acciones || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Agenda de Cobranza
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[10px] text-muted-foreground font-medium">Llamadas</span>
            </div>
            <p className="text-lg font-bold text-blue-700">{metrics?.llamadasPendientes || 0}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[10px] text-muted-foreground font-medium">Vencen Hoy</span>
            </div>
            <p className="text-lg font-bold text-red-700">{metrics?.vencenHoy || 0}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-0.5">
              <DollarSign className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[10px] text-muted-foreground font-medium">Vence 7d</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(metrics?.montoVenceSemana || 0)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-1.5 mb-0.5">
              <HandCoins className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-[10px] text-muted-foreground font-medium">Promesas</span>
            </div>
            <p className="text-lg font-bold text-purple-700">{metrics?.promesasPago || 0}</p>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Acciones Pendientes</span>
            <span>{acciones.length} items</span>
          </div>
          
          <ScrollArea className="h-[280px]">
            {acciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-500" />
                <p className="text-sm font-medium">¡Sin acciones pendientes!</p>
                <p className="text-xs">La agenda está al día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {acciones.map((accion) => (
                  <div
                    key={accion.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${getAccionColor(accion.tipo, accion.prioridad)}`}
                    onClick={() => onAccionClick?.(accion)}
                  >
                    <div className={`p-1.5 rounded-md bg-background/80`}>
                      {getAccionIcon(accion.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm truncate">{accion.cliente_nombre}</p>
                        {getPrioridadBadge(accion.prioridad)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {accion.descripcion}
                      </p>
                      {accion.monto && (
                        <p className="text-xs font-medium mt-0.5">
                          {formatCurrency(accion.monto)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
