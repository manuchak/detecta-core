import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEsquemasArmados, type EsquemaPagoArmado, type CreateEsquemaData } from '@/hooks/useEsquemasArmados';
import { Plus, Edit2, Trash2, DollarSign, Clock, TrendingUp, Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function EsquemasArmadosTab() {
  const { esquemas, loading, createEsquema, updateEsquema, deleteEsquema } = useEsquemasArmados();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEsquema, setEditingEsquema] = useState<EsquemaPagoArmado | null>(null);
  const [formData, setFormData] = useState<CreateEsquemaData>({
    nombre: '',
    tipo_esquema: 'tiempo_fijo',
    configuracion: {
      tarifa_base_12h: 1300,
      tarifa_hora_extra: 150,
      viaticos_diarios: 300,
      horas_base_incluidas: 12,
      aplica_viaticos_foraneos: true,
    },
    descripcion: '',
    activo: true,
  });

  const handleOpenDialog = (esquema?: EsquemaPagoArmado) => {
    if (esquema) {
      setEditingEsquema(esquema);
      setFormData({
        nombre: esquema.nombre,
        tipo_esquema: esquema.tipo_esquema,
        configuracion: esquema.configuracion,
        descripcion: esquema.descripcion || '',
        activo: esquema.activo,
      });
    } else {
      setEditingEsquema(null);
      setFormData({
        nombre: '',
        tipo_esquema: 'tiempo_fijo',
        configuracion: {
          tarifa_base_12h: 1300,
          tarifa_hora_extra: 150,
          viaticos_diarios: 300,
          horas_base_incluidas: 12,
          aplica_viaticos_foraneos: true,
        },
        descripcion: '',
        activo: true,
      });
    }
    setDialogOpen(true);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (field: string, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      configuracion: { ...prev.configuracion, [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEsquema) {
        await updateEsquema({ ...formData, id: editingEsquema.id });
      } else {
        await createEsquema(formData);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar esquema:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este esquema? Esta acción no se puede deshacer.')) {
      await deleteEsquema(id);
    }
  };

  const isEsquemaEstandar = (esquema: EsquemaPagoArmado) => {
    return esquema.nombre.toLowerCase().includes('estándar') || 
           esquema.nombre.toLowerCase().includes('estandar');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando esquemas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Esquemas de Pago - Custodios Armados</h2>
          <p className="text-muted-foreground">
            Gestiona los esquemas de pago para proveedores externos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Esquema
        </Button>
      </div>

      {/* Esquemas Grid */}
      <div className="grid gap-4">
        {esquemas.map((esquema) => (
          <Card key={esquema.id} className={isEsquemaEstandar(esquema) ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{esquema.nombre}</CardTitle>
                    {isEsquemaEstandar(esquema) && (
                      <Badge variant="default" className="gap-1">
                        <Star className="w-3 h-3" />
                        Estándar
                      </Badge>
                    )}
                    {!esquema.activo && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                  {esquema.descripcion && (
                    <CardDescription className="mt-1">{esquema.descripcion}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(esquema)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!isEsquemaEstandar(esquema) && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(esquema.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs">Tarifa Base</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ${esquema.configuracion.tarifa_base_12h.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {esquema.configuracion.horas_base_incluidas}h incluidas
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Hora Extra</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ${esquema.configuracion.tarifa_hora_extra.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">por hora adicional</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Viáticos</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ${esquema.configuracion.viaticos_diarios.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {esquema.configuracion.aplica_viaticos_foraneos ? 'Foráneos' : 'No aplica'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-xs">Ejemplo 14h</span>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    ${(
                      esquema.configuracion.tarifa_base_12h +
                      (2 * esquema.configuracion.tarifa_hora_extra) +
                      (esquema.configuracion.aplica_viaticos_foraneos ? esquema.configuracion.viaticos_diarios : 0)
                    ).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total foráneo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEsquema ? 'Editar Esquema' : 'Crear Nuevo Esquema'}
            </DialogTitle>
            <DialogDescription>
              {editingEsquema 
                ? 'Modifica los valores del esquema de pago' 
                : 'Define un nuevo esquema de pago para proveedores externos'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Esquema</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Ej: Premium, Zona Metropolitana, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Describe cuándo usar este esquema..."
                  rows={3}
                />
              </div>
            </div>

            {/* Tarifas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tarifas Base</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tarifa_base">Tarifa Base</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="tarifa_base"
                      type="number"
                      step="50"
                      value={formData.configuracion.tarifa_base_12h}
                      onChange={(e) => handleConfigChange('tarifa_base_12h', parseFloat(e.target.value))}
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horas_base">Horas Base Incluidas</Label>
                  <Input
                    id="horas_base"
                    type="number"
                    min="8"
                    max="24"
                    value={formData.configuracion.horas_base_incluidas}
                    onChange={(e) => handleConfigChange('horas_base_incluidas', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tarifas Adicionales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tarifas Adicionales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_extra">Tarifa Hora Extra</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="hora_extra"
                      type="number"
                      step="10"
                      value={formData.configuracion.tarifa_hora_extra}
                      onChange={(e) => handleConfigChange('tarifa_hora_extra', parseFloat(e.target.value))}
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="viaticos">Viáticos Diarios</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="viaticos"
                      type="number"
                      step="50"
                      value={formData.configuracion.viaticos_diarios}
                      onChange={(e) => handleConfigChange('viaticos_diarios', parseFloat(e.target.value))}
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Opciones</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="viaticos_foraneos">Aplicar Viáticos Foráneos</Label>
                    <p className="text-sm text-muted-foreground">
                      Agregar viáticos para servicios fuera de la ciudad
                    </p>
                  </div>
                  <Switch
                    id="viaticos_foraneos"
                    checked={formData.configuracion.aplica_viaticos_foraneos}
                    onCheckedChange={(checked) => handleConfigChange('aplica_viaticos_foraneos', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo">Esquema Activo</Label>
                    <p className="text-sm text-muted-foreground">
                      Disponible para asignar a proveedores
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => handleInputChange('activo', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingEsquema ? 'Actualizar' : 'Crear'} Esquema
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
