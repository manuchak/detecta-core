import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTarifasKmArmados, type CreateTarifaData } from '@/hooks/useTarifasKmArmados';
import { Plus, Edit2, Trash2, Route, Calculator, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function TarifasKmInternosCard() {
  const { tarifas, loading, createTarifa, updateTarifa, deleteTarifa, calcularCostoPorKm, calcularCostoEscalonado } = useTarifasKmArmados();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [simKm, setSimKm] = useState<number>(200);
  const [formData, setFormData] = useState({
    km_min: 0,
    km_max: '' as number | '',
    tarifa_por_km: 5.0,
    descripcion: '',
    orden: 5,
    activo: true,
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    const nextOrden = tarifas.length > 0 ? Math.max(...tarifas.map(t => t.orden)) + 1 : 1;
    setFormData({ km_min: 0, km_max: '', tarifa_por_km: 5.0, descripcion: '', orden: nextOrden, activo: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tarifa: typeof tarifas[0]) => {
    setEditingId(tarifa.id);
    setFormData({
      km_min: tarifa.km_min,
      km_max: tarifa.km_max ?? '',
      tarifa_por_km: tarifa.tarifa_por_km,
      descripcion: tarifa.descripcion,
      orden: tarifa.orden,
      activo: tarifa.activo,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTarifaData = {
      km_min: formData.km_min,
      km_max: formData.km_max === '' ? null : Number(formData.km_max),
      tarifa_por_km: formData.tarifa_por_km,
      descripcion: formData.descripcion || `${formData.km_min}-${formData.km_max || '∞'} km`,
      orden: formData.orden,
      activo: formData.activo,
    };

    try {
      if (editingId && !editingId.startsWith('fallback')) {
        await updateTarifa({ id: editingId, ...payload });
      } else {
        await createTarifa(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('fallback')) return;
    if (confirm('¿Eliminar esta tarifa?')) {
      await deleteTarifa(id);
    }
  };

  const simResult = calcularCostoPorKm(simKm);
  const simEscalonado = calcularCostoEscalonado(simKm);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Cargando tarifas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Tarifas SEICSA — Armados Internos (por KM)
              </CardTitle>
              <CardDescription>
                Tarifas escalonadas por kilómetro recorrido para armados internos
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar Rango
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tarifas table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Rango KM</th>
                  <th className="text-left px-4 py-2 font-medium">Desde</th>
                  <th className="text-left px-4 py-2 font-medium">Hasta</th>
                  <th className="text-left px-4 py-2 font-medium">Tarifa / km</th>
                  <th className="text-left px-4 py-2 font-medium">Ejemplo 300km</th>
                  <th className="text-right px-4 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tarifas.map((tarifa, idx) => (
                  <tr key={tarifa.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{tarifa.descripcion}</Badge>
                    </td>
                    <td className="px-4 py-3">{tarifa.km_min} km</td>
                    <td className="px-4 py-3">{tarifa.km_max ? `${tarifa.km_max} km` : 'Sin límite'}</td>
                    <td className="px-4 py-3 font-semibold">${tarifa.tarifa_por_km.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ${(300 * tarifa.tarifa_por_km).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tarifa)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {!tarifa.id.startsWith('fallback') && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(tarifa.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Simulador */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Simulador de Costo
            </h4>
            <div className="flex items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sim-km" className="text-xs">Kilómetros</Label>
                <Input
                  id="sim-km"
                  type="number"
                  min={0}
                  max={700}
                  value={simKm}
                  onChange={(e) => setSimKm(Number(e.target.value))}
                  className="w-28"
                />
              </div>
              <div className="flex gap-6 pb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Tarifa aplicada</p>
                  <p className="text-lg font-semibold">${simResult.tarifa.toFixed(2)}/km</p>
                  <p className="text-xs text-muted-foreground">{simResult.rango}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Costo (tarifa plana)</p>
                  <p className="text-lg font-semibold text-primary">${simResult.costo.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Costo (escalonado)</p>
                  <p className="text-lg font-semibold text-primary">${simEscalonado.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Tarifa' : 'Agregar Rango de Tarifa'}</DialogTitle>
            <DialogDescription>
              Define el rango de kilómetros y la tarifa por km aplicable
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>KM Mínimo</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.km_min}
                  onChange={(e) => setFormData(p => ({ ...p, km_min: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>KM Máximo (vacío = sin límite)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.km_max}
                  onChange={(e) => setFormData(p => ({ ...p, km_max: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="Sin límite"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarifa por KM</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.tarifa_por_km}
                    onChange={(e) => setFormData(p => ({ ...p, tarifa_por_km: Number(e.target.value) }))}
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.orden}
                  onChange={(e) => setFormData(p => ({ ...p, orden: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej: 0-100 km"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
