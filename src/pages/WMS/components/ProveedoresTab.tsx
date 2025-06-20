
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Users, Star } from 'lucide-react';
import { useProveedores } from '@/hooks/useProveedores';
import { ProveedorDialog } from './ProveedorDialog';

export const ProveedoresTab = () => {
  const { proveedores, isLoading } = useProveedores();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProveedorDialog, setShowProveedorDialog] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const filteredProveedores = proveedores?.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.contacto_principal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (calificacion: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < calificacion ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => setShowProveedorDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Resumen de proveedores */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proveedores?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {proveedores?.filter(p => p.activo !== false).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proveedores?.length ? 
                  (proveedores.reduce((sum, p) => sum + (p.calificacion || 5), 0) / proveedores.length).toFixed(1) : 
                  '0.0'
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Descuentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proveedores?.filter(p => (p.descuento_por_volumen || 0) > 0).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Proveedores Registrados</CardTitle>
            <CardDescription>
              Directorio completo de proveedores y datos de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Condiciones</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores?.map((proveedor) => (
                  <TableRow key={proveedor.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{proveedor.nombre}</p>
                        <p className="text-sm text-gray-500">{proveedor.razon_social}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {proveedor.contacto_principal || proveedor.nombre}
                        </p>
                        <p className="text-sm text-gray-500">{proveedor.telefono_contacto || proveedor.telefono}</p>
                        <p className="text-sm text-gray-500">{proveedor.email_contacto || proveedor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(proveedor.calificacion || 5)}
                        <span className="text-sm text-gray-500 ml-2">
                          {proveedor.calificacion || 5}/5
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {proveedor.condiciones_pago || '30 días'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proveedor.descuento_por_volumen ? (
                        <Badge className="bg-green-100 text-green-800">
                          {proveedor.descuento_por_volumen}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Sin descuento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={proveedor.activo !== false ? 
                          'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }
                      >
                        {proveedor.activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProveedor(proveedor);
                          setShowProveedorDialog(true);
                        }}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ProveedorDialog
        open={showProveedorDialog}
        onOpenChange={setShowProveedorDialog}
        proveedor={selectedProveedor}
        onClose={() => {
          setShowProveedorDialog(false);
          setSelectedProveedor(null);
        }}
      />
    </>
  );
};
