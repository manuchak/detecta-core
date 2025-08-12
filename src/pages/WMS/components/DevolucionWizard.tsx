import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useDevolucionesProveedor } from '@/hooks/useDevolucionesProveedor';
import { useSerialesProducto } from '@/hooks/useSerialesProducto';
import { Dialog, DialogContent, DialogHeader as DxHeader, DialogTitle as DxTitle, DialogDescription as DxDesc } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface DevolucionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemSeleccionado {
  producto_id: string;
  nombre: string;
  disponible: number;
  cantidad: number;
  costo_unitario?: number;
  es_serializado?: boolean;
  seriales?: string[]; // IDs de productos_serie
  serialNumeros?: string[]; // Para mostrar
}

const PasoIndicator = ({ step }: { step: number }) => {
  const steps = [
    { id: 1, label: 'Proveedor' },
    { id: 2, label: 'Productos' },
    { id: 3, label: 'Costos' },
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

export const DevolucionWizard = ({ open, onOpenChange }: DevolucionWizardProps) => {
  const { productos } = useProductosInventario();
  const { crearDevolucion, agregarDetalle } = useDevolucionesProveedor();

  const [step, setStep] = useState(1);
  const [numeroRMA, setNumeroRMA] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [notas, setNotas] = useState('');
  const [query, setQuery] = useState('');
  const [seleccion, setSeleccion] = useState<Record<string, ItemSeleccionado>>({});
  const selectedArray = useMemo(() => Object.values(seleccion), [seleccion]);

  // Seriales modal
  const [serialModalProduct, setSerialModalProduct] = useState<string | null>(null);
  const { data: serialesDisponibles = [] } = useSerialesProducto(serialModalProduct || undefined);
  const [serialTemp, setSerialTemp] = useState<string[]>([]);
  
  const openSerials = (pid: string) => {
    setSerialModalProduct(pid);
    setSerialTemp(seleccion[pid]?.seriales || []);
  };

  const toggleSerial = (id: string) => {
    setSerialTemp((prev) => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
  };

  const saveSerials = () => {
    if (!serialModalProduct) return;
    const qty = seleccion[serialModalProduct]?.cantidad || 0;
    if (serialTemp.length !== qty) {
      toast.error(`Selecciona exactamente ${qty} serie(s)`);
      return;
    }
    const numeros = serialesDisponibles.filter((s:any)=> serialTemp.includes(s.id)).map((s:any)=> s.numero_serie || '');
    setSeleccion((prev)=> ({
      ...prev,
      [serialModalProduct]: {
        ...prev[serialModalProduct],
        es_serializado: true,
        seriales: serialTemp,
        serialNumeros: numeros,
      }
    }));
    setSerialModalProduct(null);
  };

  useEffect(() => {
    if (!open) {
      // Reset al cerrar
      setStep(1);
      setNumeroRMA('');
      setProveedorId('');
      setNotas('');
      setQuery('');
      setSeleccion({});
    }
  }, [open]);

  const productosFiltrados = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (productos || []).filter((p: any) => {
      const match = term
        ? (p?.nombre || '').toLowerCase().includes(term) ||
          (p?.codigo_producto || '').toLowerCase().includes(term)
        : true;
      const disponible = p?.stock?.cantidad_disponible ?? 0;
      return match && disponible > 0; // solo con stock disponible
    });
  }, [productos, query]);

  const totalItems = selectedArray.reduce((acc, it) => acc + (it.cantidad || 0), 0);
  const totalValor = selectedArray.reduce((acc, it) => acc + ((it.costo_unitario || 0) * (it.cantidad || 0)), 0);

  const canNextFromPaso1 = true; // opcionales RMA y proveedor
  const canNextFromPaso2 = selectedArray.length > 0 && selectedArray.every(it => {
    const baseOk = it.cantidad > 0 && it.cantidad <= it.disponible;
    const serialOk = !it.es_serializado || ((it.seriales?.length || 0) === it.cantidad);
    return baseOk && serialOk;
  });
  const canNextFromPaso3 = selectedArray.every(it => (it.costo_unitario ?? 0) >= 0);

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  const toggleProducto = (p: any) => {
    const disponible = p?.stock?.cantidad_disponible ?? 0;
    setSeleccion((prev) => {
      if (prev[p.id]) {
        const { [p.id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [p.id]: {
          producto_id: p.id,
          nombre: p.nombre,
          disponible,
          cantidad: 1,
          costo_unitario: p?.precio_compra_promedio ?? 0,
          es_serializado: !!p?.es_serializado,
          seriales: [],
          serialNumeros: [],
        },
      };
    });
  };

  const updateCantidad = (pid: string, qty: number) => {
    setSeleccion((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], cantidad: Math.max(0, Math.min(qty, prev[pid].disponible)) },
    }));
  };

  const updateCosto = (pid: string, cost: number) => {
    setSeleccion((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], costo_unitario: isFinite(cost) ? Math.max(0, cost) : 0 },
    }));
  };

  const handleConfirm = async () => {
    try {
      const devolucion = await crearDevolucion.mutateAsync({
        numero_rma: numeroRMA || undefined,
        proveedor_id: proveedorId || undefined,
        notas: notas || undefined,
      });

      // Agregar detalles por cada ítem seleccionado
      for (const it of selectedArray) {
        await agregarDetalle.mutateAsync({
          devolucion_id: devolucion.id,
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          motivo: notas || undefined,
          seriales: it.seriales || [],
          costo_unitario: it.costo_unitario ?? 0,
        });
      }

      toast.success('Devolución creada con detalles');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Error al crear devolución');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-3xl w-full">
        <div className="flex items-center justify-between mb-4">
          <SheetHeader>
            <SheetTitle>Nueva devolución (RMA)</SheetTitle>
          </SheetHeader>
          <PasoIndicator step={step} />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Número RMA (opcional)</label>
                <input value={numeroRMA} onChange={e=>setNumeroRMA(e.target.value)} className="mt-1 w-full border rounded-md h-10 px-3 bg-background" />
              </div>
              <div>
                <label className="text-sm">Proveedor ID (opcional)</label>
                <input value={proveedorId} onChange={e=>setProveedorId(e.target.value)} className="mt-1 w-full border rounded-md h-10 px-3 bg-background" />
              </div>
            </div>
            <div>
              <label className="text-sm">Notas</label>
              <textarea value={notas} onChange={e=>setNotas(e.target.value)} className="mt-1 w-full border rounded-md p-3 bg-background" rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={goNext} disabled={!canNextFromPaso1}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                placeholder="Buscar productos…"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                className="w-full border rounded-md h-10 px-3 bg-background"
              />
            </div>
            <div className="max-h-[50vh] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 sticky top-0">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-right p-3">Disp.</th>
                    <th className="text-right p-3">Cantidad</th>
                    <th className="text-right p-3">Sel.</th>
                  </tr>
                </thead>
                <tbody>
                  {(productosFiltrados as any[]).map((p:any)=>{
                    const disponible = p?.stock?.cantidad_disponible ?? 0;
                    const sel = seleccion[p.id];
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-muted-foreground text-xs">{p.codigo_producto || p.marca || ''}</div>
                        </td>
                        <td className="p-3 text-right">{disponible}</td>
                        <td className="p-3 text-right">
                          {sel ? (
                            <input
                              type="number"
                              min={1}
                              max={disponible}
                              value={sel.cantidad}
                              onChange={(e)=>updateCantidad(p.id, parseInt(e.target.value||'0'))}
                              className="w-24 border rounded-md h-9 px-3 bg-background text-right ml-auto"
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <Button size="sm" variant={sel? 'secondary':'outline'} onClick={()=>toggleProducto(p)}>
                              {sel ? 'Quitar' : 'Agregar'}
                            </Button>
                            {p?.es_serializado && sel && (
                              <Button size="sm" variant="outline" onClick={()=>openSerials(p.id)}>
                                Series { (sel.seriales?.length || 0) }/{ sel.cantidad }
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">Seleccionados: {selectedArray.length} • Total qty: {totalItems}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goPrev}>Atrás</Button>
                <Button onClick={goNext} disabled={!canNextFromPaso2}>Continuar</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-right p-3">Cantidad</th>
                    <th className="text-right p-3">Costo unitario</th>
                    <th className="text-right p-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedArray.map((it)=> (
                    <tr key={it.producto_id} className="border-t">
                      <td className="p-3">{it.nombre}</td>
                      <td className="p-3 text-right">{it.cantidad}</td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.costo_unitario ?? 0}
                          onChange={(e)=>updateCosto(it.producto_id, parseFloat(e.target.value||'0'))}
                          className="w-28 border rounded-md h-9 px-3 bg-background text-right ml-auto"
                        />
                      </td>
                      <td className="p-3 text-right">{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format((it.costo_unitario||0)*it.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Define costos; por defecto usamos el costo promedio/capturado.</div>
              <div className="text-right">
                <div className="text-sm">Valor total</div>
                <div className="text-xl font-semibold">{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(totalValor)}</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={goPrev}>Atrás</Button>
              <Button onClick={goNext} disabled={!canNextFromPaso3}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Proveedor</div>
                <div className="font-medium">{proveedorId || '—'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Número RMA</div>
                <div className="font-medium">{numeroRMA || '—'}</div>
              </div>
              <div>
                <div className="text-sm mb-1">Notas</div>
                <div className="text-muted-foreground text-sm whitespace-pre-line min-h-10">{notas || '—'}</div>
              </div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-right p-3">Cantidad</th>
                    <th className="text-right p-3">Costo unit.</th>
                    <th className="text-right p-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedArray.map((it)=> (
                    <tr key={it.producto_id} className="border-t">
                      <td className="p-3">{it.nombre}</td>
                      <td className="p-3 text-right">{it.cantidad}</td>
                      <td className="p-3 text-right">{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(it.costo_unitario||0)}</td>
                      <td className="p-3 text-right">{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format((it.costo_unitario||0)*it.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="p-3 font-medium" colSpan={3}>Total</td>
                    <td className="p-3 text-right font-semibold">{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(totalValor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={goPrev}>Atrás</Button>
              <Button onClick={handleConfirm} disabled={crearDevolucion.isPending || agregarDetalle.isPending}>
                {crearDevolucion.isPending || agregarDetalle.isPending ? 'Creando…' : 'Confirmar devolución'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
