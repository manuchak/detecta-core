import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Phone, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useArmedOperatives, CreateArmedOperativeData } from '@/hooks/useArmedOperatives';

const ZONAS_DISPONIBLES = [
  'Ciudad de México',
  'Estado de México',
  'Guadalajara',
  'Monterrey',
  'Querétaro',
  'Puebla',
  'Tijuana',
  'León',
  'Cancún',
  'Mérida',
  'Por definir'
];

interface QuickArmedRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledName?: string;
  onSuccess?: (armedId: string, armedName: string) => void;
}

export function QuickArmedRegistrationModal({ 
  open, 
  onOpenChange, 
  prefilledName = '',
  onSuccess 
}: QuickArmedRegistrationModalProps) {
  const { createOperative } = useArmedOperatives();
  const [formData, setFormData] = useState<CreateArmedOperativeData>({
    nombre: prefilledName,
    telefono: '',
    zona_base: '',
    origen: 'registro_rapido'
  });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (prefilledName) {
      setFormData(prev => ({ ...prev, nombre: prefilledName }));
    }
  }, [prefilledName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      return;
    }

    if (!formData.zona_base) {
      return;
    }

    setSubmitting(true);
    const result = await createOperative(formData);
    setSubmitting(false);

    if (result) {
      if (onSuccess) {
        onSuccess(result.id, result.nombre);
      }
      onOpenChange(false);
      // Reset form
      setFormData({
        nombre: '',
        telefono: '',
        zona_base: '',
        origen: 'registro_rapido'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Registro Rápido de Armado
          </DialogTitle>
          <DialogDescription>
            Completa los datos básicos para registrar un nuevo armado interno. 
            La verificación completa puede hacerse después desde el dashboard de Supply.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert informativo */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Este armado quedará marcado como <strong>pendiente de verificación</strong> y 
              podrá ser asignado máximo 3 veces hasta completar su perfil completo.
            </AlertDescription>
          </Alert>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Nombre Completo *
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Juan Pérez García"
              required
              autoFocus
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono
            </Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="Ej: 5512345678"
              type="tel"
            />
            <p className="text-xs text-muted-foreground">
              Opcional, pero recomendado para contacto directo
            </p>
          </div>

          {/* Zona Base */}
          <div className="space-y-2">
            <Label htmlFor="zona_base" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zona Base *
            </Label>
            <Select 
              value={formData.zona_base} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, zona_base: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una zona" />
              </SelectTrigger>
              <SelectContent>
                {ZONAS_DISPONIBLES.map(zona => (
                  <SelectItem key={zona} value={zona}>
                    {zona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información adicional */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Se establecerán automáticamente:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Estado: Activo y Disponible</li>
              <li>Rating inicial: 3.0 (neutro)</li>
              <li>Score: 50/100 (neutro)</li>
              <li>Tipo: Armado Interno</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !formData.nombre.trim() || !formData.zona_base}>
              {submitting ? 'Registrando...' : 'Registrar Armado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
