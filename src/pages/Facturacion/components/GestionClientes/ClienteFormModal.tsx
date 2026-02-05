import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, Building2, CreditCard, User, AlertTriangle, Store } from 'lucide-react';
import { 
  ClienteFiscal, 
  ClienteFiscalUpdate, 
  useUpdateClienteFiscal,
  REGIMENES_FISCALES,
  USOS_CFDI
} from '../../hooks/useClientesFiscales';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { NOMBRE_COMERCIAL_EDIT_ROLES } from '@/constants/accessControl';

interface ClienteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteFiscal | null;
}

export function ClienteFormModal({ open, onOpenChange, cliente }: ClienteFormModalProps) {
  const updateMutation = useUpdateClienteFiscal();
  const { hasAnyRole } = useUserRole();
  
  // Check if user can edit commercial name
  const canEditNombreComercial = hasAnyRole([...NOMBRE_COMERCIAL_EDIT_ROLES]);

  // Track original name to detect changes
  const [originalNombre, setOriginalNombre] = useState<string>('');
  const [nombreModificado, setNombreModificado] = useState(false);
  
  const [formData, setFormData] = useState<ClienteFiscalUpdate>({
    nombre: '',
    razon_social: '',
    rfc: '',
    regimen_fiscal: '',
    codigo_postal_fiscal: '',
    direccion_fiscal: '',
    uso_cfdi_default: 'G03',
    dias_credito: 30,
    limite_credito: null,
    dia_corte: 15,
    dia_pago: 30,
    contacto_facturacion_nombre: '',
    contacto_facturacion_email: '',
    contacto_facturacion_tel: '',
    prioridad_cobranza: 'normal',
    notas_cobranza: '',
  });

  useEffect(() => {
    if (cliente) {
      setOriginalNombre(cliente.nombre);
      setNombreModificado(false);
      setFormData({
        nombre: cliente.nombre,
        razon_social: cliente.razon_social || '',
        rfc: cliente.rfc || '',
        regimen_fiscal: cliente.regimen_fiscal || '',
        codigo_postal_fiscal: cliente.codigo_postal_fiscal || '',
        direccion_fiscal: cliente.direccion_fiscal || '',
        uso_cfdi_default: cliente.uso_cfdi_default || 'G03',
        dias_credito: cliente.dias_credito || 30,
        limite_credito: cliente.limite_credito,
        dia_corte: cliente.dia_corte || 15,
        dia_pago: cliente.dia_pago || 30,
        contacto_facturacion_nombre: cliente.contacto_facturacion_nombre || '',
        contacto_facturacion_email: cliente.contacto_facturacion_email || '',
        contacto_facturacion_tel: cliente.contacto_facturacion_tel || '',
        prioridad_cobranza: cliente.prioridad_cobranza || 'normal',
        notas_cobranza: cliente.notas_cobranza || '',
      });
    }
  }, [cliente]);

  // Detect if nombre was modified
  useEffect(() => {
    if (formData.nombre && originalNombre) {
      setNombreModificado(formData.nombre !== originalNombre);
    }
  }, [formData.nombre, originalNombre]);

  const handleNombreChange = (value: string) => {
    setFormData({ ...formData, nombre: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    // Prepare data - exclude nombre if not modified to avoid unnecessary updates
    const dataToSubmit: ClienteFiscalUpdate = { ...formData };
    if (!nombreModificado) {
      delete dataToSubmit.nombre;
    }

    try {
      await updateMutation.mutateAsync({
        id: cliente.id,
        data: dataToSubmit,
      });
      
      if (nombreModificado) {
        toast.success('Cliente actualizado. Nota: El nombre comercial cambió pero no se propagó a rutas/servicios existentes.', {
          duration: 6000,
        });
      } else {
        toast.success('Cliente actualizado correctamente');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating cliente:', error);
      toast.error('Error al actualizar el cliente');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente: {cliente?.nombre}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="fiscal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {canEditNombreComercial && (
                <TabsTrigger value="comercialName" className="gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  Nombre
                </TabsTrigger>
              )}
              <TabsTrigger value="fiscal" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Datos Fiscales
              </TabsTrigger>
              <TabsTrigger value="comercial" className="gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Condiciones
              </TabsTrigger>
              <TabsTrigger value="contacto" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                Contacto
              </TabsTrigger>
            </TabsList>

            {/* Nombre Comercial - Solo para roles autorizados */}
            {canEditNombreComercial && (
              <TabsContent value="comercialName" className="space-y-4 mt-4">
                <Alert className="border-amber-500/50 bg-amber-500/10 [&>svg]:text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-amber-700">Precaución: Cambio de Alto Impacto</AlertTitle>
                  <AlertDescription className="text-xs mt-1 text-amber-600">
                    Modificar el nombre comercial <strong>NO actualizará automáticamente</strong> las rutas tarifarias ni el historial de servicios. 
                    Los registros existentes seguirán usando el nombre anterior "{originalNombre}".
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Nombre Comercial
                    {nombreModificado && (
                      <span className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        Modificado
                      </span>
                    )}
                  </Label>
                  <Input
                    placeholder="Nombre comercial del cliente"
                    value={formData.nombre || ''}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    className={nombreModificado ? 'border-amber-500 ring-1 ring-amber-200' : ''}
                  />
                  {nombreModificado && (
                    <p className="text-xs text-muted-foreground">
                      Valor original: <span className="font-mono bg-muted px-1 rounded">{originalNombre}</span>
                    </p>
                  )}
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
                  <p className="font-medium">¿Cuándo usar este campo?</p>
                  <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                    <li>Corrección de errores ortográficos</li>
                    <li>Actualización por cambio de marca comercial</li>
                    <li>Estandarización de nombres para nuevos servicios</li>
                  </ul>
                </div>
              </TabsContent>
            )}

            {/* Datos Fiscales */}
            <TabsContent value="fiscal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razón Social</Label>
                  <Input
                    placeholder="Nombre legal de la empresa"
                    value={formData.razon_social || ''}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input
                    placeholder="ABC123456XX1"
                    value={formData.rfc || ''}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    maxLength={13}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Régimen Fiscal</Label>
                  <Select
                    value={formData.regimen_fiscal || ''}
                    onValueChange={(value) => setFormData({ ...formData, regimen_fiscal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar régimen" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIMENES_FISCALES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Código Postal Fiscal</Label>
                  <Input
                    placeholder="06600"
                    value={formData.codigo_postal_fiscal || ''}
                    onChange={(e) => setFormData({ ...formData, codigo_postal_fiscal: e.target.value })}
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección Fiscal</Label>
                <Textarea
                  placeholder="Calle, número, colonia, ciudad, estado"
                  value={formData.direccion_fiscal || ''}
                  onChange={(e) => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Uso CFDI por Defecto</Label>
                <Select
                  value={formData.uso_cfdi_default || 'G03'}
                  onValueChange={(value) => setFormData({ ...formData, uso_cfdi_default: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar uso CFDI" />
                  </SelectTrigger>
                  <SelectContent>
                    {USOS_CFDI.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Condiciones Comerciales */}
            <TabsContent value="comercial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Días de Crédito</Label>
                  <Input
                    type="number"
                    value={formData.dias_credito || 30}
                    onChange={(e) => setFormData({ ...formData, dias_credito: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Límite de Crédito</Label>
                  <Input
                    type="number"
                    placeholder="Sin límite"
                    value={formData.limite_credito || ''}
                    onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Día de Corte</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.dia_corte || 15}
                    onChange={(e) => setFormData({ ...formData, dia_corte: parseInt(e.target.value) || 15 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Día de Pago</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.dia_pago || 30}
                    onChange={(e) => setFormData({ ...formData, dia_pago: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridad de Cobranza</Label>
                <Select
                  value={formData.prioridad_cobranza || 'normal'}
                  onValueChange={(value) => setFormData({ ...formData, prioridad_cobranza: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas de Cobranza</Label>
                <Textarea
                  placeholder="Observaciones para el equipo de cobranza..."
                  value={formData.notas_cobranza || ''}
                  onChange={(e) => setFormData({ ...formData, notas_cobranza: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Contacto Facturación */}
            <TabsContent value="contacto" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nombre del Contacto</Label>
                <Input
                  placeholder="Nombre completo"
                  value={formData.contacto_facturacion_nombre || ''}
                  onChange={(e) => setFormData({ ...formData, contacto_facturacion_nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email de Facturación</Label>
                  <Input
                    type="email"
                    placeholder="facturacion@empresa.com"
                    value={formData.contacto_facturacion_email || ''}
                    onChange={(e) => setFormData({ ...formData, contacto_facturacion_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    placeholder="55 1234 5678"
                    value={formData.contacto_facturacion_tel || ''}
                    onChange={(e) => setFormData({ ...formData, contacto_facturacion_tel: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              variant={nombreModificado ? 'destructive' : 'default'}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {updateMutation.isPending 
                ? 'Guardando...' 
                : nombreModificado 
                  ? 'Guardar (nombre modificado)' 
                  : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
