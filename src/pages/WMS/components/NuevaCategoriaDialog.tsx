
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCategorias } from '@/hooks/useCategorias';

interface NuevaCategoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NuevaCategoriaDialog = ({ open, onOpenChange }: NuevaCategoriaDialogProps) => {
  const { toast } = useToast();
  const { createCategoria } = useCategorias();
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!formData.codigo.trim()) {
      toast({
        title: "Error",
        description: "El código de la categoría es requerido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createCategoria.mutateAsync({
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim().toUpperCase(),
        descripcion: formData.descripcion.trim() || null,
        activo: true
      });

      onOpenChange(false);
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: ''
      });
      
      toast({
        title: "Éxito",
        description: "Categoría creada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
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
          <DialogTitle>Nueva Categoría</DialogTitle>
          <DialogDescription>
            Agregar una nueva categoría de productos
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Categoría *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: GPS Tracking, Sensores..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
              placeholder="Ej: GPS, SENS, ACC..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción de la categoría..."
            />
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
              {isLoading ? "Creando..." : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
