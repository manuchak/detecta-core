import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MAINTENANCE_INTERVALS, MaintenanceType } from "@/hooks/useCustodianMaintenance";
import { RotateCcw, Save } from "lucide-react";

interface MaintenanceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodianPhone?: string;
  onSaved?: () => void;
}

interface CustomInterval {
  tipo: MaintenanceType;
  intervalo_km: number;
}

const MaintenanceSettingsDialog = ({
  open,
  onOpenChange,
  custodianPhone,
  onSaved,
}: MaintenanceSettingsDialogProps) => {
  const { toast } = useToast();
  const [intervals, setIntervals] = useState<CustomInterval[]>([]);
  const [saving, setSaving] = useState(false);

  // Inicializar con valores por defecto
  useEffect(() => {
    if (open && custodianPhone) {
      loadCustomIntervals();
    }
  }, [open, custodianPhone]);

  const loadCustomIntervals = async () => {
    if (!custodianPhone) return;

    // Cargar configuración personalizada existente
    const { data } = await supabase
      .from('custodio_configuracion_mantenimiento')
      .select('tipo_mantenimiento, intervalo_km_personalizado')
      .eq('custodio_telefono', custodianPhone);

    // Crear mapa de intervalos personalizados
    const customMap = new Map(
      (data || []).map(d => [d.tipo_mantenimiento, d.intervalo_km_personalizado])
    );

    // Combinar con defaults
    const combined = MAINTENANCE_INTERVALS.map(interval => ({
      tipo: interval.tipo,
      intervalo_km: customMap.get(interval.tipo) || interval.intervalo_km,
    }));

    setIntervals(combined);
  };

  const handleIntervalChange = (tipo: MaintenanceType, value: string) => {
    const numValue = parseInt(value) || 0;
    setIntervals(prev => 
      prev.map(i => i.tipo === tipo ? { ...i, intervalo_km: numValue } : i)
    );
  };

  const handleResetDefaults = () => {
    setIntervals(
      MAINTENANCE_INTERVALS.map(i => ({ tipo: i.tipo, intervalo_km: i.intervalo_km }))
    );
  };

  const handleSave = async () => {
    if (!custodianPhone) return;
    setSaving(true);

    try {
      // Upsert cada intervalo personalizado
      for (const interval of intervals) {
        const defaultInterval = MAINTENANCE_INTERVALS.find(i => i.tipo === interval.tipo);
        
        // Solo guardar si es diferente al default
        if (defaultInterval && interval.intervalo_km !== defaultInterval.intervalo_km) {
          await supabase
            .from('custodio_configuracion_mantenimiento')
            .upsert({
              custodio_telefono: custodianPhone,
              tipo_mantenimiento: interval.tipo,
              intervalo_km_personalizado: interval.intervalo_km,
            }, {
              onConflict: 'custodio_telefono,tipo_mantenimiento',
            });
        } else {
          // Si vuelve al default, eliminar la personalización
          await supabase
            .from('custodio_configuracion_mantenimiento')
            .delete()
            .eq('custodio_telefono', custodianPhone)
            .eq('tipo_mantenimiento', interval.tipo);
        }
      }

      toast({
        title: "✅ Configuración guardada",
        description: "Tus intervalos de mantenimiento se han actualizado",
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving intervals:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getIntervalInfo = (tipo: MaintenanceType) => {
    return MAINTENANCE_INTERVALS.find(i => i.tipo === tipo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚙️ Configurar Intervalos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Personaliza los kilómetros entre cada mantenimiento según tu vehículo.
          </p>

          <div className="space-y-3">
            {intervals.map(interval => {
              const info = getIntervalInfo(interval.tipo);
              if (!info) return null;
              
              const isCustom = interval.intervalo_km !== info.intervalo_km;
              
              return (
                <div key={interval.tipo} className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-2">
                    <span>{info.icono}</span>
                    <span>{info.nombre}</span>
                    {isCustom && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        Personalizado
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={interval.intervalo_km}
                      onChange={(e) => handleIntervalChange(interval.tipo, e.target.value)}
                      className="pr-12"
                      min={500}
                      step={500}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      km
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recomendado: {info.intervalo_km.toLocaleString()} km
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceSettingsDialog;
