import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCSCartera, useDeactivateCliente, useReactivateCliente, type CarteraSegment } from '@/hooks/useCSCartera';
import { CSClienteProfileModal } from './CSClienteProfileModal';
import { UserMinus, UserPlus, Filter } from 'lucide-react';
import { format } from 'date-fns';

const SEGMENT_CONFIG: { key: CarteraSegment; label: string; description: string }[] = [
  { key: 'activos', label: 'Con servicio', description: 'Servicio en últimos 90d' },
  { key: 'sin_servicio', label: 'Sin servicio 90d+', description: 'Sin actividad reciente' },
  { key: 'en_riesgo', label: 'En Riesgo', description: 'Requieren atención' },
  { key: 'dados_baja', label: 'Dados de baja', description: 'Inactivos con motivo' },
];

const DOT = {
  verde: 'bg-green-500',
  amarillo: 'bg-amber-500',
  rojo: 'bg-red-500',
};

export function CSCartera() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filtro') as CarteraSegment | null;
  const [activeSegment, setActiveSegment] = useState<CarteraSegment | 'todos'>(initialFilter || 'todos');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [bajaModal, setBajaModal] = useState<{ id: string; nombre: string } | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [reactivarModal, setReactivarModal] = useState<{ id: string; nombre: string } | null>(null);

  const { data: cartera, isLoading } = useCSCartera();
  const deactivate = useDeactivateCliente();
  const reactivate = useReactivateCliente();

  const filtered = useMemo(() => {
    if (!cartera) return [];
    if (activeSegment === 'todos') return cartera;
    return cartera.filter(c => c.segment === activeSegment);
  }, [cartera, activeSegment]);

  const counts = useMemo(() => {
    if (!cartera) return {} as Record<string, number>;
    const c: Record<string, number> = { todos: cartera.length };
    SEGMENT_CONFIG.forEach(s => { c[s.key] = cartera.filter(cl => cl.segment === s.key).length; });
    return c;
  }, [cartera]);

  const handleBaja = () => {
    if (!bajaModal || !motivoBaja.trim()) return;
    deactivate.mutate({ id: bajaModal.id, motivo: motivoBaja.trim() }, {
      onSuccess: () => { setBajaModal(null); setMotivoBaja(''); },
    });
  };

  const handleReactivar = () => {
    if (!reactivarModal) return;
    reactivate.mutate(reactivarModal.id, {
      onSuccess: () => setReactivarModal(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Segment Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          variant={activeSegment === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSegment('todos')}
          className="rounded-full"
        >
          Todos ({counts.todos || 0})
        </Button>
        {SEGMENT_CONFIG.map(seg => (
          <Button
            key={seg.key}
            variant={activeSegment === seg.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSegment(seg.key)}
            className="rounded-full"
          >
            {seg.label} ({counts[seg.key] || 0})
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Último Servicio</TableHead>
                  <TableHead className="text-center">Servicios 90d</TableHead>
                  <TableHead className="text-center">GMV 90d</TableHead>
                  <TableHead className="text-center">Quejas</TableHead>
                  <TableHead className="text-center">CSAT</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No hay clientes en este segmento
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(c => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-accent/30"
                      onClick={() => setSelectedClienteId(c.id)}
                    >
                      <TableCell>
                        <div className={`h-3 w-3 rounded-full ${DOT[c.salud]}`} title={`Salud: ${c.salud}`} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.nombre}</p>
                          {!c.activo && c.motivo_baja && (
                            <p className="text-xs text-destructive">Baja: {c.motivo_baja}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {c.ultimo_servicio
                          ? format(new Date(c.ultimo_servicio), 'dd/MM/yy')
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">{c.servicios_90d}</TableCell>
                      <TableCell className="text-center text-sm">
                        ${(c.gmv_90d / 1000).toFixed(0)}K
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {c.quejas_abiertas > 0
                          ? <span className="text-destructive font-medium">{c.quejas_abiertas}</span>
                          : <span className="text-muted-foreground">0</span>
                        }
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {c.csat ? c.csat.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        {c.activo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => setBajaModal({ id: c.id, nombre: c.nombre })}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Dar de baja
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 gap-1"
                            onClick={() => setReactivarModal({ id: c.id, nombre: c.nombre })}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Reactivar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deactivation Modal */}
      <Dialog open={!!bajaModal} onOpenChange={open => { if (!open) { setBajaModal(null); setMotivoBaja(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja a {bajaModal?.nombre}</DialogTitle>
            <DialogDescription>
              El cliente será marcado como inactivo y dejará de aparecer en las métricas activas. Esta acción es reversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Motivo de baja <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Ej: Cliente sin operaciones desde marzo 2025, sin respuesta a seguimientos..."
              value={motivoBaja}
              onChange={e => setMotivoBaja(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBajaModal(null); setMotivoBaja(''); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBaja}
              disabled={!motivoBaja.trim() || deactivate.isPending}
            >
              {deactivate.isPending ? 'Procesando...' : 'Confirmar Baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivation Modal */}
      <Dialog open={!!reactivarModal} onOpenChange={open => { if (!open) setReactivarModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivar a {reactivarModal?.nombre}</DialogTitle>
            <DialogDescription>
              El cliente volverá a aparecer como activo en las métricas del módulo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivarModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReactivar} disabled={reactivate.isPending}>
              {reactivate.isPending ? 'Procesando...' : 'Confirmar Reactivación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <CSClienteProfileModal
        clienteId={selectedClienteId}
        onClose={() => setSelectedClienteId(null)}
      />
    </div>
  );
}
