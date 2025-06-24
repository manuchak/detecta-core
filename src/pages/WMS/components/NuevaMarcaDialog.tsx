
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';

interface NuevaMarcaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NuevaMarcaDialog = ({ open, onOpenChange }: NuevaMarcaDialogProps) => {
  const { toast } = useToast();
  const { createMarca } = useMarcasGPS();
  const [formData, setFormData] = useState({
    nombre: '',
    pais_origen: '',
    sitio_web: '',
    soporte_wialon: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la marca es requerido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createMarca.mutateAsync({
        nombre: formData.nombre.trim(),
        pais_origen: formData.pais_origen.trim() || null,
        sitio_web: formData.sitio_web.trim() || null,
        soporte_wialon: formData.soporte_wialon,
        activo: true
      });

      onOpenChange(false);
      setFormData({
        nombre: '',
        pais_origen: '',
        sitio_web: '',
        soporte_wialon: true
      });
      
      toast({
        title: "Éxito",
        description: "Marca GPS creada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la marca GPS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Marca GPS</DialogTitle>
          <DialogDescription>
            Agregar una nueva marca GPS al catálogo
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Marca *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Teltonika, Jimi IoT..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais_origen">País de Origen</Label>
            <Input
              id="pais_origen"
              value={formData.pais_origen}
              onChange={(e) => setFormData(prev => ({ ...prev, pais_origen: e.target.value }))}
              placeholder="Ej: Lithuania, China..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sitio_web">Sitio Web</Label>
            <Input
              id="sitio_web"
              type="url"
              value={formData.sitio_web}
              onChange={(e) => setFormData(prev => ({ ...prev, sitio_web: e.target.value }))}
              placeholder="https://ejemplo.com"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="soporte_wialon"
              checked={formData.soporte_wialon}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, soporte_wialon: checked }))}
            />
            <Label htmlFor="soporte_wialon">Compatible con Wialon</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Marca"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
