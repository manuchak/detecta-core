import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useSerialesProducto } from '@/hooks/useSerialesProducto';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { StockProducto } from '@/types/wms';
import { useStockProductos } from '@/hooks/useStockProductos';
import { useToast } from '@/hooks/use-toast';

interface EditStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem: StockProducto | null;
}

interface SerialItem {
  numero_serie: string;
  imei?: string;
  mac_address?: string;
}

export const EditStockDialog = ({ open, onOpenChange, stockItem }: EditStockDialogProps) => {
  const [nuevaCantidad, setNuevaCantidad] = useState<string>('');
  const [motivo, setMotivo] = useState('');
  const [seriales, setSeriales] = useState<SerialItem[]>([]);
  const [paso, setPaso] = useState<'cantidad' | 'seriales'>('cantidad');
  const [serialesSeleccionados, setSerialesSeleccionados] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const { ajustarStock } = useStockProductos();
  const { toast } = useToast();
  const { data: serialesDisponibles = [], isLoading: cargandoSeriales } = useSerialesProducto(stockItem?.producto_id);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && stockItem) {
      setNuevaCantidad(stockItem.cantidad_disponible.toString());
      setMotivo('');
      setSeriales([]);
      setSerialesSeleccionados([]);
      setBusqueda('');
      setPaso('cantidad');
    } else {
      setNuevaCantidad('');
      setMotivo('');
      setSeriales([]);
      setSerialesSeleccionados([]);
      setBusqueda('');
      setPaso('cantidad');
    }
    onOpenChange(newOpen);
  };

  if (!stockItem) return null;

  const esProductoSerializado = stockItem?.producto?.es_serializado || false;
  const diferencia = parseInt(nuevaCantidad || '0') - stockItem.cantidad_disponible;
  const esEntrada = diferencia > 0;
  const cantidadParaSeriales = Math.abs(diferencia);
  const tipoAjuste = diferencia > 0 ? 'entrada' : diferencia < 0 ? 'salida' : 'sin cambio';

  const agregarSerial = () => {
    setSeriales([...seriales, { numero_serie: '', imei: '', mac_address: '' }]);
  };

  const eliminarSerial = (index: number) => {
    setSeriales(seriales.filter((_, i) => i !== index));
  };

  const actualizarSerial = (index: number, campo: keyof SerialItem, valor: string) => {
    const nuevosSeriales = [...seriales];
    nuevosSeriales[index] = { ...nuevosSeriales[index], [campo]: valor };
    setSeriales(nuevosSeriales);
  };

  const toggleSeleccionSerial = (id: string) => {
    setSerialesSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= cantidadParaSeriales) return prev; // no permitir más de lo requerido
      return [...prev, id];
    });
  };

  const validarCantidad = () => {
    const nuevaCantidadNum = parseInt(nuevaCantidad);
    if (isNaN(nuevaCantidadNum) || nuevaCantidadNum < 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número válido mayor o igual a 0.",
        variant: "destructive",
      });
      return false;
    }

    if (!motivo.trim()) {
      toast({
        title: "Error", 
        description: "Debe especificar un motivo para el ajuste.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const continuarASeriales = () => {
    if (!validarCantidad()) return;

    // Si es producto serializado y hay diferencia, ir a paso de seriales
    if (esProductoSerializado && cantidadParaSeriales > 0) {
      if (esEntrada) {
        // Inicializar array de seriales según la cantidad a ingresar
        const serialesIniciales = Array.from({ length: cantidadParaSeriales }, () => ({
          numero_serie: '',
          imei: '',
          mac_address: ''
        }));
        setSeriales(serialesIniciales);
      } else {
        // Salida: limpiar selección previa
        setSerialesSeleccionados([]);
      }
      setPaso('seriales');
    } else {
      // No requiere manejo de seriales
      submitAjuste();
    }
  };

  const volverACantidad = () => {
    setPaso('cantidad');
  };

  const validarSeriales = () => {
    // Verificar que todos los números de serie estén completos
    const serialesIncompletos = seriales.filter(s => !s.numero_serie.trim());
    if (serialesIncompletos.length > 0) {
      toast({
        title: "Error",
        description: "Todos los números de serie son obligatorios.",
        variant: "destructive",
      });
      return false;
    }

    // Verificar que no haya números de serie duplicados
    const numerosSerieUnicos = new Set(seriales.map(s => s.numero_serie.trim()));
    if (numerosSerieUnicos.size !== seriales.length) {
      toast({
        title: "Error",
        description: "No puede haber números de serie duplicados.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validarSeleccionSeriales = () => {
    if (cargandoSeriales) {
      toast({ title: 'Cargando seriales', description: 'Espere un momento…', variant: 'destructive' });
      return false;
    }
    if (serialesDisponibles.length < cantidadParaSeriales) {
      toast({
        title: 'Seriales insuficientes',
        description: `Solo hay ${serialesDisponibles.length} serial(es) disponible(s) y requiere ${cantidadParaSeriales}.`,
        variant: 'destructive',
      });
      return false;
    }
    if (serialesSeleccionados.length !== cantidadParaSeriales) {
      toast({
        title: 'Seleccione seriales',
        description: `Debe seleccionar exactamente ${cantidadParaSeriales} serial(es).`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const submitAjuste = async () => {
    try {
      const datos = {
        producto_id: stockItem.producto_id,
        nueva_cantidad: parseInt(nuevaCantidad),
        motivo: motivo.trim(),
        seriales: esProductoSerializado && esEntrada ? seriales : undefined,
        seriales_salida: esProductoSerializado && !esEntrada ? serialesSeleccionados : undefined,
      } as any;

      await ajustarStock.mutateAsync(datos);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const handleSubmitSeriales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (esEntrada) {
      if (!validarSeriales()) return;
    } else {
      if (!validarSeleccionSeriales()) return;
    }
    await submitAjuste();
  };

  const handleSubmitCantidad = async (e: React.FormEvent) => {
    e.preventDefault();
    continuarASeriales();
  };

  // Renderizar paso de cantidad
  if (paso === 'cantidad') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock Manualmente</DialogTitle>
            <DialogDescription>
              Modifique la cantidad disponible del producto y registre el motivo del ajuste.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCantidad} className="space-y-4">
            {/* Información del producto */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Producto</h4>
              <div className="space-y-1">
                <p className="font-medium">{stockItem.producto?.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {stockItem.producto?.codigo_producto}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Stock actual:</span>
                  <Badge variant="outline">
                    {stockItem.cantidad_disponible} {stockItem.producto?.unidad_medida || 'unidades'}
                  </Badge>
                  {esProductoSerializado && (
                    <Badge variant="secondary">Serializado</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Nueva cantidad */}
            <div className="space-y-2">
              <Label htmlFor="nueva-cantidad">Nueva Cantidad</Label>
              <Input
                id="nueva-cantidad"
                type="number"
                min="0"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                placeholder="Ingrese la nueva cantidad"
                required
              />
              
              {/* Mostrar diferencia */}
              {nuevaCantidad && !isNaN(parseInt(nuevaCantidad)) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Diferencia: </span>
                  <span className={`font-medium ${
                    diferencia > 0 ? 'text-green-600' : 
                    diferencia < 0 ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {diferencia > 0 ? '+' : ''}{diferencia} 
                    {diferencia !== 0 && (
                      <span className="ml-1">
                        ({tipoAjuste === 'entrada' ? 'Entrada' : 'Salida'})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo del Ajuste *</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Conteo físico, producto dañado, corrección de error..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Este motivo quedará registrado en el historial de movimientos.
              </p>
            </div>

            {/* Aviso para productos serializados */}
            {esProductoSerializado && esEntrada && cantidadParaSeriales > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Este producto es serializado. En el siguiente paso deberá ingresar los números de serie de los {cantidadParaSeriales} equipos.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={ajustarStock.isPending}
              >
                {esProductoSerializado && esEntrada && cantidadParaSeriales > 0 
                  ? 'Continuar →' 
                  : (ajustarStock.isPending ? 'Ajustando...' : 'Confirmar Ajuste')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Renderizar paso de seriales
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={volverACantidad}
              className="p-1 h-6 w-6"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {esEntrada ? 'Registrar Números de Serie' : 'Seleccionar Seriales para Baja'}
          </DialogTitle>
          <DialogDescription>
            {esEntrada
              ? `Ingrese los números de serie de los ${cantidadParaSeriales} equipos que está agregando al inventario.`
              : `Seleccione ${cantidadParaSeriales} serial(es) disponibles para dar de baja del inventario.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitSeriales} className="space-y-4">
          {esEntrada ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Equipos a Registrar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {seriales.map((serial, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm">Equipo #{index + 1}</h5>
                      {seriales.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarSerial(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`serial-${index}`}>Número de Serie *</Label>
                        <Input
                          id={`serial-${index}`}
                          value={serial.numero_serie}
                          onChange={(e) => actualizarSerial(index, 'numero_serie', e.target.value)}
                          placeholder="Ej: SN123456789"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`imei-${index}`}>IMEI (opcional)</Label>
                        <Input
                          id={`imei-${index}`}
                          value={serial.imei || ''}
                          onChange={(e) => actualizarSerial(index, 'imei', e.target.value)}
                          placeholder="Ej: 123456789012345"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`mac-${index}`}>MAC Address (opcional)</Label>
                        <Input
                          id={`mac-${index}`}
                          value={serial.mac_address || ''}
                          onChange={(e) => actualizarSerial(index, 'mac_address', e.target.value)}
                          placeholder="Ej: 00:1B:44:11:3A:B7"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {seriales.length < cantidadParaSeriales && (
                  <Button type="button" variant="outline" onClick={agregarSerial} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Equipo ({seriales.length}/{cantidadParaSeriales})
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Seriales disponibles</span>
                  <span className="text-xs text-muted-foreground">Seleccionados: {serialesSeleccionados.length}/{cantidadParaSeriales}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Buscar por Serie, IMEI o MAC"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {cargandoSeriales ? (
                  <p className="text-sm text-muted-foreground">Cargando seriales…</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-auto pr-1">
                    {serialesDisponibles
                      .filter((s) => {
                        const t = busqueda.trim().toLowerCase();
                        if (!t) return true;
                        const a = (s.numero_serie || '').toLowerCase();
                        const b = (s.imei || '').toLowerCase();
                        const c = (s.mac_address || '').toLowerCase();
                        return a.includes(t) || b.includes(t) || c.includes(t);
                      })
                      .map((s) => {
                        const checked = serialesSeleccionados.includes(s.id);
                        const disabled = !checked && serialesSeleccionados.length >= cantidadParaSeriales;
                        return (
                          <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
                            <div>
                              <p className="font-medium text-sm">{s.numero_serie || 'SIN SERIE'}</p>
                              <p className="text-xs text-muted-foreground">IMEI: {s.imei || '—'} · MAC: {s.mac_address || '—'}</p>
                            </div>
                            <Checkbox checked={checked} onCheckedChange={() => toggleSeleccionSerial(s.id)} disabled={disabled} />
                          </div>
                        );
                      })}
                    {serialesDisponibles.length === 0 && (
                      <p className="text-sm text-muted-foreground">No hay seriales disponibles.</p>
                    )}
                  </div>
                )}
                {serialesDisponibles.length < cantidadParaSeriales && (
                  <div className="rounded-md border p-2 text-sm text-destructive">
                    Seriales disponibles insuficientes para completar la baja.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={volverACantidad}>
              ← Volver
            </Button>
            <Button
              type="submit"
              disabled={
                ajustarStock.isPending ||
                (esEntrada ? seriales.length !== cantidadParaSeriales : serialesSeleccionados.length !== cantidadParaSeriales || cargandoSeriales || serialesDisponibles.length < cantidadParaSeriales)
              }
            >
              {ajustarStock.isPending ? 'Procesando...' : 'Confirmar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};