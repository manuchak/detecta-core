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
import { Plus, Search, Users, Phone, Mail, Edit, Star, MapPin } from 'lucide-react';
import { useProveedores } from '@/hooks/useProveedores';
import { ProveedorDialog } from './ProveedorDialog';

export const ProveedoresTab = () => {
  const { proveedores, isLoading } = useProveedores();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProveedorDialog, setShowProveedorDialog] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const filteredProveedores = proveedores?.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCalificacion = (calificacion: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < calificacion ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({calificacion}/5)</span>
      </div>
    );
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
        {/* Header con botón prominente cuando no hay proveedores */}
        {(!proveedores || proveedores.length === 0) ? (
          <EmptyProveedoresState onCreateProveedor={() => setShowProveedorDialog(true)} />
        ) : (
          <>
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
              <Button onClick={() => setShowProveedorDialog(true)} className="bg-primary hover:bg-primary/90">
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
                    {proveedores?.filter(p => p.activo).length || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {proveedores?.length > 0 
                      ? (proveedores.reduce((acc, p) => acc + (p.calificacion || 5), 0) / proveedores.length).toFixed(1)
                      : "0"
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ciudades</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(proveedores?.map(p => p.ciudad).filter(Boolean)).size || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Directorio de Proveedores</CardTitle>
                <CardDescription>
                  Gestiona tu red de proveedores y sus datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!filteredProveedores || filteredProveedores.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No se encontraron proveedores</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'Intenta con diferentes términos de búsqueda' : 'Todos los proveedores están aquí'}
                    </p>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Términos</TableHead>
                        <TableHead>Calificación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProveedores?.map((proveedor) => (
                        <TableRow key={proveedor.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{proveedor.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {proveedor.razon_social || proveedor.rfc}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {proveedor.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {proveedor.email}
                                </div>
                              )}
                              {proveedor.telefono && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {proveedor.telefono}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{proveedor.ciudad}</p>
                              <p className="text-muted-foreground">{proveedor.estado}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{proveedor.terminos_pago}</p>
                              <p className="text-muted-foreground">
                                {proveedor.dias_credito} días
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderCalificacion(proveedor.calificacion || 5)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={proveedor.activo ? "default" : "secondary"}>
                              {proveedor.activo ? "Activo" : "Inactivo"}
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
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
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

// Componente para el estado vacío
const EmptyProveedoresState = ({ onCreateProveedor }: { onCreateProveedor: () => void }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl w-64 h-64"></div>
      <Users className="relative h-24 w-24 text-primary mx-auto" />
    </div>
    
    <div className="space-y-4 max-w-md">
      <h1 className="text-3xl font-bold tracking-tight">Directorio de Proveedores</h1>
      <p className="text-lg text-muted-foreground">
        Comienza agregando tu primer proveedor para gestionar toda tu red de suministro desde aquí.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <Button onClick={onCreateProveedor} size="lg" className="bg-primary hover:bg-primary/90">
        <Plus className="h-5 w-5 mr-2" />
        Agregar Primer Proveedor
      </Button>
      <Button variant="outline" size="lg">
        <Users className="h-5 w-5 mr-2" />
        Importar Proveedores
      </Button>
    </div>

    <div className="grid md:grid-cols-3 gap-6 max-w-4xl pt-8">
      <FeatureCard 
        icon={Users}
        title="Gestión Centralizada"
        description="Administra todos tus proveedores desde un solo lugar con información completa"
      />
      <FeatureCard 
        icon={Star}
        title="Sistema de Calificaciones"
        description="Evalúa y compara el desempeño de tus proveedores"
      />
      <FeatureCard 
        icon={Phone}
        title="Contacto Directo"
        description="Información de contacto organizada para comunicación rápida"
      />
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <Card className="text-center p-6 border-dashed hover:border-solid transition-all hover:shadow-md">
    <CardContent className="pt-6 space-y-4">
      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);