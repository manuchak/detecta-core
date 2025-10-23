import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Shield, FileCheck, AlertTriangle, Building2, Phone, Mail, DollarSign } from 'lucide-react';
import { useProveedoresArmados, CreateProveedorData, UpdateProveedorData } from '@/hooks/useProveedoresArmados';
import { ProveedoresPagosAuditoriaView } from './pagos/ProveedoresPagosAuditoriaView';
import { BasesProveedorDialog } from './BasesProveedorDialog';
import { toast } from 'sonner';

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
  'Mérida'
];

const SERVICIOS_DISPONIBLES = [
  { value: 'local', label: 'Servicios Locales' },
  { value: 'foraneo', label: 'Servicios Foráneos' },
  { value: 'alta_seguridad', label: 'Alta Seguridad' }
];

interface ProveedorFormData {
  nombre_empresa: string;
  rfc: string;
  contacto_principal: string;
  telefono_contacto: string;
  email_contacto: string;
  zonas_cobertura: string[];
  servicios_disponibles: string[];
  capacidad_maxima: number;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio: number;
  observaciones: string;
  licencias_vigentes: boolean;
  documentos_completos: boolean;
}

const initialFormData: ProveedorFormData = {
  nombre_empresa: '',
  rfc: '',
  contacto_principal: '',
  telefono_contacto: '',
  email_contacto: '',
  zonas_cobertura: [],
  servicios_disponibles: ['local'],
  capacidad_maxima: 10,
  disponibilidad_24h: false,
  tiempo_respuesta_promedio: 60,
  observaciones: '',
  licencias_vigentes: true,
  documentos_completos: true
};

