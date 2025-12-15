import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Wrench, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MaintenanceType, MAINTENANCE_INTERVALS } from '@/hooks/useCustodianMaintenance';

interface ServicePackage {
  nombre: string;
  descripcion: string;
  km: string;
  items: MaintenanceType[];
  color: string;
}

const SERVICE_PACKAGES: Record<string, ServicePackage> = {
  '10k': {
    nombre: 'Servicio Menor',
    descripcion: 'Cambio de aceite básico',
    km: '10,000 km',
    items: ['aceite', 'filtro_aceite'],
    color: 'from-emerald-500 to-emerald-600'
  },
  '20k': {
    nombre: 'Servicio Intermedio',
    descripcion: 'Revisión completa de rutina',
    km: '20,000 km',
    items: ['aceite', 'filtro_aceite', 'frenos', 'filtro_aire', 'llantas_rotacion'],
    color: 'from-blue-500 to-blue-600'
  },
  '40k': {
    nombre: 'Servicio Mayor',
    descripcion: 'Mantenimiento completo',
    km: '40,000 km',
    items: ['aceite', 'filtro_aceite', 'frenos', 'filtro_aire', 'llantas_rotacion', 'bujias', 'liquido_frenos'],
    color: 'from-purple-500 to-purple-600'
  },
  'custom': {
    nombre: 'Personalizado',
    descripcion: 'Selecciona lo que necesites',
    km: 'Variable',
    items: [],
    color: 'from-gray-500 to-gray-600'
  }
};

interface BatchMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentKm: number;
  onConfirm: (data: {
    tipos: MaintenanceType[];
    km_al_momento: number;
    fecha_realizacion?: string;
    costo_total?: number;
    taller_mecanico?: string;
    notas?: string;
  }) => Promise<boolean>;
}

const BatchMaintenanceDialog = ({
  open,
  onOpenChange,
  currentKm,
  onConfirm
}: BatchMaintenanceDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<MaintenanceType[]>([]);
  const [formData, setFormData] = useState({
    km: currentKm.toString(),
    fecha: new Date().toISOString().split('T')[0],
    costo: '',
    taller: '',
    notas: ''
  });
  const [saving, setSaving] = useState(false);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    if (packageId !== 'custom') {
      setSelectedItems([...SERVICE_PACKAGES[packageId].items]);
    } else {
      setSelectedItems([]);
    }
  };

  const toggleItem = (tipo: MaintenanceType) => {
    setSelectedItems(prev => 
      prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const handleNext = () => {
    if (selectedItems.length > 0) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;
    
    setSaving(true);
    try {
      const success = await onConfirm({
        tipos: selectedItems,
        km_al_momento: parseInt(formData.km) || currentKm,
        fecha_realizacion: formData.fecha,
        costo_total: formData.costo ? parseFloat(formData.costo) : undefined,
        taller_mecanico: formData.taller || undefined,
        notas: formData.notas || undefined
      });
      
      if (success) {
        // Reset state
        setStep(1);
        setSelectedPackage(null);
        setSelectedItems([]);
        setFormData({
          km: currentKm.toString(),
          fecha: new Date().toISOString().split('T')[0],
          costo: '',
          taller: '',
          notas: ''
        });
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep(1);
      setSelectedPackage(null);
      setSelectedItems([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={handleBack} className="p-1 -ml-1 rounded hover:bg-muted">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Wrench className="w-5 h-5" />
            {step === 1 ? 'Registrar Servicio' : 'Confirmar Servicio'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Package Selection */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SERVICE_PACKAGES).map(([id, pkg]) => (
                <button
                  key={id}
                  onClick={() => handlePackageSelect(id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all",
                    selectedPackage === id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  {selectedPackage === id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                    pkg.color
                  )}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{pkg.nombre}</p>
                  <p className="text-xs text-muted-foreground">{pkg.km}</p>
                </button>
              ))}
            </div>

            {/* Items Checklist */}
            {selectedPackage && (
              <div className="border rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedPackage === 'custom' 
                    ? 'Selecciona los servicios realizados:'
                    : 'Servicios incluidos (puedes modificar):'
                  }
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {MAINTENANCE_INTERVALS.map((interval) => (
                    <label
                      key={interval.tipo}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedItems.includes(interval.tipo)}
                        onCheckedChange={() => toggleItem(interval.tipo)}
                      />
                      <span className="text-lg">{interval.icono}</span>
                      <span className="text-sm">{interval.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Next Button */}
            <Button
              onClick={handleNext}
              disabled={selectedItems.length === 0}
              className="w-full"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            {selectedItems.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {selectedItems.length} servicio{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Items Summary */}
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-sm font-medium mb-2">Servicios a registrar:</p>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map(tipo => {
                  const interval = MAINTENANCE_INTERVALS.find(i => i.tipo === tipo);
                  return (
                    <span key={tipo} className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded-lg text-xs">
                      {interval?.icono} {interval?.nombre}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Kilometraje</Label>
                  <Input
                    type="number"
                    value={formData.km}
                    onChange={(e) => setFormData(prev => ({ ...prev, km: e.target.value }))}
                    placeholder={currentKm.toString()}
                  />
                </div>
                <div>
                  <Label className="text-xs">Fecha</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Costo Total (opcional)</Label>
                <Input
                  type="number"
                  value={formData.costo}
                  onChange={(e) => setFormData(prev => ({ ...prev, costo: e.target.value }))}
                  placeholder="$0.00"
                />
                {formData.costo && selectedItems.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ ${(parseFloat(formData.costo) / selectedItems.length).toFixed(0)} por servicio
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs">Taller / Concesionario</Label>
                <Input
                  value={formData.taller}
                  onChange={(e) => setFormData(prev => ({ ...prev, taller: e.target.value }))}
                  placeholder="Ej: Agencia Honda"
                />
              </div>

              <div>
                <Label className="text-xs">Notas (opcional)</Label>
                <Input
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Servicio de los 20,000 km..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={saving || selectedItems.length === 0}
              className="w-full"
            >
              {saving ? 'Guardando...' : `Registrar ${selectedItems.length} servicio${selectedItems.length > 1 ? 's' : ''}`}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchMaintenanceDialog;
