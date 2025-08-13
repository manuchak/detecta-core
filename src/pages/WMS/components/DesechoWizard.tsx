import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader as DxHeader, DialogTitle as DxTitle, DialogDescription as DxDesc } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useDesechosInventario } from '@/hooks/useDesechosInventario';
import { useSerialesProducto } from '@/hooks/useSerialesProducto';
import { toast } from 'sonner';

interface DesechoWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemDesecho {
  producto_id: string;
  nombre: string;
  disponible: number;
  cantidad: number;
  costo_unitario?: number;
  es_serializado?: boolean;
  seriales?: string[]; // IDs productos_serie
  serialNumeros?: string[]; // Para mostrar
  motivo?: string;
}

const PasoIndicator = ({ step }: { step: number }) => {
  const steps = [
    { id: 1, label: 'Producto' },
    { id: 2, label: 'Cantidad/Series' },
    { id: 3, label: 'Costos y motivo' },
    { id: 4, label: 'Resumen' },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-medium ${step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.id}</div>
          <span className={`text-sm ${step === s.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
          {idx < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
        </div>
      ))}
    </div>
  );
};

export const DesechoWizard = ({ open, onOpenChange }: DesechoWizardProps) => {
  const { productos } = useProductosInventario();
  const { crearDesecho } = useDesechosInventario();

  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [item, setItem] = useState<ItemDesecho | null>(null);

  // Modal de series
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const { data: serialesDisponibles = [] } = useSerialesProducto(item?.producto_id);
  const [serialTemp, setSerialTemp] = useState<string[]>([]);

  const abrirSeriales = () => {
    if (!item) return;
    setSerialTemp(item.seriales || []);
    setSerialModalOpen(true);
  };

  const toggleSerial = (id: string) => {
    setSerialTemp((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const guardarSeriales = () => {
    if (!item) return;
    const qty = item.cantidad || 0;
    if (serialTemp.length !== qty) {
      toast.error(`Selecciona exactamente ${qty} serie(s)`);
      return;
    }
    const numeros = serialesDisponibles
      .filter((s: any) => serialTemp.includes(s.id))
      .map((s: any) => s.numero_serie || '');
    setItem({ ...item, es_serializado: true, seriales: serialTemp, serialNumeros: numeros });
    setSerialModalOpen(false);
  };

  useEffect(() => {
    if (!open) {
      // Reset al cerrar
      setStep(1);
      setQuery('');
      setItem(null);
      setSerialModalOpen(false);
      setSerialTemp([]);
    }
  }, [open]);

  const productosFiltrados = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (productos || []).filter((p: any) => {
      const match = term
        ? (p?.nombre || '').toLowerCase().includes(term) || (p?.codigo_producto || '').toLowerCase().includes(term)
        : true;
      const disponible = p?.stock?.cantidad_disponible ?? 0;
      return match && disponible > 0;
    });
  }, [productos, query]);

  const subtotal = (item?.costo_unitario || 0) * (item?.cantidad || 0);

  const canNext1 = !!item; // producto seleccionado
  const canNext2 = !!item && item.cantidad > 0 && item.cantidad <= item.disponible && (!item.es_serializado || (item.seriales?.length || 0) === item.cantidad);
  const canNext3 = !!item && (item.costo_unitario ?? 0) >= 0;

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  const seleccionarProducto = (p: any) => {
    const disponible = p?.stock?.cantidad_disponible ?? 0;
    setItem({
      producto_id: p.id,
      nombre: p.nombre,
      disponible,
      cantidad: 1,
      costo_unitario: p?.precio_compra_promedio ?? 0,
      es_serializado: !!p?.es_serializado,
      seriales: [],
      serialNumeros: [],
      motivo: ''
    });
  };

  const confirmarDesecho = async () => {
    if (!item) return;
    try {
      await crearDesecho.mutateAsync({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        motivo: item.motivo || undefined,
        seriales: item.seriales || [],
        costo_unitario: item.costo_unitario ?? 0,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Error al registrar desecho');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full">
        <div className="flex items-center justify-between mb-4">
          <SheetHeader>
            <SheetTitle>Registrar desecho</SheetTitle>
          </SheetHeader>
          <PasoIndicator step={step} />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm">Buscar producto</label>
              <input
                placeholder="Nombre o código…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1 w-full border rounded-md h-10 px-3 bg-background"
              />
            </div>
            <div className="max-h-[50vh] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 sticky top-0">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-right p-3">Disp.</th>
                    <th className="text-right p-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(productosFiltrados as any[]).map((p: any) => {
                    const disponible = p?.stock?.cantidad_disponible ?? 0;
                    const seleccionado = item?.producto_id === p.id;
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-muted-foreground text-xs">{p.codigo_producto || p.marca || ''}</div>
                        </td>
                        <td className="p-3 text-right">{disponible}</td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant={seleccionado ? 'secondary' : 'outline'} onClick={() => seleccionarProducto(p)}>
                            {seleccionado ? 'Seleccionado' : 'Seleccionar'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={goNext} disabled={!canNext1}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 2 && item && (
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.nombre}</div>
                  <div className="text-muted-foreground text-xs">Disponible: {item.disponible}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Cantidad</span>
                  <input
                    type="number"
                    min={1}
                    max={item.disponible}
                    value={item.cantidad}
                    onChange={(e) => setItem({ ...item, cantidad: Math.max(1, Math.min(parseInt(e.target.value || '1'), item.disponible)) })}
                    className="w-24 border rounded-md h-9 px-3 bg-background text-right"
                  />
                </div>
              </div>
              {item.es_serializado && (
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline" onClick={abrirSeriales}>
                    Series {(item.seriales?.length || 0)}/{item.cantidad}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={goPrev}>Atrás</Button>
              <Button onClick={goNext} disabled={!canNext2}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 3 && item && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Costo unitario</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.costo_unitario ?? 0}
                  onChange={(e) => setItem({ ...item, costo_unitario: Math.max(0, parseFloat(e.target.value || '0')) })}
                  className="mt-1 w-full border rounded-md h-10 px-3 bg-background"
                />
              </div>
              <div>
                <label className="text-sm">Motivo</label>
                <input
                  value={item.motivo || ''}
                  onChange={(e) => setItem({ ...item, motivo: e.target.value })}
                  className="mt-1 w-full border rounded-md h-10 px-3 bg-background"
                  placeholder="Ej. Dañado, extraviado, obsoleto"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-lg font-semibold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotal)}</div>
            </div>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={goPrev}>Atrás</Button>
              <Button onClick={goNext} disabled={!canNext3}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 4 && item && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Producto</div>
                <div className="font-medium">{item.nombre}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Cantidad</div>
                <div className="font-medium">{item.cantidad}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Costo unitario</div>
                <div className="font-medium">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.costo_unitario || 0)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Subtotal</div>
                <div className="font-semibold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotal)}</div>
              </div>
              <div>
                <div className="text-sm mb-1">Motivo</div>
                <div className="text-muted-foreground text-sm min-h-8">{item.motivo || '—'}</div>
              </div>
              {item.es_serializado && (
                <div>
                  <div className="text-sm mb-1">Series seleccionadas</div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">{(item.serialNumeros || []).join(', ') || '—'}</div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={goPrev}>Atrás</Button>
              <Button onClick={confirmarDesecho} disabled={crearDesecho.isPending}>
                {crearDesecho.isPending ? 'Registrando…' : 'Confirmar desecho'}
              </Button>
            </div>
          </div>
        )}

        {/* Modal de series */}
        <Dialog open={serialModalOpen} onOpenChange={setSerialModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DxHeader>
              <DxTitle>Seleccionar series</DxTitle>
              <DxDesc>Elige exactamente {item?.cantidad || 0} serie(s) disponibles</DxDesc>
            </DxHeader>
            <div className="max-h-[50vh] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 sticky top-0">
                  <tr>
                    <th className="text-left p-3">Serie</th>
                    <th className="text-right p-3">Elegir</th>
                  </tr>
                </thead>
                <tbody>
                  {(serialesDisponibles as any[]).map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{s.numero_serie || s.imei || s.mac_address || s.id}</div>
                        <div className="text-xs text-muted-foreground">Estado: {s.estado}</div>
                      </td>
                      <td className="p-3 text-right">
                        <Checkbox
                          checked={serialTemp.includes(s.id)}
                          onCheckedChange={() => toggleSerial(s.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSerialModalOpen(false)}>Cancelar</Button>
              <Button onClick={guardarSeriales}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};
