import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Save, Loader2 } from 'lucide-react';
import { useConciliacion, useConciliacionDetalle, useUpdateDetalleResolucion, useFinalizeConciliacion } from '../../hooks/useConciliacion';
import { useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cxpId: string;
}

const RESULT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  coincide: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Coincide' },
  discrepancia_monto: { icon: AlertTriangle, color: 'text-amber-600', label: 'Diferencia' },
  solo_proveedor: { icon: XCircle, color: 'text-red-500', label: 'Solo Prov.' },
  solo_detecta: { icon: XCircle, color: 'text-blue-500', label: 'Solo Det.' },
};

const RESOLUCION_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aceptado', label: 'Aceptado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'ajustado', label: 'Ajustado' },
];

export function ConciliacionDetalleSheet({ open, onOpenChange, cxpId }: Props) {
  const { data: conciliacion } = useConciliacion(cxpId);
  const { data: detalles = [] } = useConciliacionDetalle(conciliacion?.id);
  const updateResolucion = useUpdateDetalleResolucion();
  const finalizeMutation = useFinalizeConciliacion();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMontoFinal, setEditMontoFinal] = useState('');

  if (!conciliacion) return null;

  const formatCurrency = (v: number | null) =>
    v != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v) : '—';

  const pendingCount = detalles.filter(d => d.resolucion === 'pendiente').length;
  const canFinalize = pendingCount === 0 && conciliacion.estado === 'pendiente';

  const handleResolucion = (det: any, resolucion: string) => {
    const montoFinal = resolucion === 'aceptado'
      ? (det.monto_proveedor ?? det.monto_detecta)
      : resolucion === 'rechazado'
        ? 0
        : null;

    updateResolucion.mutate({
      id: det.id,
      resolucion,
      monto_final: montoFinal,
    });
  };

  const handleSaveMontoFinal = (detId: string) => {
    const val = parseFloat(editMontoFinal);
    if (isNaN(val)) return;
    updateResolucion.mutate({
      id: detId,
      resolucion: 'ajustado',
      monto_final: val,
    });
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Resolución de Conciliación</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Card className="p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Coinciden</p>
              <p className="text-lg font-bold text-emerald-600">{conciliacion.coincidencias}</p>
            </Card>
            <Card className="p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Discrepancias</p>
              <p className="text-lg font-bold text-amber-600">{conciliacion.discrepancias_monto}</p>
            </Card>
            <Card className="p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Solo Prov.</p>
              <p className="text-lg font-bold text-red-500">{conciliacion.solo_proveedor}</p>
            </Card>
            <Card className="p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Solo Det.</p>
              <p className="text-lg font-bold text-blue-500">{conciliacion.solo_detecta}</p>
            </Card>
            <Card className="p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Pendientes</p>
              <p className={`text-lg font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{pendingCount}</p>
            </Card>
          </div>

          {/* State badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={conciliacion.estado === 'conciliado' ? 'secondary' : 'outline'}>
                {conciliacion.estado === 'conciliado' ? 'Conciliado' : 'Pendiente resolución'}
              </Badge>
              <span className="text-xs text-muted-foreground">Archivo: {conciliacion.archivo_nombre}</span>
            </div>
            {canFinalize && (
              <Button
                size="sm"
                onClick={() => finalizeMutation.mutate(conciliacion.id)}
                disabled={finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Finalizar Conciliación
              </Button>
            )}
          </div>

          {/* Detail table */}
          <div className="overflow-x-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] w-20">Resultado</TableHead>
                  <TableHead className="text-[10px] text-right">Monto Det.</TableHead>
                  <TableHead className="text-[10px] text-right">Monto Prov.</TableHead>
                  <TableHead className="text-[10px] text-right">Diferencia</TableHead>
                  <TableHead className="text-[10px] text-right">Monto Final</TableHead>
                  <TableHead className="text-[10px]">Resolución</TableHead>
                  <TableHead className="text-[10px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.map(det => {
                  const cfg = RESULT_CONFIG[det.resultado] || RESULT_CONFIG.solo_detecta;
                  const Icon = cfg.icon;
                  const isEditing = editingId === det.id;

                  return (
                    <TableRow key={det.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Icon className={`h-3 w-3 ${cfg.color}`} />
                          <span className="text-[10px]">{cfg.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-right">{formatCurrency(det.monto_detecta)}</TableCell>
                      <TableCell className="text-[11px] text-right">{formatCurrency(det.monto_proveedor)}</TableCell>
                      <TableCell className={`text-[11px] text-right ${det.diferencia && det.diferencia !== 0 ? 'text-amber-600 font-medium' : ''}`}>
                        {formatCurrency(det.diferencia)}
                      </TableCell>
                      <TableCell className="text-[11px] text-right font-medium">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="h-6 w-20 text-[10px]"
                              value={editMontoFinal}
                              onChange={e => setEditMontoFinal(e.target.value)}
                            />
                            <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => handleSaveMontoFinal(det.id)}>
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => {
                              setEditingId(det.id);
                              setEditMontoFinal(String(det.monto_final ?? ''));
                            }}
                          >
                            {formatCurrency(det.monto_final)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={det.resolucion === 'aceptado' ? 'secondary' : det.resolucion === 'rechazado' ? 'destructive' : 'outline'}
                          className="text-[9px]"
                        >
                          {det.resolucion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {det.resolucion === 'pendiente' && conciliacion.estado === 'pendiente' && (
                          <Select onValueChange={v => handleResolucion(det, v)}>
                            <SelectTrigger className="h-6 text-[10px] w-24">
                              <SelectValue placeholder="Resolver" />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOLUCION_OPTIONS.filter(o => o.value !== 'pendiente').map(o => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
