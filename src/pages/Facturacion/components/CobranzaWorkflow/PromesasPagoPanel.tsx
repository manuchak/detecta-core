import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HandCoins,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { usePromesasPago, useUpdatePromesaStatus, PromesaPago } from '../../hooks/useCobranzaWorkflow';
import { formatCurrency } from '@/utils/formatUtils';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getEstadoConfig = (estado: PromesaPago['estado']) => {
  switch (estado) {
    case 'cumplida':
      return { 
        color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', 
        icon: CheckCircle2,
        label: 'Cumplida' 
      };
    case 'incumplida':
      return { 
        color: 'bg-red-500/10 text-red-700 border-red-500/30', 
        icon: XCircle,
        label: 'Incumplida' 
      };
    case 'parcial':
      return { 
        color: 'bg-amber-500/10 text-amber-700 border-amber-500/30', 
        icon: AlertTriangle,
        label: 'Parcial' 
      };
    default:
      return { 
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/30', 
        icon: Clock,
        label: 'Pendiente' 
      };
  }
};

export function PromesasPagoPanel() {
  const { data: promesas, isLoading } = usePromesasPago();
  const updateStatus = useUpdatePromesaStatus();
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'incumplida'>('all');

  const filteredPromesas = (promesas || []).filter(p => {
    if (filter === 'all') return true;
    return p.estado === filter;
  });

  // Group by status
  const pendientes = filteredPromesas.filter(p => p.estado === 'pendiente');
  const incumplidas = filteredPromesas.filter(p => p.estado === 'incumplida');
  const cumplidas = filteredPromesas.filter(p => p.estado === 'cumplida');

  const handleMarkCumplida = (id: string) => {
    updateStatus.mutate({ id, cumplida: true });
  };

  const handleMarkIncumplida = (id: string) => {
    updateStatus.mutate({ id, cumplida: false });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const renderPromesaCard = (promesa: PromesaPago) => {
    const estadoConfig = getEstadoConfig(promesa.estado);
    const EstadoIcon = estadoConfig.icon;
    const fechaPromesa = promesa.fecha_promesa ? new Date(promesa.fecha_promesa) : null;
    const diasRestantes = fechaPromesa ? differenceInDays(fechaPromesa, new Date()) : 0;
    const esHoy = fechaPromesa && isToday(fechaPromesa);
    const esPasado = fechaPromesa && isPast(fechaPromesa) && !esHoy;

    return (
      <div
        key={promesa.id}
        className={cn(
          'p-3 rounded-lg border transition-colors',
          estadoConfig.color
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{promesa.cliente_nombre}</p>
            {promesa.numero_factura && (
              <p className="text-xs text-muted-foreground">
                Factura: {promesa.numero_factura}
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn('shrink-0 text-[10px] flex items-center gap-1', estadoConfig.color)}>
            <EstadoIcon className="h-3 w-3" />
            {estadoConfig.label}
          </Badge>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <HandCoins className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">{formatCurrency(promesa.monto_prometido)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={cn(
              esPasado && promesa.estado === 'pendiente' && 'text-red-600 font-medium',
              esHoy && 'text-amber-600 font-medium'
            )}>
              {fechaPromesa ? format(fechaPromesa, 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
            </span>
          </div>
        </div>

        {/* Contact info */}
        {(promesa.contacto_nombre || promesa.contacto_telefono) && (
          <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
            {promesa.contacto_nombre && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {promesa.contacto_nombre}
              </span>
            )}
            {promesa.contacto_telefono && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {promesa.contacto_telefono}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {promesa.descripcion && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {promesa.descripcion}
          </p>
        )}

        {/* Actions */}
        {promesa.estado === 'pendiente' && (
          <div className="flex items-center gap-2 pt-2 border-t border-current/10">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Marcar cumplida
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar promesa cumplida?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción marcará la promesa de pago de {promesa.cliente_nombre} por{' '}
                    {formatCurrency(promesa.monto_prometido)} como cumplida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleMarkCumplida(promesa.id)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {esPasado && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:text-red-700">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Marcar incumplida
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar promesa incumplida?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción marcará la promesa de pago como incumplida y escalará el workflow de cobranza.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleMarkIncumplida(promesa.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <div className="flex-1" />
            
            {esHoy && (
              <span className="text-[10px] bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded">
                Vence hoy
              </span>
            )}
            {diasRestantes > 0 && diasRestantes <= 3 && (
              <span className="text-[10px] text-muted-foreground">
                {diasRestantes} día{diasRestantes > 1 ? 's' : ''} restante{diasRestantes > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-purple-600" />
            Promesas de Pago
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              className="h-6 px-2 text-xs"
              onClick={() => setFilter('all')}
            >
              Todas ({promesas?.length || 0})
            </Button>
            <Button
              size="sm"
              variant={filter === 'pendiente' ? 'secondary' : 'ghost'}
              className="h-6 px-2 text-xs"
              onClick={() => setFilter('pendiente')}
            >
              Pendientes ({pendientes.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'incumplida' ? 'secondary' : 'ghost'}
              className="h-6 px-2 text-xs text-red-600"
              onClick={() => setFilter('incumplida')}
            >
              Incumplidas ({incumplidas.length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 min-h-0">
        <ScrollArea className="h-full">
          {filteredPromesas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <HandCoins className="h-10 w-10 mb-2 text-purple-300" />
              <p className="text-sm font-medium">Sin promesas de pago</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {filteredPromesas.map(renderPromesaCard)}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
