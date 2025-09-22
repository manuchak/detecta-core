import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, MapPin, Building, Home, Factory, Star } from 'lucide-react';
import { 
  usePredefinedMeetingPoints, 
  useCreateMeetingPoint, 
  useUpdateMeetingPoint, 
  useDeleteMeetingPoint,
  type MeetingPoint,
  type CreateMeetingPointData 
} from '@/hooks/usePredefinedMeetingPoints';
import { useArmedGuardsOperativos } from '@/hooks/useArmedGuardsOperativos';
import { useProveedoresArmados } from '@/hooks/useProveedoresArmados';
import { useToast } from '@/hooks/use-toast';

const categorias = [
  { value: 'Terminal', label: 'Terminal de Autobuses' },
  { value: 'Metro', label: 'Estación de Metro' },
  { value: 'Centro Comercial', label: 'Centro Comercial' },
  { value: 'Hospital', label: 'Hospital' },
  { value: 'Escuela', label: 'Escuela/Universidad' },
  { value: 'Parque', label: 'Parque' },
  { value: 'Oficina', label: 'Oficina' },
  { value: 'Domicilio', label: 'Domicilio' },
  { value: 'Base Operacional', label: 'Base Operacional' },
  { value: 'Otro', label: 'Otro' }
];

const zonas = [
  'Norte', 'Sur', 'Este', 'Oeste', 'Centro', 'Metropolitana',
  'Orizaba', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Personal'
];

const tiposOperacion = [
  { value: 'general', label: 'General', icon: Star },
  { value: 'base_empresa', label: 'Base de Empresa', icon: Building },
  { value: 'direccion_personal', label: 'Dirección Personal', icon: Home },
  { value: 'base_proveedor', label: 'Base de Proveedor', icon: Factory }
];

export function ContextualMeetingPointsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<MeetingPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState<CreateMeetingPointData>({
    nombre: '',
    descripcion: '',
    direccion_completa: '',
    categoria: '',
    zona: '',
    tipo_operacion: 'general'
  });

  // Data hooks
  const { data: allPoints = [], refetch } = usePredefinedMeetingPoints();
  const { armedGuards } = useArmedGuardsOperativos();
  const { proveedores: providers } = useProveedoresArmados();
  const createMutation = useCreateMeetingPoint();
  const updateMutation = useUpdateMeetingPoint();
  const deleteMutation = useDeleteMeetingPoint();
  const { toast } = useToast();

  // Filter points by type and search
  const filteredPoints = allPoints.filter(point => {
    const matchesSearch = 
      point.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.direccion_completa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.zona.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || point.tipo_operacion === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Group points by type
  const groupedPoints = {
    general: filteredPoints.filter(p => p.tipo_operacion === 'general'),
    base_empresa: filteredPoints.filter(p => p.tipo_operacion === 'base_empresa'),
    direccion_personal: filteredPoints.filter(p => p.tipo_operacion === 'direccion_personal'),
    base_proveedor: filteredPoints.filter(p => p.tipo_operacion === 'base_proveedor')
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPoint) {
        await updateMutation.mutateAsync({ id: editingPoint.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving meeting point:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      direccion_completa: '',
      categoria: '',
      zona: '',
      tipo_operacion: 'general'
    });
    setEditingPoint(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (point: MeetingPoint) => {
    setFormData({
      nombre: point.nombre,
      descripcion: point.descripcion || '',
      direccion_completa: point.direccion_completa,
      categoria: point.categoria,
      zona: point.zona,
      tipo_operacion: point.tipo_operacion,
      armado_interno_id: point.armado_interno_id,
      proveedor_id: point.proveedor_id,
      base_empresa: point.base_empresa
    });
    setEditingPoint(point);
    setIsDialogOpen(true);
  };

  const handleDelete = async (point: MeetingPoint) => {
    if (window.confirm(`¿Estás seguro de eliminar "${point.nombre}"?`)) {
      try {
        await deleteMutation.mutateAsync(point.id);
        toast({
          title: 'Punto eliminado',
          description: `${point.nombre} ha sido eliminado exitosamente.`
        });
        refetch();
      } catch (error) {
        console.error('Error deleting point:', error);
      }
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'terminal': return '🚌';
      case 'metro': return '🚇';
      case 'centro comercial': return '🛍️';
      case 'hospital': return '🏥';
      case 'escuela': return '🏫';
      case 'parque': return '🌳';
      case 'domicilio': return '🏠';
      case 'base operacional': return '🏢';
      default: return '📍';
    }
  };

  const getTypeIcon = (tipo: string) => {
    const typeData = tiposOperacion.find(t => t.value === tipo);
    if (typeData) {
      const IconComponent = typeData.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
  };

  const getLinkedName = (point: MeetingPoint) => {
    if (point.armado_interno_id) {
      const guard = armedGuards.find(g => g.id === point.armado_interno_id);
      return guard?.nombre || 'Armado desconocido';
    }
    if (point.proveedor_id) {
      const provider = providers.find(p => p.id === point.proveedor_id);
      return provider?.nombre_empresa || 'Proveedor desconocido';
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión Contextual de Ubicaciones</h2>
          <p className="text-muted-foreground">
            Administra puntos de encuentro organizados por tipo y contexto operacional
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Ubicación
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPoint ? 'Editar' : 'Nueva'} Ubicación
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tipo_operacion">Tipo de Operación</Label>
                <Select 
                  value={formData.tipo_operacion} 
                  onValueChange={(value: any) => setFormData({...formData, tipo_operacion: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposOperacion.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          <tipo.icon className="h-4 w-4" />
                          {tipo.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData({...formData, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zona">Zona</Label>
                <Select 
                  value={formData.zona} 
                  onValueChange={(value) => setFormData({...formData, zona: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map((zona) => (
                      <SelectItem key={zona} value={zona}>
                        {zona}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="direccion">Dirección Completa</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion_completa}
                  onChange={(e) => setFormData({...formData, direccion_completa: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPoint ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar ubicaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todas ({allPoints.length})</TabsTrigger>
          <TabsTrigger value="general">Generales ({groupedPoints.general.length})</TabsTrigger>
          <TabsTrigger value="base_empresa">Bases ({groupedPoints.base_empresa.length})</TabsTrigger>
          <TabsTrigger value="direccion_personal">Personales ({groupedPoints.direccion_personal.length})</TabsTrigger>
          <TabsTrigger value="base_proveedor">Proveedores ({groupedPoints.base_proveedor.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPoints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No se encontraron ubicaciones
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Agrega la primera ubicación'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPoints.map((point) => (
                <Card key={point.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(point.categoria)}</span>
                        <div>
                          <CardTitle className="text-base">{point.nombre}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            {getTypeIcon(point.tipo_operacion)}
                            <span className="text-xs text-muted-foreground">
                              {tiposOperacion.find(t => t.value === point.tipo_operacion)?.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(point)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(point)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{point.zona}</Badge>
                      <Badge variant="outline">{point.categoria}</Badge>
                      {point.frecuencia_uso > 0 && (
                        <Badge variant="secondary">
                          {point.frecuencia_uso} usos
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {point.direccion_completa}
                    </p>
                    
                    {point.descripcion && (
                      <p className="text-sm text-muted-foreground italic">
                        {point.descripcion}
                      </p>
                    )}
                    
                    {getLinkedName(point) && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">Vinculado a:</span>
                        <Badge variant="outline" className="text-xs">
                          {getLinkedName(point)}
                        </Badge>
                      </div>
                    )}
                    
                    {point.auto_agregado && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>✨</span>
                        <span>Agregado automáticamente</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}