export function ProveedoresArmadosTab() {
  const { proveedores, loading, createProveedor, updateProveedor, toggleProveedorStatus, updateProveedorDocumentStatus } = useProveedoresArmados();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProveedorFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('maestro');
  const [basesDialogOpen, setBasesDialogOpen] = useState(false);
  const [selectedProveedorForBases, setSelectedProveedorForBases] = useState<{ id: string; nombre: string } | null>(null);

  const handleInputChange = (field: keyof ProveedorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleZonaToggle = (zona: string) => {
    setFormData(prev => ({
      ...prev,
      zonas_cobertura: prev.zonas_cobertura.includes(zona)
        ? prev.zonas_cobertura.filter(z => z !== zona)
        : [...prev.zonas_cobertura, zona]
    }));
  };

  const handleServicioToggle = (servicio: string) => {
    setFormData(prev => ({
      ...prev,
      servicios_disponibles: prev.servicios_disponibles.includes(servicio)
        ? prev.servicios_disponibles.filter(s => s !== servicio)
        : [...prev.servicios_disponibles, servicio]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProveedor) {
        await updateProveedor({ id: editingProveedor, ...formData } as UpdateProveedorData);
      } else {
        await createProveedor(formData as CreateProveedorData);
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingProveedor(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (proveedor: any) => {
    setFormData({
      nombre_empresa: proveedor.nombre_empresa || '',
      rfc: proveedor.rfc || '',
      contacto_principal: proveedor.contacto_principal || '',
      telefono_contacto: proveedor.telefono_contacto || '',
      email_contacto: proveedor.email_contacto || '',
      zonas_cobertura: proveedor.zonas_cobertura || [],
      servicios_disponibles: proveedor.servicios_disponibles || ['local'],
      capacidad_maxima: proveedor.capacidad_maxima || 10,
      disponibilidad_24h: proveedor.disponibilidad_24h || false,
      tiempo_respuesta_promedio: proveedor.tiempo_respuesta_promedio || 60,
      observaciones: proveedor.observaciones || '',
      licencias_vigentes: proveedor.licencias_vigentes ?? true,
      documentos_completos: proveedor.documentos_completos ?? true
    });
    setEditingProveedor(proveedor.id);
    setIsDialogOpen(true);
  };

  const handleManageBases = (proveedor: any) => {
    setSelectedProveedorForBases({
      id: proveedor.id,
      nombre: proveedor.nombre_empresa
    });
    setBasesDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingProveedor(null);
  };

  const getStatusColor = (proveedor: any) => {
    if (!proveedor.activo) return 'bg-gray-100 text-gray-600';
    if (!proveedor.licencias_vigentes || !proveedor.documentos_completos) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (proveedor: any) => {
    if (!proveedor.activo) return 'Inactivo';
    if (!proveedor.licencias_vigentes || !proveedor.documentos_completos) return 'Pendiente';
    return 'Activo';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Proveedores de Armados</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona proveedores externos y administra pagos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Información Básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre_empresa">Nombre de la Empresa *</Label>
                  <Input
                    id="nombre_empresa"
                    value={formData.nombre_empresa}
                    onChange={(e) => handleInputChange('nombre_empresa', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => handleInputChange('rfc', e.target.value)}
                  />
                </div>
              </div>

              {/* Contacto */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Información de Contacto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contacto_principal">Contacto Principal *</Label>
                    <Input
                      id="contacto_principal"
                      value={formData.contacto_principal}
                      onChange={(e) => handleInputChange('contacto_principal', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_contacto">Teléfono *</Label>
                    <Input
                      id="telefono_contacto"
                      value={formData.telefono_contacto}
                      onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email_contacto">Email *</Label>
                  <Input
                    id="email_contacto"
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Zonas de Cobertura */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Zonas de Cobertura *</h4>
                <div className="grid grid-cols-3 gap-2">
                  {ZONAS_DISPONIBLES.map((zona) => (
                    <label key={zona} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.zonas_cobertura.includes(zona)}
                        onChange={() => handleZonaToggle(zona)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{zona}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Servicios Disponibles */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Servicios Disponibles *</h4>
                <div className="space-y-2">
                  {SERVICIOS_DISPONIBLES.map((servicio) => (
                    <label key={servicio.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.servicios_disponibles.includes(servicio.value)}
                        onChange={() => handleServicioToggle(servicio.value)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{servicio.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Capacidad y Operación */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Capacidad y Operación</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacidad_maxima">Capacidad Máxima de Armados</Label>
                    <Input
                      id="capacidad_maxima"
                      type="number"
                      min="1"
                      value={formData.capacidad_maxima}
                      onChange={(e) => handleInputChange('capacidad_maxima', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tiempo_respuesta_promedio">Tiempo Respuesta (min)</Label>
                    <Input
                      id="tiempo_respuesta_promedio"
                      type="number"
                      min="0"
                      value={formData.tiempo_respuesta_promedio}
                      onChange={(e) => handleInputChange('tiempo_respuesta_promedio', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.disponibilidad_24h}
                    onCheckedChange={(checked) => handleInputChange('disponibilidad_24h', checked)}
                  />
                  <Label>Disponibilidad 24/7</Label>
                </div>
                
                {/* Información de Tarifas (Solo lectura - desde esquema) */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Modelo de Pago: Tiempo Fijo</span>
                    <Badge variant="outline" className="text-xs">
                      Desde Esquema Estándar
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs">Tarifa Base (12h)</p>
                      <p className="font-medium text-foreground">$1,300 MXN</p>
                    </div>
                    <div>
                      <p className="text-xs">Hora Extra</p>
                      <p className="font-medium text-foreground">$150 MXN</p>
                    </div>
                    <div>
                      <p className="text-xs">Viáticos</p>
                      <p className="font-medium text-foreground">$300 MXN</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Las tarifas se gestionan desde el esquema de pago estándar. Para tarifas personalizadas, crea un esquema específico.
                  </p>
                </div>
              </div>

              {/* Documentación */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Estado de Documentación</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <Label htmlFor="licencias_vigentes" className="cursor-pointer">
                      Licencias de Portación Vigentes
                    </Label>
                    <Switch
                      id="licencias_vigentes"
                      checked={formData.licencias_vigentes}
                      onCheckedChange={(checked) => handleInputChange('licencias_vigentes', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <Label htmlFor="documentos_completos" className="cursor-pointer">
                      Documentación Completa
                    </Label>
                    <Switch
                      id="documentos_completos"
                      checked={formData.documentos_completos}
                      onCheckedChange={(checked) => handleInputChange('documentos_completos', checked)}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  El proveedor estará activo cuando ambas validaciones estén completas
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : editingProveedor ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="maestro" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span>Datos Maestros</span>
          </TabsTrigger>
          <TabsTrigger value="pagos" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Pagos & Auditoría</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maestro" className="space-y-6">
          {/* Lista de Proveedores */}
          <div className="grid gap-4">
        {proveedores.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay proveedores registrados</p>
                <p className="text-sm text-muted-foreground">Crea el primer proveedor para comenzar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          proveedores.map((proveedor) => (
            <Card key={proveedor.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{proveedor.nombre_empresa}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{proveedor.telefono_contacto}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{proveedor.email_contacto}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(proveedor)}>
                      {getStatusText(proveedor)}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(proveedor)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Contacto Principal</p>
                    <p className="text-sm text-muted-foreground">{proveedor.contacto_principal}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Capacidad</p>
                    <p className="text-sm text-muted-foreground">
                      {proveedor.capacidad_actual}/{proveedor.capacidad_maxima} armados
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Zonas de Cobertura</p>
                  <div className="flex flex-wrap gap-1">
                    {proveedor.zonas_cobertura.map((zona) => (
                      <Badge key={zona} variant="secondary" className="text-xs">
                        {zona}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Servicios Disponibles</p>
                  <div className="flex flex-wrap gap-1">
                    {proveedor.servicios_disponibles.map((servicio) => (
                      <Badge key={servicio} variant="outline" className="text-xs">
                        {SERVICIOS_DISPONIBLES.find(s => s.value === servicio)?.label || servicio}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Esquema de Pago: Tiempo Fijo
                  </h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tarifa Base (12h):</span>
                      <p className="font-medium">$1,300 MXN</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora Extra:</span>
                      <p className="font-medium">$150 MXN</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Viáticos:</span>
                      <p className="font-medium">$300 MXN</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Shield className={`w-4 h-4 ${proveedor.licencias_vigentes ? 'text-green-600' : 'text-red-600'}`} />
                      <span>Licencias</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileCheck className={`w-4 h-4 ${proveedor.documentos_completos ? 'text-green-600' : 'text-red-600'}`} />
                      <span>Documentos</span>
                    </div>
                    {proveedor.disponibilidad_24h && (
                      <Badge variant="secondary" className="text-xs">24/7</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rating:</span>
                    <Badge variant="outline">
                      {proveedor.rating_proveedor.toFixed(1)}/5.0
                    </Badge>
                    <Switch
                      checked={proveedor.activo}
                      onCheckedChange={(checked) => toggleProveedorStatus(proveedor.id, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
          </div>
        </TabsContent>

        <TabsContent value="pagos">
          <ProveedoresPagosAuditoriaView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProveedoresArmadosTab;