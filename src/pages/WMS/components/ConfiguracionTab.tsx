
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Settings, Tag } from 'lucide-react';
import { useCategorias } from '@/hooks/useCategorias';
import { Badge } from '@/components/ui/badge';

export const ConfiguracionTab = () => {
  const { categorias, isLoading } = useCategorias();

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
              <Button size="sm">
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
                      <p className="text-sm text-gray-500 mt-1">{categoria.descripcion}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </div>
              )) || (
                <div className="text-center py-6 text-gray-500">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay categorías configuradas</p>
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock_minimo_default">Stock Mínimo por Defecto</Label>
              <Input
                id="stock_minimo_default"
                type="number"
                defaultValue="5"
                placeholder="5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock_maximo_default">Stock Máximo por Defecto</Label>
              <Input
                id="stock_maximo_default"
                type="number"
                defaultValue="100"
                placeholder="100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moneda_default">Moneda por Defecto</Label>
              <Input
                id="moneda_default"
                defaultValue="MXN"
                placeholder="MXN"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ubicacion_default">Ubicación de Almacén por Defecto</Label>
              <Input
                id="ubicacion_default"
                defaultValue="A-1-1"
                placeholder="A-1-1"
              />
            </div>
            
            <Button className="w-full">
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
