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
  horas_base_incluidas: number;
  tarifa_base_12h: number;
  tarifa_hora_extra: number;
  viaticos_diarios: number;
  aplica_viaticos_foraneos: boolean;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio: number;
  observaciones: string;
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
  horas_base_incluidas: 12,
  tarifa_base_12h: 1300,
  tarifa_hora_extra: 150,
  viaticos_diarios: 300,
  aplica_viaticos_foraneos: true,
  disponibilidad_24h: false,
  tiempo_respuesta_promedio: 60,
  observaciones: ''
};

export function ProveedoresArmadosTab() {
  const { proveedores, loading, createProveedor, updateProveedor, toggleProveedorStatus, updateProveedorDocumentStatus } = useProveedoresArmados();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProveedorFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('maestro');

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
      horas_base_incluidas: 12,
      tarifa_base_12h: 1300,
      tarifa_hora_extra: 150,
      viaticos_diarios: 300,
      aplica_viaticos_foraneos: true,
      disponibilidad_24h: proveedor.disponibilidad_24h || false,
      tiempo_respuesta_promedio: proveedor.tiempo_respuesta_promedio || 60,
      observaciones: proveedor.observaciones || ''
    });
    setEditingProveedor(proveedor.id);
    setIsDialogOpen(true);
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

              {/* Capacidad y Modelo de Pago */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Capacidad y Modelo de Pago</h4>
                  <Badge variant="outline" className="text-xs">
                    ⏱️ Esquema: Tiempo Fijo
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacidad_maxima">Capacidad Máxima de Custodios</Label>
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
                
                {/* Configuración de Tarifas según Esquema de Tiempo Fijo */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span>Configuración de Tarifas (Tiempo Fijo)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="horas_base_incluidas">Horas Base Incluidas</Label>
                      <Input
                        id="horas_base_incluidas"
                        type="number"
                        min="1"
                        value={formData.horas_base_incluidas}
                        onChange={(e) => handleInputChange('horas_base_incluidas', parseInt(e.target.value))}
                        placeholder="12"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Horas incluidas en la tarifa base
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="tarifa_base_12h">Tarifa Base ($MXN)</Label>
                      <Input
                        id="tarifa_base_12h"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tarifa_base_12h}
                        onChange={(e) => handleInputChange('tarifa_base_12h', parseFloat(e.target.value))}
                        placeholder="1300"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pago por {formData.horas_base_incluidas || 12} horas de trabajo
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tarifa_hora_extra">Tarifa Hora Extra ($MXN)</Label>
                      <Input
                        id="tarifa_hora_extra"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tarifa_hora_extra}
                        onChange={(e) => handleInputChange('tarifa_hora_extra', parseFloat(e.target.value))}
                        placeholder="150"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Por cada hora adicional
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="viaticos_diarios">Viáticos Diarios ($MXN)</Label>
                      <Input
                        id="viaticos_diarios"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.viaticos_diarios}
                        onChange={(e) => handleInputChange('viaticos_diarios', parseFloat(e.target.value))}
                        placeholder="300"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Para servicios foráneos que excedan jornada base
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="aplica_viaticos_foraneos"
                      checked={formData.aplica_viaticos_foraneos}
                      onChange={(e) => handleInputChange('aplica_viaticos_foraneos', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="aplica_viaticos_foraneos" className="cursor-pointer">
                      Aplicar viáticos automáticamente en servicios foráneos que excedan {formData.horas_base_incluidas || 12}h
                    </Label>
                  </div>
                  
                  {/* Ejemplo de cálculo */}
                  <div className="bg-primary/5 border border-primary/20 rounded p-3 text-sm">
                    <p className="font-medium text-foreground mb-2">📊 Ejemplo de Cálculo:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Servicio de 14 horas: ${formData.tarifa_base_12h || 1300} (base) + ${(formData.tarifa_hora_extra || 150) * 2} (2h extra) = ${(formData.tarifa_base_12h || 1300) + ((formData.tarifa_hora_extra || 150) * 2)}</li>
                      <li>• Si es foráneo: +${formData.viaticos_diarios || 300} viáticos = ${(formData.tarifa_base_12h || 1300) + ((formData.tarifa_hora_extra || 150) * 2) + (formData.viaticos_diarios || 300)}</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.disponibilidad_24h}
                    onCheckedChange={(checked) => handleInputChange('disponibilidad_24h', checked)}
                  />
                  <Label>Disponibilidad 24/7</Label>
                </div>
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