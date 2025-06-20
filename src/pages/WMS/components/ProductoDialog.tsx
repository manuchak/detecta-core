
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
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useCategorias } from '@/hooks/useCategorias';
import type { ProductoInventario } from '@/types/wms';

interface ProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoInventario | null;
  onClose: () => void;
}

export const ProductoDialog = ({ open, onOpenChange, producto, onClose }: ProductoDialogProps) => {
  const { createProducto, updateProducto } = useProductosInventario();
  const { categorias } = useCategorias();
  const [formData, setFormData] = useState({
    codigo_producto: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    marca: '',
    modelo: '',
    unidad_medida: 'pieza',
    precio_compra_promedio: 0,
    precio_venta_sugerido: 0,
    stock_minimo: 5,
    stock_maximo: 100,
    ubicacion_almacen: '',
    es_serializado: false,
    requiere_configuracion: false,
    garantia_meses: 12,
    activo: true
  });

  useEffect(() => {
    if (producto) {
      setFormData({
        codigo_producto: producto.codigo_producto || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria_id: producto.categoria_id || '',
        marca: producto.marca || '',
        modelo: producto.modelo || '',
        unidad_medida: producto.unidad_medida || 'pieza',
        precio_compra_promedio: producto.precio_compra_promedio || 0,
        precio_venta_sugerido: producto.precio_venta_sugerido || 0,
        stock_minimo: producto.stock_minimo || 5,
        stock_maximo: producto.stock_maximo || 100,
        ubicacion_almacen: producto.ubicacion_almacen || '',
        es_serializado: producto.es_serializado || false,
        requiere_configuracion: producto.requiere_configuracion || false,
        garantia_meses: producto.garantia_meses || 12,
        activo: producto.activo !== false
      });
    } else {
      // Reset para nuevo producto
      setFormData({
        codigo_producto: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        marca: '',
        modelo: '',
        unidad_medida: 'pieza',
        precio_compra_promedio: 0,
        precio_venta_sugerido: 0,
        stock_minimo: 5,
        stock_maximo: 100,
        ubicacion_almacen: '',
        es_serializado: false,
        requiere_configuracion: false,
        garantia_meses: 12,
        activo: true
      });
    }
  }, [producto, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (producto) {
        await updateProducto.mutateAsync({ id: producto.id, ...formData });
      } else {
        await createProducto.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving producto:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {producto ? 'Modifica la información del producto' : 'Agrega un nuevo producto al inventario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo_producto}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_producto: e.target.value }))}
                placeholder="GPS-001"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select 
                value={formData.categoria_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Producto *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="GPS Tracker Profesional"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción detallada del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                placeholder="Teltonika"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                placeholder="FMC001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio_compra">Precio Compra</Label>
              <Input
                id="precio_compra"
                type="number"
                step="0.01"
                value={formData.precio_compra_promedio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_compra_promedio: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock_min">Stock Mínimo</Label>
              <Input
                id="stock_min"
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock_max">Stock Máximo</Label>
              <Input
                id="stock_max"
                type="number"
                value={formData.stock_maximo}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_maximo: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación en Almacén</Label>
            <Input
              id="ubicacion"
              value={formData.ubicacion_almacen}
              onChange={(e) => setFormData(prev => ({ ...prev, ubicacion_almacen: e.target.value }))}
              placeholder="Estante A-1-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="serializado"
                checked={formData.es_serializado}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, es_serializado: checked }))}
              />
              <Label htmlFor="serializado">Requiere número de serie</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="configuracion"
                checked={formData.requiere_configuracion}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiere_configuracion: checked }))}
              />
              <Label htmlFor="configuracion">Requiere configuración</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createProducto.isPending || updateProducto.isPending}
            >
              {producto ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
