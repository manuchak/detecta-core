import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Settings2, Search, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { useReglasEstadias, useCreateReglaEstadia } from '../../../hooks/useReglasEstadias';
import { usePcClientes } from '../../../hooks/usePcClientes';
import { useEstadiasCalculadas } from '../../../hooks/useEstadiasCalculadas';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function EstadiasPanel() {
  const [showConfig, setShowConfig] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('');
  const { data: reglas = [], isLoading: loadingReglas } = useReglasEstadias();
  const { data: clientes = [] } = usePcClientes();
  const { data: estadias = [], isLoading: loadingEstadias } = useEstadiasCalculadas();

  const clienteMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes.forEach(c => map.set(c.id, c.nombre));
    return map;
  }, [clientes]);

  const estadiasFiltradas = useMemo(() => {
    if (!filtroCliente) return estadias;
    const q = filtroCliente.toLowerCase();
    return estadias.filter(e => e.cliente.toLowerCase().includes(q));
  }, [estadias, filtroCliente]);

  const totalExcedente = estadias.reduce((s, e) => s + e.horasExcedentes, 0);
  const totalCobro = estadias.reduce((s, e) => s + e.cobroEstimado, 0);
  const sinTarifa = estadias.filter(e => e.tarifaHora === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Estadías y Cortesías</h3>
          <p className="text-sm text-muted-foreground">
            Servicios con tiempo en destino que excede la cortesía del cliente.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
          <Settings2 className="h-4 w-4 mr-2" />
          {showConfig ? 'Ver Estadías' : 'Configurar Reglas'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Servicios c/ Excedente</p>
              <p className="text-lg font-bold">{estadias.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Horas Excedentes</p>
              <p className="text-lg font-bold">{Math.round(totalExcedente * 10) / 10}h</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Cobro Estimado</p>
              <p className="text-lg font-bold">{formatCurrency(totalCobro)}</p>
            </div>
          </div>
        </Card>
        {sinTarifa > 0 && (
          <Card className="p-3 border-amber-500/30">
            <div className="flex items-center gap-2">
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Sin Tarifa</p>
                <p className="text-lg font-bold text-amber-600">{sinTarifa}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {showConfig ? (
        /* Rules config view */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Reglas de Cortesía por Cliente</CardTitle>
              <Button size="sm" onClick={() => setShowAddRule(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nueva Regla
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo Servicio</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead className="text-right">Hrs Cortesía</TableHead>
                  <TableHead className="text-right">Hrs Local</TableHead>
                  <TableHead className="text-right">Hrs Foráneo</TableHead>
                  <TableHead className="text-right">$/Hr Excedente</TableHead>
                  <TableHead>Pernocta</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingReglas ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : reglas.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    Sin reglas override. Se usa tarifa_hora_estadia de pc_clientes como fallback.
                  </TableCell></TableRow>
                ) : (
                  reglas.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">
                        {clienteMap.get(r.cliente_id) || r.cliente_id.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.tipo_servicio || 'Default'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.ruta_patron || 'Todas'}</TableCell>
                      <TableCell className="text-right font-medium">{r.horas_cortesia}h</TableCell>
                      <TableCell className="text-right text-sm">{(r as any).horas_cortesia_local ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm">{(r as any).horas_cortesia_foraneo ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm">${r.tarifa_hora_excedente}</TableCell>
                      <TableCell>
                        {r.cobra_pernocta ? (
                          <Badge variant="secondary" className="text-xs">${r.tarifa_pernocta}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.notas || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Calculated stays view */
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={filtroCliente}
                onChange={e => setFiltroCliente(e.target.value)}
                placeholder="Filtrar por cliente..."
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 60 días · {estadiasFiltradas.length} servicios con excedente
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>L/F</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Tiempo Destino</TableHead>
                    <TableHead className="text-right">Cortesía</TableHead>
                    <TableHead className="text-right">Excedente</TableHead>
                    <TableHead className="text-right">Tarifa/Hr</TableHead>
                    <TableHead className="text-right">Cobro Est.</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEstadias ? (
                    <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Calculando estadías...</TableCell></TableRow>
                  ) : estadiasFiltradas.length === 0 ? (
                    <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Sin servicios con excedente de estadía
                    </TableCell></TableRow>
                  ) : (
                    estadiasFiltradas.map(e => (
                      <TableRow key={e.servicioId}>
                        <TableCell className="text-xs font-mono">{e.folio}</TableCell>
                        <TableCell className="text-sm font-medium">{e.cliente}</TableCell>
                        <TableCell className="text-xs">{e.ruta}</TableCell>
                        <TableCell>
                          <Badge variant={e.localForaneo === 'Foráneo' ? 'default' : 'outline'} className="text-[10px]">
                            {e.localForaneo === 'Foráneo' ? 'F' : 'L'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{e.fechaServicio}</TableCell>
                        <TableCell className="text-right text-sm">{e.horasEnDestino}h</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{e.horasCortesia}h</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {e.horasExcedentes}h
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {e.tarifaHora > 0 ? `$${e.tarifaHora}` : (
                            <span className="text-amber-500 text-xs">Sin tarifa</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold">
                          {e.cobroEstimado > 0 ? formatCurrency(e.cobroEstimado) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.facturado ? 'secondary' : 'outline'} className="text-[10px]">
                            {e.facturado ? 'Facturado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <AddRuleDialog open={showAddRule} onOpenChange={setShowAddRule} clientes={clientes} />
    </div>
  );
}

function AddRuleDialog({ open, onOpenChange, clientes }: { 
  open: boolean; 
  onOpenChange: (v: boolean) => void; 
  clientes: Array<{ id: string; nombre: string }>;
}) {
  const [form, setForm] = useState({
    cliente_id: '',
    tipo_servicio: '',
    ruta_patron: '',
    horas_cortesia: '0',
    horas_cortesia_local: '',
    horas_cortesia_foraneo: '',
    tarifa_hora_excedente: '0',
    tarifa_sin_arma: '',
    tarifa_con_arma: '',
    tarifa_pernocta: '0',
    cobra_pernocta: false,
    requiere_tickets: false,
    notas: '',
  });
  const [clienteSearch, setClienteSearch] = useState('');
  const createMutation = useCreateReglaEstadia();

  const filteredClientes = useMemo(() => {
    if (!clienteSearch) return clientes.slice(0, 20);
    const term = clienteSearch.toLowerCase();
    return clientes.filter(c => c.nombre.toLowerCase().includes(term)).slice(0, 20);
  }, [clientes, clienteSearch]);

  const selectedCliente = clientes.find(c => c.id === form.cliente_id);

  const handleSubmit = async () => {
    if (!form.cliente_id) return;
    await createMutation.mutateAsync({
      cliente_id: form.cliente_id,
      tipo_servicio: form.tipo_servicio || null,
      ruta_patron: form.ruta_patron || null,
      horas_cortesia: Number(form.horas_cortesia),
      tarifa_hora_excedente: Number(form.tarifa_hora_excedente),
      tarifa_pernocta: Number(form.tarifa_pernocta),
      cobra_pernocta: form.cobra_pernocta,
      notas: form.notas || null,
      activo: true,
      horas_cortesia_local: form.horas_cortesia_local ? Number(form.horas_cortesia_local) : null,
      horas_cortesia_foraneo: form.horas_cortesia_foraneo ? Number(form.horas_cortesia_foraneo) : null,
      tarifa_sin_arma: form.tarifa_sin_arma ? Number(form.tarifa_sin_arma) : null,
      tarifa_con_arma: form.tarifa_con_arma ? Number(form.tarifa_con_arma) : null,
      requiere_tickets: form.requiere_tickets,
    } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nueva Regla de Cortesía</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Cliente *</Label>
            {!form.cliente_id ? (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    value={clienteSearch} 
                    onChange={e => setClienteSearch(e.target.value)} 
                    placeholder="Buscar cliente por nombre..."
                    className="pl-8"
                  />
                </div>
                {filteredClientes.length > 0 && (
                  <div className="max-h-[150px] overflow-auto border rounded-md">
                    {filteredClientes.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => { setForm(f => ({ ...f, cliente_id: c.id })); setClienteSearch(''); }}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{selectedCliente?.nombre}</Badge>
                <Button variant="ghost" size="sm" className="h-6 text-xs"
                  onClick={() => setForm(f => ({ ...f, cliente_id: '' }))}>
                  Cambiar
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo Servicio</Label>
              <Select value={form.tipo_servicio} onValueChange={v => setForm(f => ({ ...f, tipo_servicio: v }))}>
                <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="foraneo">Foráneo</SelectItem>
                  <SelectItem value="dedicado">Dedicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ruta Patrón</Label>
              <Input value={form.ruta_patron} onChange={e => setForm(f => ({ ...f, ruta_patron: e.target.value }))} placeholder="ej: CDMX-GDL" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Hrs Cortesía *</Label>
              <Input type="number" value={form.horas_cortesia} onChange={e => setForm(f => ({ ...f, horas_cortesia: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hrs Local</Label>
              <Input type="number" value={form.horas_cortesia_local} onChange={e => setForm(f => ({ ...f, horas_cortesia_local: e.target.value }))} placeholder="—" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hrs Foráneo</Label>
              <Input type="number" value={form.horas_cortesia_foraneo} onChange={e => setForm(f => ({ ...f, horas_cortesia_foraneo: e.target.value }))} placeholder="—" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">$/Hr Excedente</Label>
              <Input type="number" value={form.tarifa_hora_excedente} onChange={e => setForm(f => ({ ...f, tarifa_hora_excedente: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">$/Sin Arma</Label>
              <Input type="number" value={form.tarifa_sin_arma} onChange={e => setForm(f => ({ ...f, tarifa_sin_arma: e.target.value }))} placeholder="—" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">$/Con Arma</Label>
              <Input type="number" value={form.tarifa_con_arma} onChange={e => setForm(f => ({ ...f, tarifa_con_arma: e.target.value }))} placeholder="—" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">$/Pernocta</Label>
              <Input type="number" value={form.tarifa_pernocta} onChange={e => setForm(f => ({ ...f, tarifa_pernocta: e.target.value }))} />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="req_tickets" checked={form.requiere_tickets} onChange={e => setForm(f => ({ ...f, requiere_tickets: e.target.checked }))} className="h-4 w-4 rounded border-border" />
                <label htmlFor="req_tickets" className="text-xs">Requiere tickets</label>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.cliente_id || createMutation.isPending}>Crear Regla</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
