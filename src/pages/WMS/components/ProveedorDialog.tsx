
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProveedores } from '@/hooks/useProveedores';
import type { Proveedor } from '@/types/wms';

interface ProveedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor | null;
  onClose: () => void;
}

export const ProveedorDialog = ({ open, onOpenChange, proveedor, onClose }: ProveedorDialogProps) => {
  const { createProveedor, updateProveedor } = useProveedores();
  const [formData, setFormData] = useState({
    nombre: '',
    razon_social: '',
    rfc: '',
    telefono: '',
    email: '',
    direccion: '',
    contacto_principal: '',
    telefono_contacto: '',
    email_contacto: '',
    condiciones_pago: '30 dias',
    descuento_por_volumen: 0,
    calificacion: 5,
    activo: true,
    notas: ''
  });

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        razon_social: proveedor.razon_social || '',
        rfc: proveedor.rfc || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        contacto_principal: proveedor.contacto_principal || '',
        telefono_contacto: proveedor.telefono_contacto || '',
        email_contacto: proveedor.email_contacto || '',
        condiciones_pago: proveedor.condiciones_pago || '30 dias',
        descuento_por_volumen: proveedor.descuento_por_volumen || 0,
        calificacion: proveedor.calificacion || 5,
        activo: proveedor.activo !== false,
        notas: proveedor.notas || ''
      });
    } else {
      // Reset para nuevo proveedor
      setFormData({
        nombre: '',
        razon_social: '',
        rfc: '',
        telefono: '',
        email: '',
        direccion: '',
        contacto_principal: '',
        telefono_contacto: '',
        email_contacto: '',
        condiciones_pago: '30 dias',
        descuento_por_volumen: 0,
        calificacion: 5,
        activo: true,
        notas: ''
      });
    }
  }, [proveedor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (proveedor) {
        await updateProveedor.mutateAsync({ id: proveedor.id, ...formData });
      } else {
        await createProveedor.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving proveedor:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {proveedor ? 'Modifica la información del proveedor' : 'Registra un nuevo proveedor en el sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Comercial *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="GPS Solutions SA"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social</Label>
              <Input
                id="razon_social"
                value={formData.razon_social}
                onChange={(e) => setFormData(prev => ({ ...prev, razon_social: e.target.value }))}
                placeholder="GPS Solutions Sociedad Anónima"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => setFormData(prev => ({ ...prev, rfc: e.target.value }))}
                placeholder="GPSS123456ABC"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono Principal</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="55-1234-5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contacto@gpssolutions.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Calle Ejemplo #123, Col. Centro, Ciudad, CP 12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto">Contacto Principal</Label>
              <Input
                id="contacto"
                value={formData.contacto_principal}
                onChange={(e) => setFormData(prev => ({ ...prev, contacto_principal: e.target.value }))}
                placeholder="Juan Pérez"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono_contacto">Teléfono Contacto</Label>
              <Input
                id="telefono_contacto"
                value={formData.telefono_contacto}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="55-9876-5432"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_contacto">Email Contacto</Label>
            <Input
              id="email_contacto"
              type="email"
              value={formData.email_contacto}
              onChange={(e) => setFormData(prev => ({ ...prev, email_contacto: e.target.value }))}
              placeholder="juan.perez@gpssolutions.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condiciones">Condiciones de Pago</Label>
              <Select 
                value={formData.condiciones_pago} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, condiciones_pago: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="15 dias">15 días</SelectItem>
                  <SelectItem value="30 dias">30 días</SelectItem>
                  <SelectItem value="45 dias">45 días</SelectItem>
                  <SelectItem value="60 dias">60 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento por Volumen (%)</Label>
              <Input
                id="descuento"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.descuento_por_volumen}
                onChange={(e) => setFormData(prev => ({ ...prev, descuento_por_volumen: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="calificacion">Calificación (1-10)</Label>
              <Input
                id="calificacion"
                type="number"
                min="1"
                max="10"
                value={formData.calificacion}
                onChange={(e) => setFormData(prev => ({ ...prev, calificacion: parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas adicionales sobre el proveedor..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
            />
            <Label htmlFor="activo">Proveedor activo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createProveedor.isPending || updateProveedor.isPending}
            >
              {proveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
