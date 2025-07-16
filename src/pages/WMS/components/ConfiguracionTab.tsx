
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Settings, Tag } from 'lucide-react';
import { useCategorias } from '@/hooks/useCategorias';
import { useConfiguracionWMS } from '@/hooks/useConfiguracionWMS';
import { Badge } from '@/components/ui/badge';
import { NuevaCategoriaDialog } from './NuevaCategoriaDialog';

export const ConfiguracionTab = () => {
  const { categorias, isLoading: isLoadingCategorias } = useCategorias();
  const { configuracion, isLoading: isLoadingConfig, updateConfiguracion } = useConfiguracionWMS();
  const [showNuevaCategoriaDialog, setShowNuevaCategoriaDialog] = useState(false);
  
  // Estado local para el formulario
  const [formData, setFormData] = useState({
    stock_minimo_default: 5,
    stock_maximo_default: 100,
    moneda_default: 'MXN',
    ubicacion_almacen_default: 'A-1-1'
  });

  // Actualizar form data cuando se carga la configuración
  useEffect(() => {
    if (configuracion) {
      setFormData({
        stock_minimo_default: configuracion.stock_minimo_default,
        stock_maximo_default: configuracion.stock_maximo_default,
        moneda_default: configuracion.moneda_default,
        ubicacion_almacen_default: configuracion.ubicacion_almacen_default
      });
    }
  }, [configuracion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfiguracion.mutateAsync(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
        <p className="text-muted-foreground">Configuración general del módulo WMS</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Categorías */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categorías de Productos
                </CardTitle>
                <CardDescription>
                  Gestiona las categorías para clasificar productos
                </CardDescription>
              </div>
              <Button 
                size="sm"
                onClick={() => setShowNuevaCategoriaDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorias?.map((categoria) => (
                <div 
                  key={categoria.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{categoria.codigo}</Badge>
                      <span className="font-medium">{categoria.nombre}</span>
                    </div>
                    {categoria.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1">{categoria.descripcion}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </div>
              )) || (
                <div className="text-center py-6 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No hay categorías configuradas</p>
                </div>
              )}
              {isLoadingCategorias && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Cargando categorías...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Parámetros generales del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock_minimo_default">Stock Mínimo por Defecto</Label>
                <Input
                  id="stock_minimo_default"
                  type="number"
                  min="0"
                  value={formData.stock_minimo_default}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    stock_minimo_default: parseInt(e.target.value) || 0
                  }))}
                  placeholder="5"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock_maximo_default">Stock Máximo por Defecto</Label>
                <Input
                  id="stock_maximo_default"
                  type="number"
                  min="0"
                  value={formData.stock_maximo_default}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    stock_maximo_default: parseInt(e.target.value) || 0
                  }))}
                  placeholder="100"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="moneda_default">Moneda por Defecto</Label>
                <Input
                  id="moneda_default"
                  value={formData.moneda_default}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    moneda_default: e.target.value
                  }))}
                  placeholder="MXN"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ubicacion_default">Ubicación de Almacén por Defecto</Label>
                <Input
                  id="ubicacion_default"
                  value={formData.ubicacion_almacen_default}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ubicacion_almacen_default: e.target.value
                  }))}
                  placeholder="A-1-1"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateConfiguracion.isPending || isLoadingConfig}
              >
                {updateConfiguracion.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Nueva Categoría */}
      <NuevaCategoriaDialog
        open={showNuevaCategoriaDialog}
        onOpenChange={setShowNuevaCategoriaDialog}
      />
    </div>
  );
};
