import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCSCartera, useDeactivateCliente, useReactivateCliente, type CarteraSegment, type CarteraCliente } from '@/hooks/useCSCartera';
import { useCreateCSTouchpoint } from '@/hooks/useCSTouchpoints';
import { useAssignCSM, useBulkAssignCSM, useCSMOptions } from '@/hooks/useAssignCSM';
import { CSClienteProfileModal } from './CSClienteProfileModal';
import { UserMinus, UserPlus, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, MessageSquarePlus, Users, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const SEGMENT_CONFIG: { key: CarteraSegment; label: string }[] = [
  { key: 'activos', label: 'Con servicio' },
  { key: 'sin_servicio', label: 'Sin servicio 90d+' },
  { key: 'en_riesgo', label: 'En Riesgo' },
  { key: 'dados_baja', label: 'Dados de baja' },
];

const DOT = {
  verde: 'bg-green-500',
  amarillo: 'bg-amber-500',
  rojo: 'bg-red-500',
};

type SortKey = 'nombre' | 'ultimo_servicio' | 'gmv_90d' | 'quejas_abiertas' | 'csat' | 'dias_sin_contacto' | 'servicios_90d';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

function useCurrentUserId() {
  return useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: Infinity,
  });
}

export function CSCartera() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filtro') as CarteraSegment | null;
  const [activeSegment, setActiveSegment] = useState<CarteraSegment | 'todos'>(initialFilter || 'todos');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [bajaModal, setBajaModal] = useState<{ id: string; nombre: string } | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [reactivarModal, setReactivarModal] = useState<{ id: string; nombre: string } | null>(null);

  // Phase 1.1: CSM filter
  const [miCartera, setMiCartera] = useState(false);
  const { data: currentUserId } = useCurrentUserId();

  // Phase 1.2: Search, sort, pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  // Phase 1.3: Quick touchpoint
  const [touchpointModal, setTouchpointModal] = useState<{ id: string; nombre: string } | null>(null);
  const [tpResumen, setTpResumen] = useState('');
  const [tpTipo, setTpTipo] = useState('llamada');
  const [tpContacto, setTpContacto] = useState('');
  const [tpSiguienteAccion, setTpSiguienteAccion] = useState('');
  const [tpFechaSiguiente, setTpFechaSiguiente] = useState('');
  const [tpDuracion, setTpDuracion] = useState('');
  const createTouchpoint = useCreateCSTouchpoint();
  const assignCSM = useAssignCSM();
  const bulkAssignCSM = useBulkAssignCSM();
  const { data: csmOptions } = useCSMOptions();

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCsmModal, setBulkCsmModal] = useState(false);
  const [bulkCsmId, setBulkCsmId] = useState('');

  const { data: cartera, isLoading } = useCSCartera();
  const deactivate = useDeactivateCliente();
  const reactivate = useReactivateCliente();

  const processed = useMemo(() => {
    if (!cartera) return { items: [], total: 0, totalPages: 0 };

    let items = [...cartera];

    // Segment filter
    if (activeSegment !== 'todos') items = items.filter(c => c.segment === activeSegment);

    // CSM filter
    if (miCartera && currentUserId) items = items.filter(c => c.csm_asignado === currentUserId);

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.razon_social?.toLowerCase().includes(q) ||
        c.csm_nombre?.toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) cmp = 0;
      else if (av == null) cmp = 1;
      else if (bv == null) cmp = -1;
      else if (typeof av === 'string') cmp = av.localeCompare(bv as string);
      else cmp = (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const paged = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return { items: paged, total, totalPages };
  }, [cartera, activeSegment, miCartera, currentUserId, searchTerm, sortKey, sortDir, page]);

  const counts = useMemo(() => {
    if (!cartera) return {} as Record<string, number>;
    const base = miCartera && currentUserId ? cartera.filter(c => c.csm_asignado === currentUserId) : cartera;
    const c: Record<string, number> = { todos: base.length };
    SEGMENT_CONFIG.forEach(s => { c[s.key] = base.filter(cl => cl.segment === s.key).length; });
    return c;
  }, [cartera, miCartera, currentUserId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

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

  const resetTpModal = () => {
    setTouchpointModal(null);
    setTpResumen('');
    setTpTipo('llamada');
    setTpContacto('');
    setTpSiguienteAccion('');
    setTpFechaSiguiente('');
    setTpDuracion('');
  };

  const handleQuickTouchpoint = () => {
    if (!touchpointModal || !tpResumen.trim()) return;
    createTouchpoint.mutate({
      cliente_id: touchpointModal.id,
      tipo: tpTipo,
      direccion: 'saliente',
      resumen: tpResumen.trim(),
      ...(tpContacto.trim() && { contacto_nombre: tpContacto.trim() }),
      ...(tpSiguienteAccion.trim() && { siguiente_accion: tpSiguienteAccion.trim() }),
      ...(tpFechaSiguiente && { fecha_siguiente_accion: tpFechaSiguiente }),
      ...(tpDuracion && { duracion_minutos: Number(tpDuracion) }),
    }, {
      onSuccess: resetTpModal,
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = () => {
    if (!bulkCsmId || selectedIds.size === 0) return;
    bulkAssignCSM.mutate({ clienteIds: Array.from(selectedIds), csmId: bulkCsmId }, {
      onSuccess: () => { setBulkCsmModal(false); setBulkCsmId(''); setSelectedIds(new Set()); },
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
      {/* Top bar: search + CSM toggle + bulk assign */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o razón social..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Button
          variant={miCartera ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMiCartera(!miCartera); setPage(0); }}
          className="gap-1.5"
        >
          <Users className="h-4 w-4" />
          {miCartera ? 'Mi Cartera' : 'Todos'}
        </Button>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkCsmModal(true)}
            className="gap-1.5"
          >
            <UserCog className="h-4 w-4" />
            Asignar CSM ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Segment Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          variant={activeSegment === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setActiveSegment('todos'); setPage(0); }}
          className="rounded-full"
        >
          Todos ({counts.todos || 0})
        </Button>
        {SEGMENT_CONFIG.map(seg => (
          <Button
            key={seg.key}
            variant={activeSegment === seg.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveSegment(seg.key); setPage(0); }}
            className="rounded-full"
          >
            {seg.label} ({counts[seg.key] || 0})
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {processed.total} cliente{processed.total !== 1 ? 's' : ''} encontrado{processed.total !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedIds.size > 0 && processed.items.every(c => selectedIds.has(c.id))}
                      onChange={e => {
                        if (e.target.checked) setSelectedIds(new Set(processed.items.map(c => c.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('nombre')}>
                    <div className="flex items-center">Cliente<SortIcon col="nombre" /></div>
                  </TableHead>
                  <TableHead>CSM</TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('ultimo_servicio')}>
                    <div className="flex items-center justify-center">Último Serv.<SortIcon col="ultimo_servicio" /></div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('servicios_90d')}>
                    <div className="flex items-center justify-center">Serv. 90d<SortIcon col="servicios_90d" /></div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('gmv_90d')}>
                    <div className="flex items-center justify-center">GMV 90d<SortIcon col="gmv_90d" /></div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('quejas_abiertas')}>
                    <div className="flex items-center justify-center">Quejas<SortIcon col="quejas_abiertas" /></div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('csat')}>
                    <div className="flex items-center justify-center">CSAT<SortIcon col="csat" /></div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('dias_sin_contacto')}>
                    <div className="flex items-center justify-center">Días s/c<SortIcon col="dias_sin_contacto" /></div>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      No hay clientes en este segmento
                    </TableCell>
                  </TableRow>
                ) : (
                  processed.items.map(c => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-accent/30"
                      onClick={() => setSelectedClienteId(c.id)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelection(c.id)}
                        />
                      </TableCell>
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
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Select
                          value={c.csm_asignado || '__none'}
                          onValueChange={val => assignCSM.mutate({ clienteId: c.id, csmId: val === '__none' ? null : val })}
                        >
                          <SelectTrigger className={`h-7 text-xs w-[140px] ${!c.csm_asignado ? 'border-amber-300 dark:border-amber-700' : ''}`}>
                            <SelectValue placeholder="Sin asignar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Sin asignar</SelectItem>
                            {csmOptions?.map(o => (
                              <SelectItem key={o.id} value={o.id}>{o.display_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <TableCell className="text-center text-sm">
                        {c.dias_sin_contacto < 999 ? (
                          <span className={c.dias_sin_contacto > 60 ? 'text-destructive font-medium' : c.dias_sin_contacto > 30 ? 'text-amber-600 font-medium' : ''}>
                            {c.dias_sin_contacto}d
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-primary hover:text-primary"
                            onClick={() => setTouchpointModal({ id: c.id, nombre: c.nombre })}
                            title="Registrar contacto"
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                          </Button>
                          {c.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                              onClick={() => setBajaModal({ id: c.id, nombre: c.nombre })}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 gap-1"
                              onClick={() => setReactivarModal({ id: c.id, nombre: c.nombre })}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {processed.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {processed.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= processed.totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Touchpoint Modal */}
      <Dialog open={!!touchpointModal} onOpenChange={open => { if (!open) resetTpModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar contacto — {touchpointModal?.nombre}</DialogTitle>
            <DialogDescription>Registra un touchpoint rápido para este cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Tipo de contacto</label>
                <Select value={tpTipo} onValueChange={setTpTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llamada">Llamada</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Persona contactada</label>
                <Input
                  placeholder="Nombre del contacto"
                  value={tpContacto}
                  onChange={e => setTpContacto(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Resumen <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Ej: Seguimiento sobre operación del mes, sin novedades..."
                value={tpResumen}
                onChange={e => setTpResumen(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Siguiente paso</label>
                <Input
                  placeholder="Ej: Enviar cotización..."
                  value={tpSiguienteAccion}
                  onChange={e => setTpSiguienteAccion(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha seguimiento</label>
                <Input
                  type="date"
                  value={tpFechaSiguiente}
                  onChange={e => setTpFechaSiguiente(e.target.value)}
                />
              </div>
            </div>
            <div className="w-1/2">
              <label className="text-sm font-medium">Duración (min)</label>
              <Input
                type="number"
                placeholder="Opcional"
                value={tpDuracion}
                onChange={e => setTpDuracion(e.target.value)}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetTpModal}>Cancelar</Button>
            <Button onClick={handleQuickTouchpoint} disabled={!tpResumen.trim() || createTouchpoint.isPending}>
              {createTouchpoint.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Modal */}
      <Dialog open={!!bajaModal} onOpenChange={open => { if (!open) { setBajaModal(null); setMotivoBaja(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja a {bajaModal?.nombre}</DialogTitle>
            <DialogDescription>El cliente será marcado como inactivo. Esta acción es reversible.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Motivo de baja <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="Ej: Cliente sin operaciones desde marzo 2025..."
              value={motivoBaja}
              onChange={e => setMotivoBaja(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBajaModal(null); setMotivoBaja(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBaja} disabled={!motivoBaja.trim() || deactivate.isPending}>
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
            <DialogDescription>El cliente volverá a aparecer como activo en las métricas.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivarModal(null)}>Cancelar</Button>
            <Button onClick={handleReactivar} disabled={reactivate.isPending}>
              {reactivate.isPending ? 'Procesando...' : 'Confirmar Reactivación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk CSM Assignment Modal */}
      <Dialog open={bulkCsmModal} onOpenChange={open => { if (!open) { setBulkCsmModal(false); setBulkCsmId(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar CSM a {selectedIds.size} clientes</DialogTitle>
            <DialogDescription>Selecciona el CSM que se asignará a los clientes seleccionados.</DialogDescription>
          </DialogHeader>
          <Select value={bulkCsmId} onValueChange={setBulkCsmId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar CSM..." /></SelectTrigger>
            <SelectContent>
              {csmOptions?.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkCsmModal(false); setBulkCsmId(''); }}>Cancelar</Button>
            <Button onClick={handleBulkAssign} disabled={!bulkCsmId || bulkAssignCSM.isPending}>
              {bulkAssignCSM.isPending ? 'Asignando...' : 'Confirmar'}
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
