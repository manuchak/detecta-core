import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Save, X, AlertTriangle, Bell, ArrowUpRight, Users } from 'lucide-react';
import { EscalationRule } from '@/hooks/useTicketConfig';
import { TicketCategoria } from '@/hooks/useTicketCategories';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EscalationRulesProps {
  rules: EscalationRule[];
  categorias: TicketCategoria[];
  onUpdate: (id: string, updates: Partial<EscalationRule>) => Promise<boolean>;
  onCreate: (rule: Omit<EscalationRule, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onDelete: (id: string) => Promise<boolean>;
}

const CONDICIONES = [
  { value: 'sla_response_vencido', label: 'SLA Respuesta Vencido', icon: AlertTriangle },
  { value: 'sla_resolution_vencido', label: 'SLA Resolución Vencido', icon: AlertTriangle },
  { value: 'sin_respuesta_24h', label: 'Sin Respuesta 24h', icon: Bell },
  { value: 'csat_bajo', label: 'CSAT Bajo', icon: ArrowUpRight },
  { value: 'ticket_reopen', label: 'Ticket Reabierto', icon: AlertTriangle },
];

const ACCIONES = [
  { value: 'notificar', label: 'Notificar' },
  { value: 'reasignar', label: 'Reasignar' },
  { value: 'escalar_supervisor', label: 'Escalar a Supervisor' },
  { value: 'escalar_gerente', label: 'Escalar a Gerente' },
];

const ROLES = [
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'admin', label: 'Administrador' },
];

export const EscalationRules: React.FC<EscalationRulesProps> = ({
  rules,
  categorias,
  onUpdate,
  onCreate,
  onDelete
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<EscalationRule>>({
    nombre: '',
    descripcion: '',
    condicion: 'sla_response_vencido',
    accion: 'notificar',
    destinatario_rol: 'supervisor',
    notificar_email: true,
    notificar_app: true,
    prioridad_minima: 1,
    activo: true,
    orden: rules.length + 1
  });

  const handleCreate = async () => {
    const result = await onCreate(newRule as any);
    if (result) {
      setIsCreating(false);
      setNewRule({
        nombre: '',
        descripcion: '',
        condicion: 'sla_response_vencido',
        accion: 'notificar',
        destinatario_rol: 'supervisor',
        notificar_email: true,
        notificar_app: true,
        prioridad_minima: 1,
        activo: true,
        orden: rules.length + 2
      });
    }
  };

  const handleDelete = async () => {
    if (ruleToDelete) {
      await onDelete(ruleToDelete);
      setRuleToDelete(null);
    }
  };

  const getCondicionLabel = (condicion: string) => {
    return CONDICIONES.find(c => c.value === condicion)?.label || condicion;
  };

  const getAccionLabel = (accion: string) => {
    return ACCIONES.find(a => a.value === accion)?.label || accion;
  };

  const getCondicionIcon = (condicion: string) => {
    const Icon = CONDICIONES.find(c => c.value === condicion)?.icon || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{rules.length}</div>
          <div className="text-sm text-muted-foreground">Total reglas</div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{rules.filter(r => r.activo).length}</div>
          <div className="text-sm text-muted-foreground">Activas</div>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">
            {rules.filter(r => r.accion.includes('escalar')).length}
          </div>
          <div className="text-sm text-muted-foreground">Escalaciones</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Regla
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead className="text-center">Notificaciones</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{rule.nombre}</div>
                    {rule.descripcion && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {rule.descripcion}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {getCondicionIcon(rule.condicion)}
                    {getCondicionLabel(rule.condicion)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={rule.accion.includes('escalar') ? 'destructive' : 'secondary'}>
                    {getAccionLabel(rule.accion)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{rule.destinatario_rol}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Badge variant={rule.notificar_email ? 'default' : 'outline'} className="text-xs">
                      Email
                    </Badge>
                    <Badge variant={rule.notificar_app ? 'default' : 'outline'} className="text-xs">
                      App
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={rule.activo}
                    onCheckedChange={(checked) => onUpdate(rule.id, { activo: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setRuleToDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Regla de Escalación</DialogTitle>
            <DialogDescription>
              Define cuándo y cómo escalar tickets automáticamente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre</Label>
              <Input
                value={newRule.nombre || ''}
                onChange={(e) => setNewRule({ ...newRule, nombre: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Condición</Label>
              <Select 
                value={newRule.condicion}
                onValueChange={(v: any) => setNewRule({ ...newRule, condicion: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDICIONES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Acción</Label>
              <Select 
                value={newRule.accion}
                onValueChange={(v: any) => setNewRule({ ...newRule, accion: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCIONES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Destinatario</Label>
              <Select 
                value={newRule.destinatario_rol || ''}
                onValueChange={(v) => setNewRule({ ...newRule, destinatario_rol: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Categoría</Label>
              <Select 
                value={newRule.categoria_id || 'all'}
                onValueChange={(v) => setNewRule({ ...newRule, categoria_id: v === 'all' ? null : v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Notificar</Label>
              <div className="col-span-3 flex gap-4">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newRule.notificar_email}
                    onCheckedChange={(c) => setNewRule({ ...newRule, notificar_email: c })}
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newRule.notificar_app}
                    onCheckedChange={(c) => setNewRule({ ...newRule, notificar_app: c })}
                  />
                  <span>App</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newRule.nombre}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!ruleToDelete} onOpenChange={() => setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar regla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
