import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, 
  Mail, 
  Users, 
  HandCoins, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useCobranzaSeguimiento, SeguimientoCobranza } from '../../hooks/useCuentasPorCobrar';
import { formatCurrency } from '@/utils/formatUtils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialCobranzaTimelineProps {
  clienteId?: string;
  clienteNombre?: string;
  maxItems?: number;
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'llamada':
      return <Phone className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'visita':
      return <Users className="h-4 w-4" />;
    case 'promesa_pago':
      return <HandCoins className="h-4 w-4" />;
    case 'escalamiento':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'llamada':
      return 'bg-blue-500 text-white';
    case 'email':
      return 'bg-indigo-500 text-white';
    case 'visita':
      return 'bg-emerald-500 text-white';
    case 'promesa_pago':
      return 'bg-purple-500 text-white';
    case 'escalamiento':
      return 'bg-red-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getResultadoBadge = (resultado: string | null) => {
  switch (resultado) {
    case 'exitoso':
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]">Exitoso</Badge>;
    case 'sin_respuesta':
      return <Badge variant="secondary" className="text-[10px]">Sin respuesta</Badge>;
    case 'rechazado':
      return <Badge className="bg-red-500/10 text-red-700 border-red-500/30 text-[10px]">Rechazado</Badge>;
    case 'reprogramar':
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]">Reprogramar</Badge>;
    default:
      return null;
  }
};

const getPromesaStatus = (seguimiento: SeguimientoCobranza) => {
  if (seguimiento.tipo_accion !== 'promesa_pago' || !seguimiento.fecha_promesa_pago) {
    return null;
  }

  const fechaPromesa = new Date(seguimiento.fecha_promesa_pago);
  const hoy = new Date();
  const vencida = fechaPromesa < hoy;

  if (seguimiento.promesa_cumplida === true) {
    return (
      <div className="flex items-center gap-1 text-emerald-600 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Cumplida</span>
      </div>
    );
  }

  if (seguimiento.promesa_cumplida === false || vencida) {
    return (
      <div className="flex items-center gap-1 text-red-600 text-xs">
        <XCircle className="h-3.5 w-3.5" />
        <span>No cumplida</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-amber-600 text-xs">
      <Clock className="h-3.5 w-3.5" />
      <span>Pendiente ({format(fechaPromesa, 'dd/MM')})</span>
    </div>
  );
};

export function HistorialCobranzaTimeline({ 
  clienteId, 
  clienteNombre,
  maxItems = 20 
}: HistorialCobranzaTimelineProps) {
  const { data: seguimientos = [], isLoading } = useCobranzaSeguimiento(clienteId);

  const displayItems = seguimientos.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {clienteNombre ? `Historial: ${clienteNombre}` : 'Historial de Cobranza'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-[350px] pr-4">
          {displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No hay gestiones registradas</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
              
              <div className="space-y-4">
                {displayItems.map((seg, index) => (
                  <div key={seg.id} className="relative flex gap-4 pl-1">
                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${getTipoColor(seg.tipo_accion)}`}>
                      {getTipoIcon(seg.tipo_accion)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-4 border-b last:border-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm capitalize">
                            {seg.tipo_accion.replace('_', ' ')}
                          </span>
                          {getResultadoBadge(seg.resultado)}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(seg.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {seg.descripcion}
                      </p>
                      
                      {/* Contact info */}
                      {(seg.contacto_nombre || seg.contacto_telefono) && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Contacto: {seg.contacto_nombre} {seg.contacto_telefono && `(${seg.contacto_telefono})`}
                        </p>
                      )}
                      
                      {/* Promise info */}
                      {seg.tipo_accion === 'promesa_pago' && seg.monto_prometido && (
                        <div className="flex items-center gap-3 mt-2 p-2 rounded-md bg-muted/50">
                          <div>
                            <span className="text-xs text-muted-foreground">Monto prometido:</span>
                            <p className="font-bold text-sm">{formatCurrency(seg.monto_prometido)}</p>
                          </div>
                          {seg.fecha_promesa_pago && (
                            <div>
                              <span className="text-xs text-muted-foreground">Para:</span>
                              <p className="font-medium text-sm">
                                {format(new Date(seg.fecha_promesa_pago), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                          )}
                          <div className="ml-auto">
                            {getPromesaStatus(seg)}
                          </div>
                        </div>
                      )}
                      
                      {/* Next action */}
                      {seg.proxima_accion && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
                          <Clock className="h-3 w-3" />
                          <span>Próxima acción: {format(new Date(seg.proxima_accion), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
