import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { 
  usePredefinedMeetingPoints, 
  useCreateMeetingPoint, 
  useUpdateMeetingPoint, 
  useDeleteMeetingPoint,
  type MeetingPoint,
  type CreateMeetingPointData
} from '@/hooks/usePredefinedMeetingPoints';

const categorias = [
  { value: 'centro_comercial', label: 'Centro Comercial' },
  { value: 'estacion', label: 'Estación Metro/Tren' },
  { value: 'punto_referencia', label: 'Punto de Referencia' },
  { value: 'gasolinera', label: 'Gasolinera' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'oficina', label: 'Edificio de Oficinas' },
  { value: 'otro', label: 'Otro' }
];

const zonas = [
  'Polanco', 'Santa Fe', 'Centro Histórico', 'Roma Norte', 'Condesa', 
  'Coyoacán', 'Interlomas', 'Satélite', 'Insurgentes', 'Zona Rosa',
  'Del Valle', 'Nápoles', 'Doctores', 'Juárez', 'Cuauhtémoc'
];

export function ManageMeetingPointsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<MeetingPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<CreateMeetingPointData>({
    nombre: '',
    descripcion: '',
    direccion_completa: '',
    categoria: '',
    zona: ''
  });

  const { data: meetingPoints, isLoading } = usePredefinedMeetingPoints();
  const createMutation = useCreateMeetingPoint();
  const updateMutation = useUpdateMeetingPoint();
  const deleteMutation = useDeleteMeetingPoint();

  const filteredPoints = meetingPoints?.filter(point => 
    point.activo && (
      point.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.zona.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.direccion_completa.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPoint) {
      await updateMutation.mutateAsync({
        id: editingPoint.id,
        data: formData
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      direccion_completa: '',
      categoria: '',
      zona: ''
    });
    setEditingPoint(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (point: MeetingPoint) => {
    setEditingPoint(point);
    setFormData({
      nombre: point.nombre,
      descripcion: point.descripcion || '',
      direccion_completa: point.direccion_completa,
      categoria: point.categoria,
      zona: point.zona
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este punto de encuentro?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getCategoryLabel = (categoria: string) => {
    return categorias.find(cat => cat.value === categoria)?.label || categoria;
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'centro_comercial': return '🏬';
      case 'estacion': return '🚇';
      case 'punto_referencia': return '📍';
      case 'gasolinera': return '⛽';
      case 'hotel': return '🏨';
      case 'oficina': return '🏢';
      default: return '📍';
    }
  };

  if (isLoading) {
    return <div>Cargando ubicaciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar ubicaciones por nombre, zona o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
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
                {editingPoint ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Centro Comercial Santa Fe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, zona: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map(zona => (
                      <SelectItem key={zona} value={zona}>
                        {zona}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="direccion">Dirección Completa</Label>
                <Input
                  id="direccion"
                  value={formData.direccion_completa}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion_completa: e.target.value }))}
                  placeholder="Dirección completa con referencias"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Referencias adicionales, nivel de estacionamiento, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPoint ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meeting points grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPoints.map(point => (
          <Card key={point.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(point.categoria)}</span>
                  <div>
                    <CardTitle className="text-base">{point.nombre}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {point.zona}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(point)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(point.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {point.direccion_completa}
                </p>
                
                {point.descripcion && (
                  <p className="text-xs bg-muted p-2 rounded">
                    {point.descripcion}
                  </p>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(point.categoria)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPoints.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron ubicaciones favoritas.</p>
            <p className="text-sm">Agrega la primera ubicación para comenzar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}