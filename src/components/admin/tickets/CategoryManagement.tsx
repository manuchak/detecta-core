import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Save, X, icons, LucideIcon } from 'lucide-react';
import { TicketCategoria, TicketSubcategoria } from '@/hooks/useTicketCategories';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CategoryManagementProps {
  categorias: TicketCategoria[];
  subcategorias: TicketSubcategoria[];
  onUpdateCategoria: (id: string, updates: Partial<TicketCategoria>) => Promise<boolean>;
  onCreateCategoria: (categoria: Omit<TicketCategoria, 'id'>) => Promise<any>;
}

const DEPARTAMENTOS = ['Finanzas', 'Planeación', 'Instaladores', 'Supply', 'Soporte', 'Operaciones'];

// Iconos Lucide disponibles para categorías
const LUCIDE_ICONS = [
  'DollarSign', 'Receipt', 'Truck', 'MapPin', 'User', 'HelpCircle', 
  'Wrench', 'Phone', 'CreditCard', 'Package', 'Settings', 'MessageSquare',
  'FileText', 'AlertCircle', 'Calendar', 'Clock', 'Shield', 'Car'
];

// Helper para renderizar iconos dinámicamente (Lucide o emoji)
const renderIcon = (iconName: string, className: string = "h-5 w-5") => {
  // Check if it's a Lucide icon name
  const IconComponent = icons[iconName as keyof typeof icons] as LucideIcon | undefined;
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  // Fallback: render as emoji/text
  return <span className="text-xl">{iconName}</span>;
};

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categorias,
  subcategorias,
  onUpdateCategoria,
  onCreateCategoria
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TicketCategoria>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoria, setNewCategoria] = useState<Partial<TicketCategoria>>({
    nombre: '',
    icono: 'FileText',
    color: '#6B7280',
    departamento_responsable: 'Soporte',
    sla_horas_respuesta: 4,
    sla_horas_resolucion: 24,
    activo: true,
    orden: categorias.length + 1
  });

  const startEditing = (categoria: TicketCategoria) => {
    setEditingId(categoria.id);
    setEditValues(categoria);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEditing = async () => {
    if (editingId && editValues) {
      const success = await onUpdateCategoria(editingId, editValues);
      if (success) {
        setEditingId(null);
        setEditValues({});
      }
    }
  };

  const handleCreate = async () => {
    const result = await onCreateCategoria(newCategoria as any);
    if (result) {
      setIsCreating(false);
      setNewCategoria({
        nombre: '',
        icono: 'FileText',
        color: '#6B7280',
        departamento_responsable: 'Soporte',
        sla_horas_respuesta: 4,
        sla_horas_resolucion: 24,
        activo: true,
        orden: categorias.length + 2
      });
    }
  };

  const getSubcategoriasCount = (categoriaId: string) => {
    return subcategorias.filter(s => s.categoria_id === categoriaId).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Icono</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-center">SLA Respuesta</TableHead>
              <TableHead className="text-center">SLA Resolución</TableHead>
              <TableHead className="text-center">Subcategorías</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((cat) => {
              const isEditing = editingId === cat.id;
              
              return (
                <TableRow key={cat.id}>
                  <TableCell>
                    {isEditing ? (
                      <Select 
                        value={editValues.icono || cat.icono}
                        onValueChange={(v) => setEditValues({ ...editValues, icono: v })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue>
                            <span className="flex items-center gap-2">
                              {renderIcon(editValues.icono || cat.icono, "h-4 w-4")}
                              <span className="text-xs truncate">{editValues.icono || cat.icono}</span>
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LUCIDE_ICONS.map((iconName) => (
                            <SelectItem key={iconName} value={iconName}>
                              <span className="flex items-center gap-2">
                                {renderIcon(iconName, "h-4 w-4")}
                                <span>{iconName}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center justify-center">
                        {renderIcon(cat.icono, "h-6 w-6 text-muted-foreground")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.nombre || ''}
                        onChange={(e) => setEditValues({ ...editValues, nombre: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.nombre}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select 
                        value={editValues.departamento_responsable || cat.departamento_responsable}
                        onValueChange={(v) => setEditValues({ ...editValues, departamento_responsable: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTAMENTOS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{cat.departamento_responsable}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.sla_horas_respuesta || 0}
                        onChange={(e) => setEditValues({ ...editValues, sla_horas_respuesta: parseInt(e.target.value) })}
                        className="w-20 mx-auto"
                      />
                    ) : (
                      <span>{cat.sla_horas_respuesta}h</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.sla_horas_resolucion || 0}
                        onChange={(e) => setEditValues({ ...editValues, sla_horas_resolucion: parseInt(e.target.value) })}
                        className="w-20 mx-auto"
                      />
                    ) : (
                      <span>{cat.sla_horas_resolucion}h</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{getSubcategoriasCount(cat.id)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Switch
                        checked={editValues.activo ?? cat.activo}
                        onCheckedChange={(checked) => setEditValues({ ...editValues, activo: checked })}
                      />
                    ) : (
                      <Badge variant={cat.activo ? 'default' : 'secondary'}>
                        {cat.activo ? 'Sí' : 'No'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={saveEditing}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => startEditing(cat)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría de tickets
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre</Label>
              <Input
                value={newCategoria.nombre || ''}
                onChange={(e) => setNewCategoria({ ...newCategoria, nombre: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Icono</Label>
              <Select 
                value={newCategoria.icono}
                onValueChange={(v) => setNewCategoria({ ...newCategoria, icono: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {renderIcon(newCategoria.icono || 'FileText', "h-4 w-4")}
                      <span>{newCategoria.icono}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LUCIDE_ICONS.map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                      <span className="flex items-center gap-2">
                        {renderIcon(iconName, "h-4 w-4")}
                        <span>{iconName}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Departamento</Label>
              <Select 
                value={newCategoria.departamento_responsable}
                onValueChange={(v) => setNewCategoria({ ...newCategoria, departamento_responsable: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">SLA Respuesta (h)</Label>
              <Input
                type="number"
                value={newCategoria.sla_horas_respuesta || 0}
                onChange={(e) => setNewCategoria({ ...newCategoria, sla_horas_respuesta: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">SLA Resolución (h)</Label>
              <Input
                type="number"
                value={newCategoria.sla_horas_resolucion || 0}
                onChange={(e) => setNewCategoria({ ...newCategoria, sla_horas_resolucion: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
