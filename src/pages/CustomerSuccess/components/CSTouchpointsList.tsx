import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCSTouchpoints, useCompleteTouchpoint, useRescheduleTouchpoint, useCreateCSTouchpoint, type CSTouchpoint } from '@/hooks/useCSTouchpoints';
import { useCSCartera } from '@/hooks/useCSCartera';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Phone, Mail, MessageCircle, Users2, MapPin, Calendar, Plus, Check, CalendarClock, History, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const TIPO_ICONS: Record<string, React.ElementType> = {
  llamada: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  reunion: Users2,
  visita: MapPin,
};

function useCSMProfiles() {
  return useQuery({
    queryKey: ['csm-profiles-for-touchpoints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .order('display_name');
      if (error) throw error;
      return data || [];
    },
  });
}

interface Props {
  onClienteClick?: (clienteId: string) => void;
  initialTab?: string;
}

export function CSTouchpointsList({ onClienteClick, initialTab }: Props) {
  const { data: touchpoints, isLoading } = useCSTouchpoints();
  const { data: cartera } = useCSCartera();
  const { data: profiles } = useCSMProfiles();
  const completeTp = useCompleteTouchpoint();
  const rescheduleTp = useRescheduleTouchpoint();
  const createTp = useCreateCSTouchpoint();

  const [activeTab, setActiveTab] = useState(initialTab || 'pendientes');
  const [filterCSM, setFilterCSM] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [newTpOpen, setNewTpOpen] = useState(false);

  // New touchpoint form
  const [tpClienteId, setTpClienteId] = useState('');
  const [tpTipo, setTpTipo] = useState('llamada');
  const [tpDireccion, setTpDireccion] = useState('saliente');
  const [tpContacto, setTpContacto] = useState('');
  const [tpResumen, setTpResumen] = useState('');
  const [tpSiguienteAccion, setTpSiguienteAccion] = useState('');
  const [tpFechaSiguiente, setTpFechaSiguiente] = useState('');
  const [tpDuracion, setTpDuracion] = useState('');

  const clienteMap = useMemo(() => {
    const map = new Map<string, string>();
    cartera?.forEach(c => map.set(c.id, c.nombre));
    return map;
  }, [cartera]);

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles?.forEach(p => map.set(p.id, p.display_name || 'Sin nombre'));
    return map;
  }, [profiles]);

  const today = startOfDay(new Date());

  const categorized = useMemo(() => {
    if (!touchpoints) return { pendientes: [], vencidos: [], historial: [] };

    let items = [...touchpoints];
    if (filterCSM !== 'todos') items = items.filter(t => t.created_by === filterCSM);
    if (filterTipo !== 'todos') items = items.filter(t => t.tipo === filterTipo);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(t =>
        t.resumen?.toLowerCase().includes(q) ||
        t.contacto_nombre?.toLowerCase().includes(q) ||
        clienteMap.get(t.cliente_id)?.toLowerCase().includes(q)
      );
    }

    const pendientes: CSTouchpoint[] = [];
    const vencidos: CSTouchpoint[] = [];
    const historial: CSTouchpoint[] = [];

    items.forEach(t => {
      if (t.estado === 'pendiente' && t.fecha_siguiente_accion && isBefore(new Date(t.fecha_siguiente_accion), today)) {
        vencidos.push(t);
      } else if (t.estado === 'pendiente') {
        pendientes.push(t);
      } else {
        historial.push(t);
      }
    });

    return { pendientes, vencidos, historial };
  }, [touchpoints, filterCSM, filterTipo, searchTerm, clienteMap, today]);

  const handleReschedule = () => {
    if (!rescheduleId || !rescheduleDate) return;
    rescheduleTp.mutate({ id: rescheduleId, fecha: rescheduleDate }, {
      onSuccess: () => { setRescheduleId(null); setRescheduleDate(''); },
    });
  };

  const resetNewTp = () => {
    setNewTpOpen(false);
    setTpClienteId('');
    setTpTipo('llamada');
    setTpDireccion('saliente');
    setTpContacto('');
    setTpResumen('');
    setTpSiguienteAccion('');
    setTpFechaSiguiente('');
    setTpDuracion('');
  };

  const handleCreateTp = () => {
    if (!tpClienteId || !tpResumen.trim()) return;
    createTp.mutate({
      cliente_id: tpClienteId,
      tipo: tpTipo,
      direccion: tpDireccion,
      resumen: tpResumen.trim(),
      ...(tpContacto.trim() && { contacto_nombre: tpContacto.trim() }),
      ...(tpSiguienteAccion.trim() && { siguiente_accion: tpSiguienteAccion.trim() }),
      ...(tpFechaSiguiente && { fecha_siguiente_accion: tpFechaSiguiente }),
      ...(tpDuracion && { duracion_minutos: Number(tpDuracion) }),
    }, { onSuccess: resetNewTp });
  };

  const renderRow = (t: CSTouchpoint, showActions: boolean) => {
    const Icon = TIPO_ICONS[t.tipo] || Phone;
    const isOverdue = t.estado === 'pendiente' && t.fecha_siguiente_accion && isBefore(new Date(t.fecha_siguiente_accion), today);

    return (
      <TableRow key={t.id} className={isOverdue ? 'bg-destructive/5' : ''}>
        <TableCell className="text-sm whitespace-nowrap">
          {format(new Date(t.created_at), 'dd/MM/yy', { locale: es })}
        </TableCell>
        <TableCell>
          <button
            className="text-sm font-medium text-primary hover:underline text-left"
            onClick={() => onClienteClick?.(t.cliente_id)}
          >
            {clienteMap.get(t.cliente_id) || 'Desconocido'}
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm capitalize">{t.tipo}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm max-w-[200px] truncate" title={t.resumen}>
          {t.resumen}
        </TableCell>
        <TableCell className="text-sm">
          {t.siguiente_accion ? (
            <div className="space-y-0.5">
              <p className="truncate max-w-[160px]" title={t.siguiente_accion}>{t.siguiente_accion}</p>
              {t.fecha_siguiente_accion && (
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(t.fecha_siguiente_accion), 'dd/MM/yy')}
                  {isOverdue && ' ⚠️'}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/50 italic">—</span>
          )}
        </TableCell>
        <TableCell>
          {t.estado === 'pendiente' ? (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
              Pendiente
            </Badge>
          ) : t.estado === 'cancelado' ? (
            <Badge variant="outline" className="text-xs">Cancelado</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Completado</Badge>
          )}
        </TableCell>
        {showActions && (
          <TableCell>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                onClick={() => completeTp.mutate(t.id)}
                disabled={completeTp.isPending}
              >
                <Check className="h-3 w-3" /> Completar
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                    <CalendarClock className="h-3 w-3" /> Reprogramar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="space-y-2">
                    <Label className="text-xs">Nueva fecha</Label>
                    <Input
                      type="date"
                      value={rescheduleId === t.id ? rescheduleDate : ''}
                      onChange={e => { setRescheduleId(t.id); setRescheduleDate(e.target.value); }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={handleReschedule}
                      disabled={rescheduleId !== t.id || !rescheduleDate || rescheduleTp.isPending}
                    >
                      Confirmar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const renderTable = (items: CSTouchpoint[], showActions: boolean) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Resumen</TableHead>
              <TableHead>Siguiente acción</TableHead>
              <TableHead>Estado</TableHead>
              {showActions && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 7 : 6} className="h-24 text-center text-muted-foreground">
                  Sin touchpoints en esta categoría
                </TableCell>
              </TableRow>
            ) : (
              items.map(t => renderRow(t, showActions))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="space-y-4 mt-4"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, contacto o resumen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="llamada">Llamada</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="reunion">Reunión</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCSM} onValueChange={setFilterCSM}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="CSM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los CSM</SelectItem>
              {profiles?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.display_name || 'Sin nombre'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setNewTpOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nuevo Touchpoint
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vencidos" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Vencidos ({categorized.vencidos.length})
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pendientes ({categorized.pendientes.length})
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Historial ({categorized.historial.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vencidos">
          {renderTable(categorized.vencidos, true)}
        </TabsContent>
        <TabsContent value="pendientes">
          {renderTable(categorized.pendientes, true)}
        </TabsContent>
        <TabsContent value="historial">
          {renderTable(categorized.historial, false)}
        </TabsContent>
      </Tabs>

      {/* New Touchpoint Modal */}
      <Dialog open={newTpOpen} onOpenChange={open => { if (!open) resetNewTp(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Touchpoint</DialogTitle>
            <DialogDescription>Registra un contacto con un cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={tpClienteId} onValueChange={setTpClienteId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {cartera?.filter(c => c.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de contacto</Label>
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
                <Label>Dirección</Label>
                <Select value={tpDireccion} onValueChange={setTpDireccion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saliente">Saliente</SelectItem>
                    <SelectItem value="entrante">Entrante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Persona contactada</Label>
              <Input placeholder="Nombre del contacto" value={tpContacto} onChange={e => setTpContacto(e.target.value)} />
            </div>
            <div>
              <Label>Resumen <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Ej: Seguimiento sobre operación del mes..." value={tpResumen} onChange={e => setTpResumen(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Siguiente paso</Label>
                <Input placeholder="Ej: Enviar cotización..." value={tpSiguienteAccion} onChange={e => setTpSiguienteAccion(e.target.value)} />
              </div>
              <div>
                <Label>Fecha seguimiento</Label>
                <Input type="date" value={tpFechaSiguiente} onChange={e => setTpFechaSiguiente(e.target.value)} />
              </div>
            </div>
            <div className="w-1/2">
              <Label>Duración (min)</Label>
              <Input type="number" placeholder="Opcional" value={tpDuracion} onChange={e => setTpDuracion(e.target.value)} min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetNewTp}>Cancelar</Button>
            <Button onClick={handleCreateTp} disabled={!tpClienteId || !tpResumen.trim() || createTp.isPending}>
              {createTp.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
