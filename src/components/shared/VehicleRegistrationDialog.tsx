import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCustodianVehicles, CustodianVehicle } from '@/hooks/useCustodianVehicles';
import { supabase } from '@/integrations/supabase/client';

interface VehicleRegistrationDialogProps {
  custodioId: string;
  custodioNombre: string;
  onVehicleRegistered?: () => void;
  trigger?: React.ReactNode;
}

export function VehicleRegistrationDialog({ 
  custodioId, 
  custodioNombre, 
  onVehicleRegistered,
  trigger 
}: VehicleRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    color: '',
    placa: '',
    numero_serie: '',
    observaciones: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { addVehicle } = useCustodianVehicles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marca || !formData.modelo) {
      toast.error('Marca y modelo son obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      // Get custodio ID by name if not provided
      let finalCustodioId = custodioId;
      
      if (!finalCustodioId) {
        const { data: custodioData, error: custodioError } = await supabase
          .from('custodios_operativos')
          .select('id')
          .eq('nombre', custodioNombre)
          .maybeSingle();
          
        if (custodioError || !custodioData) {
          toast.error('No se pudo encontrar el custodio en el sistema');
          return;
        }
        
        finalCustodioId = custodioData.id;
      }

      const vehicleData: Omit<CustodianVehicle, 'id' | 'created_at' | 'updated_at'> = {
        custodio_id: finalCustodioId,
        marca: formData.marca,
        modelo: formData.modelo,
        año: formData.año,
        color: formData.color || undefined,
        placa: formData.placa || 'Sin placa',
        numero_serie: formData.numero_serie || undefined,
        es_principal: true,
        estado: 'activo',
        observaciones: formData.observaciones || undefined
      };

      await addVehicle(vehicleData);
      
      setOpen(false);
      setFormData({
        marca: '',
        modelo: '',
        año: new Date().getFullYear(),
        color: '',
        placa: '',
        numero_serie: '',
        observaciones: ''
      });
      
      onVehicleRegistered?.();
      toast.success('Vehículo registrado exitosamente');
    } catch (error) {
      console.error('Error registering vehicle:', error);
      toast.error('Error al registrar vehículo');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Registrar Vehículo
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Registrar Vehículo - {custodioNombre}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                placeholder="Ej: Toyota"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                placeholder="Ej: Corolla"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="año">Año</Label>
              <Input
                id="año"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.año}
                onChange={(e) => setFormData(prev => ({ ...prev, año: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="Ej: Blanco"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              value={formData.placa}
              onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value }))}
              placeholder="Ej: ABC-123-A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_serie">Número de Serie</Label>
            <Input
              id="numero_serie"
              value={formData.numero_serie}
              onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
              placeholder="Número de serie del vehículo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar Vehículo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}