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
import { Plus, Settings2, Search } from 'lucide-react';
import { useReglasEstadias, useCreateReglaEstadia } from '../../../hooks/useReglasEstadias';
import { usePcClientes } from '../../../hooks/usePcClientes';

export function EstadiasPanel() {
  const [showConfig, setShowConfig] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const { data: reglas = [], isLoading } = useReglasEstadias();
  const { data: clientes = [] } = usePcClientes();

  // Map cliente IDs to names for display
  const clienteMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes.forEach(c => map.set(c.id, c.nombre));
    return map;
  }, [clientes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Estadías y Cortesías</h3>
          <p className="text-sm text-muted-foreground">
            Reglas de horas de cortesía por cliente, tipo de servicio y ruta.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
          <Settings2 className="h-4 w-4 mr-2" />
          Configurar Reglas
        </Button>
      </div>

      {showConfig && (
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
                  <TableHead className="text-right">$/Hr Excedente</TableHead>
                  <TableHead>Pernocta</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : reglas.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Sin reglas configuradas. Se usará el fallback de horas_cortesia del cliente.
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
      )}

      {!showConfig && (
        <Card className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Las estadías se calculan automáticamente comparando las detenciones registradas 
              contra las horas de cortesía configuradas por cliente.
            </p>
            <p className="text-xs text-muted-foreground">
              {reglas.length} regla(s) configurada(s). Click "Configurar Reglas" para gestionar.
            </p>
          </div>
        </Card>
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
    tarifa_hora_excedente: '0',
    tarifa_pernocta: '0',
    cobra_pernocta: false,
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
    });
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
              <Label className="text-xs">$/Hr Excedente</Label>
              <Input type="number" value={form.tarifa_hora_excedente} onChange={e => setForm(f => ({ ...f, tarifa_hora_excedente: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">$/Pernocta</Label>
              <Input type="number" value={form.tarifa_pernocta} onChange={e => setForm(f => ({ ...f, tarifa_pernocta: e.target.value }))} />
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
