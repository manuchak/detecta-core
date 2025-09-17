// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, FileText } from 'lucide-react';
import { useInstaladorData } from '@/hooks/useInstaladorData';

interface DatosFiscalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalador: any;
}

export const DatosFiscalesDialog: React.FC<DatosFiscalesDialogProps> = ({
  open,
  onOpenChange,
  instalador
}) => {
  const { fetchDatosFiscales, saveDatosFiscales } = useInstaladorData();
  const [loading, setLoading] = useState(false);
  const [datosFiscales, setDatosFiscales] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    rfc: '',
    razon_social: '',
    regimen_fiscal: '',
    direccion_fiscal: '',
    ciudad_fiscal: '',
    estado_fiscal: '',
    codigo_postal_fiscal: '',
    email_facturacion: '',
    telefono_facturacion: '',
    banco: '',
    cuenta_bancaria: '',
    clabe_interbancaria: '',
    titular_cuenta: '',
    documentos_fiscales: {},
    verificado: false,
    observaciones_verificacion: ''
  });

  useEffect(() => {
    if (instalador && open) {
      loadDatosFiscales();
    }
  }, [instalador, open]);

  const loadDatosFiscales = async () => {
    if (!instalador) return;
    
    try {
      setLoading(true);
      const datos = await fetchDatosFiscales(instalador.id);
      if (datos) {
        setDatosFiscales(datos);
        setFormData({
          rfc: datos.rfc || '',
          razon_social: datos.razon_social || '',
          regimen_fiscal: datos.regimen_fiscal || '',
          direccion_fiscal: datos.direccion_fiscal || '',
          ciudad_fiscal: datos.ciudad_fiscal || '',
          estado_fiscal: datos.estado_fiscal || '',
          codigo_postal_fiscal: datos.codigo_postal_fiscal || '',
          email_facturacion: datos.email_facturacion || '',
          telefono_facturacion: datos.telefono_facturacion || '',
          banco: datos.banco || '',
          cuenta_bancaria: datos.cuenta_bancaria || '',
          clabe_interbancaria: datos.clabe_interbancaria || '',
          titular_cuenta: datos.titular_cuenta || '',
          documentos_fiscales: datos.documentos_fiscales || {},
          verificado: datos.verificado || false,
          observaciones_verificacion: datos.observaciones_verificacion || ''
        });
      }
    } catch (error) {
      console.error('Error loading datos fiscales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instalador) return;

    try {
      setLoading(true);
      const dataToSave = {
        ...formData,
        instalador_id: instalador.id,
        id: datosFiscales?.id
      };

      await saveDatosFiscales(dataToSave);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving datos fiscales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async () => {
    if (!instalador) return;

    try {
      setLoading(true);
      const dataToSave = {
        ...formData,
        instalador_id: instalador.id,
        id: datosFiscales?.id,
        verificado: true,
        fecha_verificacion: new Date().toISOString()
      };

      await saveDatosFiscales(dataToSave);
      setFormData(prev => ({ ...prev, verificado: true }));
    } catch (error) {
      console.error('Error verifying datos fiscales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!instalador) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Datos Fiscales - {instalador.nombre_completo}
          </DialogTitle>
          <DialogDescription>
            Gestiona la información fiscal del instalador para facturación de servicios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado de verificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Estado de Verificación
                <Badge variant={formData.verificado ? "secondary" : "outline"} 
                       className={formData.verificado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {formData.verificado ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verificado
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Pendiente
                    </>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            {!formData.verificado && (
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Los datos fiscales requieren verificación antes de poder procesar pagos.
                </p>
                <Button onClick={handleVerificar} disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verificar Datos
                </Button>
              </CardContent>
            )}
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información fiscal básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rfc">RFC *</Label>
                    <Input
                      id="rfc"
                      value={formData.rfc}
                      onChange={(e) => setFormData(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                      placeholder="ABCD123456ABC"
                      maxLength={13}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => setFormData(prev => ({ ...prev, razon_social: e.target.value }))}
                      placeholder="Nombre o razón social"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="regimen_fiscal">Régimen Fiscal *</Label>
                  <Input
                    id="regimen_fiscal"
                    value={formData.regimen_fiscal}
                    onChange={(e) => setFormData(prev => ({ ...prev, regimen_fiscal: e.target.value }))}
                    placeholder="Ej: Persona Física con Actividad Empresarial"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Domicilio fiscal */}
            <Card>
              <CardHeader>
                <CardTitle>Domicilio Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="direccion_fiscal">Dirección Fiscal *</Label>
                  <Textarea
                    id="direccion_fiscal"
                    value={formData.direccion_fiscal}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion_fiscal: e.target.value }))}
                    placeholder="Calle, número, colonia..."
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ciudad_fiscal">Ciudad *</Label>
                    <Input
                      id="ciudad_fiscal"
                      value={formData.ciudad_fiscal}
                      onChange={(e) => setFormData(prev => ({ ...prev, ciudad_fiscal: e.target.value }))}
                      placeholder="Ciudad"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado_fiscal">Estado *</Label>
                    <Input
                      id="estado_fiscal"
                      value={formData.estado_fiscal}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado_fiscal: e.target.value }))}
                      placeholder="Estado"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo_postal_fiscal">Código Postal *</Label>
                    <Input
                      id="codigo_postal_fiscal"
                      value={formData.codigo_postal_fiscal}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigo_postal_fiscal: e.target.value }))}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de contacto para facturación */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto para Facturación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email_facturacion">Email de Facturación *</Label>
                    <Input
                      id="email_facturacion"
                      type="email"
                      value={formData.email_facturacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, email_facturacion: e.target.value }))}
                      placeholder="facturacion@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_facturacion">Teléfono de Facturación</Label>
                    <Input
                      id="telefono_facturacion"
                      value={formData.telefono_facturacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono_facturacion: e.target.value }))}
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos bancarios */}
            <Card>
              <CardHeader>
                <CardTitle>Datos Bancarios</CardTitle>
                <CardDescription>Para transferencias de pagos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco}
                      onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
                      placeholder="Nombre del banco"
                    />
                  </div>
                  <div>
                    <Label htmlFor="titular_cuenta">Titular de la Cuenta</Label>
                    <Input
                      id="titular_cuenta"
                      value={formData.titular_cuenta}
                      onChange={(e) => setFormData(prev => ({ ...prev, titular_cuenta: e.target.value }))}
                      placeholder="Nombre del titular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cuenta_bancaria">Número de Cuenta</Label>
                    <Input
                      id="cuenta_bancaria"
                      value={formData.cuenta_bancaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, cuenta_bancaria: e.target.value }))}
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clabe_interbancaria">CLABE Interbancaria</Label>
                    <Input
                      id="clabe_interbancaria"
                      value={formData.clabe_interbancaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, clabe_interbancaria: e.target.value }))}
                      placeholder="123456789012345678"
                      maxLength={18}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observaciones_verificacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones_verificacion: e.target.value }))}
                  placeholder="Observaciones sobre la verificación fiscal..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Datos Fiscales'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};