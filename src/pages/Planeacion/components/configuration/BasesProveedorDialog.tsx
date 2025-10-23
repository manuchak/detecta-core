import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Plus, Edit, Trash2, Star, Building2, Phone, Clock } from 'lucide-react';
import { useBasesProveedores, type BaseProveedor, type CreateBaseData } from '@/hooks/useBasesProveedores';
import { Skeleton } from '@/components/ui/skeleton';

interface BasesProveedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedorId: string;
  proveedorNombre: string;
}

interface BaseFormData {
  nombre_base: string;
  ciudad: string;
  direccion_completa: string;
  codigo_postal: string;
  contacto_base: string;
  telefono_base: string;
  horario_operacion: string;
  capacidad_armados: number;
  observaciones: string;
}

const initialFormData: BaseFormData = {
  nombre_base: '',
  ciudad: '',
  direccion_completa: '',
  codigo_postal: '',
  contacto_base: '',
  telefono_base: '',
  horario_operacion: '24/7',
  capacidad_armados: 10,
  observaciones: ''
};

export function BasesProveedorDialog({ 
  open, 
  onOpenChange, 
  proveedorId, 
  proveedorNombre 
}: BasesProveedorDialogProps) {
  const { bases, loading, createBase, updateBase, deleteBase, toggleBaseStatus, setBasePrincipal } = useBasesProveedores(proveedorId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<string | null>(null);
  const [formData, setFormData] = useState<BaseFormData>(initialFormData);

  const handleInputChange = (field: keyof BaseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre_base || !formData.ciudad || !formData.direccion_completa) {
      return;
    }

    const baseData: CreateBaseData = {
      proveedor_id: proveedorId,
      ...formData
    };

    try {
      if (editingBase) {
        await updateBase(editingBase, formData);
      } else {
        await createBase(baseData);
      }
      setFormData(initialFormData);
      setEditingBase(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving base:', error);
    }
  };

  const handleEdit = (base: BaseProveedor) => {
    setFormData({
      nombre_base: base.nombre_base,
      ciudad: base.ciudad,
      direccion_completa: base.direccion_completa,
      codigo_postal: base.codigo_postal || '',
      contacto_base: base.contacto_base || '',
      telefono_base: base.telefono_base || '',
      horario_operacion: base.horario_operacion || '24/7',
      capacidad_armados: base.capacidad_armados,
      observaciones: base.observaciones || ''
    });
    setEditingBase(base.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (baseId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta base?')) {
      await deleteBase(baseId);
    }
  };

  const handleNewBase = () => {
    setFormData(initialFormData);
    setEditingBase(null);
    setIsFormOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bases de {proveedorNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header con botón para agregar */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Gestiona las ubicaciones físicas del proveedor donde los custodios pueden recoger a los armados
              </p>
            </div>
            <Button onClick={handleNewBase} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Base
            </Button>
          </div>

          <Separator />

          {/* Formulario */}
          {isFormOpen && (
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="space-y-4">
                <h4 className="font-medium">
                  {editingBase ? 'Editar Base' : 'Nueva Base'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_base">Nombre de la Base *</Label>
                    <Input
                      id="nombre_base"
                      value={formData.nombre_base}
                      onChange={(e) => handleInputChange('nombre_base', e.target.value)}
                      placeholder="Base Norte, Sucursal Centro, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                      placeholder="Ciudad de México, Guadalajara, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="direccion_completa">Dirección Completa *</Label>
                  <Input
                    id="direccion_completa"
                    value={formData.direccion_completa}
                    onChange={(e) => handleInputChange('direccion_completa', e.target.value)}
                    placeholder="Calle, número, colonia"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input
                      id="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                      placeholder="03100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacidad_armados">Capacidad</Label>
                    <Input
                      id="capacidad_armados"
                      type="number"
                      value={formData.capacidad_armados}
                      onChange={(e) => handleInputChange('capacidad_armados', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="horario_operacion">Horario</Label>
                    <Input
                      id="horario_operacion"
                      value={formData.horario_operacion}
                      onChange={(e) => handleInputChange('horario_operacion', e.target.value)}
                      placeholder="24/7, 8am-8pm, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contacto_base">Contacto</Label>
                    <Input
                      id="contacto_base"
                      value={formData.contacto_base}
                      onChange={(e) => handleInputChange('contacto_base', e.target.value)}
                      placeholder="Nombre del encargado"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono_base">Teléfono</Label>
                    <Input
                      id="telefono_base"
                      value={formData.telefono_base}
                      onChange={(e) => handleInputChange('telefono_base', e.target.value)}
                      placeholder="55-1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Input
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Instrucciones especiales, referencias, etc."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingBase ? 'Actualizar' : 'Crear'} Base
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingBase(null);
                      setFormData(initialFormData);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de bases */}
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : bases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No hay bases registradas</p>
                <p className="text-sm">Agrega la primera base para este proveedor</p>
              </div>
            ) : (
              bases.map((base) => (
                <Card key={base.id} className={`p-4 ${!base.activa ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{base.nombre_base}</h4>
                        {base.es_base_principal && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                        {!base.activa && (
                          <Badge variant="outline" className="text-xs">
                            Inactiva
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{base.ciudad}</p>
                            <p className="text-muted-foreground">{base.direccion_completa}</p>
                            {base.codigo_postal && (
                              <p className="text-xs text-muted-foreground">CP: {base.codigo_postal}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {base.contacto_base && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{base.contacto_base}</span>
                              {base.telefono_base && <span className="text-xs">({base.telefono_base})</span>}
                            </div>
                          )}
                          {base.horario_operacion && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{base.horario_operacion}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Capacidad: {base.capacidad_armados} armados
                          </div>
                        </div>
                      </div>

                      {base.observaciones && (
                        <p className="text-xs text-muted-foreground mt-2">
                          📝 {base.observaciones}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!base.es_base_principal && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBasePrincipal(proveedorId, base.id)}
                          title="Marcar como base principal"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Switch
                        checked={base.activa}
                        onCheckedChange={(checked) => toggleBaseStatus(base.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(base)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(base.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
