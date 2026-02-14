import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCSTouchpoints, type CSTouchpoint } from '@/hooks/useCSTouchpoints';
import { useCSCartera } from '@/hooks/useCSCartera';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, AlertTriangle, Phone, Mail, MessageCircle, Users2, MapPin, Calendar } from 'lucide-react';
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

export function CSTouchpointsList() {
  const { data: touchpoints, isLoading } = useCSTouchpoints();
  const { data: cartera } = useCSCartera();
  const { data: profiles } = useCSMProfiles();

  const [filterCSM, setFilterCSM] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filtered = useMemo(() => {
    if (!touchpoints) return [];
    let items = [...touchpoints];

    if (filterCSM !== 'todos') items = items.filter(t => t.created_by === filterCSM);
    if (filterTipo !== 'todos') items = items.filter(t => t.tipo === filterTipo);
    if (filterOverdue) {
      items = items.filter(t => t.fecha_siguiente_accion && isBefore(new Date(t.fecha_siguiente_accion), today));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(t =>
        t.resumen?.toLowerCase().includes(q) ||
        t.contacto_nombre?.toLowerCase().includes(q) ||
        clienteMap.get(t.cliente_id)?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [touchpoints, filterCSM, filterTipo, filterOverdue, searchTerm, clienteMap, today]);

  if (isLoading) {
    return <div className="space-y-4 mt-4"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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

        <button
          onClick={() => setFilterOverdue(!filterOverdue)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            filterOverdue
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-background border-border text-muted-foreground hover:bg-accent'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Vencidos ({touchpoints?.filter(t => t.fecha_siguiente_accion && isBefore(new Date(t.fecha_siguiente_accion), today)).length || 0})
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} touchpoint{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Resumen</TableHead>
                <TableHead>Siguiente acción</TableHead>
                <TableHead>Registrado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No hay touchpoints registrados
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(t => {
                  const Icon = TIPO_ICONS[t.tipo] || Phone;
                  const isOverdue = t.fecha_siguiente_accion && isBefore(new Date(t.fecha_siguiente_accion), today);

                  return (
                    <TableRow key={t.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(t.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {clienteMap.get(t.cliente_id) || 'Desconocido'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm capitalize">{t.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.direccion === 'entrante' ? 'secondary' : 'outline'} className="text-xs">
                          {t.direccion === 'entrante' ? '← Entrante' : '→ Saliente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.contacto_nombre || <span className="text-muted-foreground/50 italic">—</span>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate" title={t.resumen}>
                        {t.resumen}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.siguiente_accion ? (
                          <div className="space-y-0.5">
                            <p className="truncate max-w-[180px]" title={t.siguiente_accion}>{t.siguiente_accion}</p>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {t.created_by ? (profileMap.get(t.created_by) || '—') : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
