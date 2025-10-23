import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEsquemasArmados, type EsquemaPagoArmado } from '@/hooks/useEsquemasArmados';
import { Calculator } from 'lucide-react';

interface PersonalizarTarifasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedorNombre: string;
  esquemaActual?: EsquemaPagoArmado;
  onEsquemaCreated: (esquemaId: string) => void;
}

export default function PersonalizarTarifasDialog({
  open,
  onOpenChange,
  proveedorNombre,
  esquemaActual,
  onEsquemaCreated,
}: PersonalizarTarifasDialogProps) {
  const { createEsquema, getEsquemaEstandar } = useEsquemasArmados();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tarifa_base_12h: 1300,
    tarifa_hora_extra: 150,
    viaticos_diarios: 300,
    horas_base_incluidas: 12,
    aplica_viaticos_foraneos: true,
  });

  // Inicializar con valores del esquema actual o estándar
  useEffect(() => {
    if (open) {
      const esquemaBase = esquemaActual || getEsquemaEstandar();
      if (esquemaBase?.configuracion) {
        setFormData({
          tarifa_base_12h: Number(esquemaBase.configuracion.tarifa_base_12h) || 1300,
          tarifa_hora_extra: Number(esquemaBase.configuracion.tarifa_hora_extra) || 150,
          viaticos_diarios: Number(esquemaBase.configuracion.viaticos_diarios) || 300,
          horas_base_incluidas: Number(esquemaBase.configuracion.horas_base_incluidas) || 12,
          aplica_viaticos_foraneos: esquemaBase.configuracion.aplica_viaticos_foraneos ?? true,
        });
      }
    }
  }, [open, esquemaActual, getEsquemaEstandar]);

  const handleInputChange = (field: string, value: number | boolean) => {
    // Para valores numéricos, convertir NaN o Infinity a 0
    if (typeof value === 'number') {
      const safeValue = (isNaN(value) || !isFinite(value)) ? 0 : value;
      setFormData(prev => ({ ...prev, [field]: safeValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nombreEsquema = `Personalizado - ${proveedorNombre}`;
      
      const nuevoEsquema = await createEsquema({
        nombre: nombreEsquema,
        tipo_esquema: 'tiempo_fijo',
        configuracion: formData,
        descripcion: `Esquema personalizado para ${proveedorNombre}`,
        activo: true,
      });

      if (nuevoEsquema?.id) {
        onEsquemaCreated(nuevoEsquema.id);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al crear esquema personalizado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Vista previa de cálculo
  const calcularEjemplo = () => {
    const horasEjemplo = 14;
    const horasExtra = Math.max(0, horasEjemplo - Number(formData.horas_base_incluidas ?? 12));
    const costoBase = Number(formData.tarifa_base_12h ?? 0);
    const costoExtra = horasExtra * Number(formData.tarifa_hora_extra ?? 0);
    const viaticos = formData.aplica_viaticos_foraneos ? Number(formData.viaticos_diarios ?? 0) : 0;
    return costoBase + costoExtra + viaticos;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Tarifas - {proveedorNombre}</DialogTitle>
          <DialogDescription>
            Crea un esquema de pago personalizado para este proveedor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tarifas Base */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Tarifas Base</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tarifa_base">Tarifa Base (12h)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="tarifa_base"
                    type="number"
                    step="50"
                    value={formData.tarifa_base_12h}
                    onChange={(e) => handleInputChange('tarifa_base_12h', parseFloat(e.target.value) || 0)}
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
                  value={formData.horas_base_incluidas}
                  onChange={(e) => handleInputChange('horas_base_incluidas', parseInt(e.target.value) || 12)}
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
                    value={formData.tarifa_hora_extra}
                    onChange={(e) => handleInputChange('tarifa_hora_extra', parseFloat(e.target.value) || 0)}
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
                    value={formData.viaticos_diarios}
                    onChange={(e) => handleInputChange('viaticos_diarios', parseFloat(e.target.value) || 0)}
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="viaticos_foraneos">Aplicar Viáticos Foráneos</Label>
                <p className="text-sm text-muted-foreground">
                  Agregar viáticos cuando el servicio esté fuera de la ciudad
                </p>
              </div>
              <Switch
                id="viaticos_foraneos"
                checked={formData.aplica_viaticos_foraneos}
                onCheckedChange={(checked) => handleInputChange('aplica_viaticos_foraneos', checked)}
              />
            </div>
          </div>

          {/* Vista Previa de Cálculo */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="w-4 h-4" />
              Vista Previa de Cálculo
            </div>
            <p className="text-xs text-muted-foreground">
              Ejemplo: Servicio de 14 horas (foráneo)
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Tarifa Base (12h)</p>
                <p className="text-sm font-medium">${Number(formData.tarifa_base_12h ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">2 Horas Extra</p>
                <p className="text-sm font-medium">${(Number(formData.tarifa_hora_extra ?? 0) * 2).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Viáticos</p>
                <p className="text-sm font-medium">
                  ${formData.aplica_viaticos_foraneos ? Number(formData.viaticos_diarios ?? 0).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Estimado:</span>
                <span className="text-lg font-bold text-primary">
                  ${calcularEjemplo().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Esquema Personalizado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
