// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TIPOS = [
  { value: 'robo', label: 'Robo' },
  { value: 'asalto', label: 'Asalto' },
  { value: 'accidente_vial', label: 'Accidente vial' },
  { value: 'agresion', label: 'Agresión' },
  { value: 'extorsion', label: 'Extorsión' },
  { value: 'perdida_mercancia', label: 'Pérdida de mercancía' },
  { value: 'falla_gps', label: 'Falla GPS' },
  { value: 'protocolo_incumplido', label: 'Protocolo incumplido' },
  { value: 'otro', label: 'Otro' },
];

const SEVERIDADES = [
  { value: 'baja', label: 'Baja', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'media', label: 'Media', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-500/10 text-orange-600' },
  { value: 'critica', label: 'Crítica', color: 'bg-red-500/10 text-red-600' },
];

const CONTROLES = ['GPS activo', 'Protocolo pavor', 'Botón pánico', 'Custodio armado', 'Escolta', 'Ruta alterna'];

interface IncidentFormData {
  tipo: string;
  severidad: string;
  descripcion: string;
  zona: string;
  atribuible_operacion: boolean;
  controles_activos: string[];
  control_efectivo: boolean;
  cliente_nombre: string;
}

const defaultForm: IncidentFormData = {
  tipo: '',
  severidad: '',
  descripcion: '',
  zona: '',
  atribuible_operacion: false,
  controles_activos: [],
  control_efectivo: false,
  cliente_nombre: '',
};

export const IncidentPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<IncidentFormData>(defaultForm);
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidentes-operativos-recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidentes_operativos')
        .select('id, tipo, severidad, descripcion, zona, estado, fecha_incidente, atribuible_operacion')
        .order('fecha_incidente', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      const { error } = await supabase.from('incidentes_operativos').insert({
        tipo: data.tipo,
        severidad: data.severidad,
        descripcion: data.descripcion,
        zona: data.zona || null,
        atribuible_operacion: data.atribuible_operacion,
        controles_activos: data.controles_activos,
        control_efectivo: data.control_efectivo,
        cliente_nombre: data.cliente_nombre || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Incidente registrado');
      queryClient.invalidateQueries({ queryKey: ['incidentes-operativos-recent'] });
      queryClient.invalidateQueries({ queryKey: ['starmap-kpis'] });
      setForm(defaultForm);
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipo || !form.severidad || !form.descripcion) {
      toast.error('Completa tipo, severidad y descripción');
      return;
    }
    createMutation.mutate(form);
  };

  const toggleControl = (ctrl: string) => {
    setForm(prev => ({
      ...prev,
      controles_activos: prev.controles_activos.includes(ctrl)
        ? prev.controles_activos.filter(c => c !== ctrl)
        : [...prev.controles_activos, ctrl],
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Incidentes Operativos
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Reportar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Reportar Incidente
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo *</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Severidad *</Label>
                    <Select value={form.severidad} onValueChange={v => setForm(p => ({ ...p, severidad: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {SEVERIDADES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descripción *</Label>
                  <Textarea
                    value={form.descripcion}
                    onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Describe lo ocurrido..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Zona</Label>
                    <Input
                      value={form.zona}
                      onChange={e => setForm(p => ({ ...p, zona: e.target.value }))}
                      placeholder="Ej: CDMX Norte"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cliente</Label>
                    <Input
                      value={form.cliente_nombre}
                      onChange={e => setForm(p => ({ ...p, cliente_nombre: e.target.value }))}
                      placeholder="Nombre cliente"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.atribuible_operacion}
                    onCheckedChange={v => setForm(p => ({ ...p, atribuible_operacion: !!v }))}
                  />
                  <Label className="text-xs">Atribuible a la operación</Label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Controles activos al momento</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONTROLES.map(ctrl => (
                      <button
                        key={ctrl}
                        type="button"
                        onClick={() => toggleControl(ctrl)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                          form.controles_activos.includes(ctrl)
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {ctrl}
                      </button>
                    ))}
                  </div>
                </div>

                {form.controles_activos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form.control_efectivo}
                      onCheckedChange={v => setForm(p => ({ ...p, control_efectivo: !!v }))}
                    />
                    <Label className="text-xs">Los controles fueron efectivos</Label>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Registrando...' : 'Registrar Incidente'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Cargando...</p>
        ) : incidents.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Sin incidentes registrados</p>
            <p className="text-[10px] text-muted-foreground mt-1">Reporta incidentes para alimentar los KPIs R1-R4</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {incidents.map(inc => {
              const sev = SEVERIDADES.find(s => s.value === inc.severidad);
              return (
                <div key={inc.id} className="flex items-center justify-between py-1.5 px-2 text-xs hover:bg-muted/30 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge className={`text-[9px] h-4 px-1.5 shrink-0 ${sev?.color || ''}`}>
                      {inc.severidad}
                    </Badge>
                    <span className="truncate">{TIPOS.find(t => t.value === inc.tipo)?.label || inc.tipo}</span>
                    {inc.atribuible_operacion && (
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inc.zona && <span className="text-[10px] text-muted-foreground">{inc.zona}</span>}
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {format(new Date(inc.fecha_incidente), 'dd/MM')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
