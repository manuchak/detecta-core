import { useState } from 'react';
import { useCSQuejas } from '@/hooks/useCSQuejas';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CSQuejaDetail } from './CSQuejaDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_COLORS: Record<string, string> = {
  abierta: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  en_investigacion: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  accion_correctiva: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  seguimiento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cerrada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  reabierta: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const SEVERIDAD_COLORS: Record<string, string> = {
  baja: 'bg-slate-100 text-slate-700',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

const TIPO_LABELS: Record<string, string> = {
  calidad_servicio: 'Calidad',
  facturacion: 'Facturación',
  cobertura: 'Cobertura',
  seguridad: 'Seguridad',
  consignas: 'Consignas',
  otro: 'Otro',
};

export function CSQuejasList() {
  const [filters, setFilters] = useState<{ estado?: string; tipo?: string }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: quejas, isLoading } = useCSQuejas(filters);

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filters.estado || 'all'} onValueChange={v => setFilters(f => ({ ...f, estado: v === 'all' ? undefined : v }))}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="abierta">Abierta</SelectItem>
            <SelectItem value="en_investigacion">En investigación</SelectItem>
            <SelectItem value="accion_correctiva">Acción correctiva</SelectItem>
            <SelectItem value="seguimiento">Seguimiento</SelectItem>
            <SelectItem value="cerrada">Cerrada</SelectItem>
            <SelectItem value="reabierta">Reabierta</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.tipo || 'all'} onValueChange={v => setFilters(f => ({ ...f, tipo: v === 'all' ? undefined : v }))}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="calidad_servicio">Calidad del servicio</SelectItem>
            <SelectItem value="facturacion">Facturación</SelectItem>
            <SelectItem value="cobertura">Cobertura</SelectItem>
            <SelectItem value="seguridad">Seguridad</SelectItem>
            <SelectItem value="consignas">Consignas</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !quejas?.length ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No hay quejas registradas con estos filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {quejas.map(q => (
            <Card
              key={q.id}
              className="cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => setSelectedId(q.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-primary">{q.numero_queja}</span>
                      <Badge variant="outline" className={ESTADO_COLORS[q.estado] || ''}>
                        {q.estado.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className={SEVERIDAD_COLORS[q.severidad] || ''}>
                        {q.severidad}
                      </Badge>
                    </div>
                    <p className="text-sm truncate">{q.descripcion}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{q.cliente?.nombre || 'Sin cliente'}</span>
                      <span>·</span>
                      <span>{TIPO_LABELS[q.tipo] || q.tipo}</span>
                      <span>·</span>
                      <span>{format(new Date(q.created_at), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Queja</DialogTitle>
          </DialogHeader>
          {selectedId && <CSQuejaDetail quejaId={selectedId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
