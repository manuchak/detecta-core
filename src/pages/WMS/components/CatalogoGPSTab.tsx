
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Smartphone, ExternalLink, Database, RefreshCw } from 'lucide-react';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';
import { useModelosGPS } from '@/hooks/useModelosGPS';
import { useCategorias } from '@/hooks/useCategorias';

export const CatalogoGPSTab = () => {
  const { marcas, isLoading: loadingMarcas, initializeMarcasGPS } = useMarcasGPS();
  const { modelos, isLoading: loadingModelos, initializeModelosGPS } = useModelosGPS();
  const { initializeCategorias } = useCategorias();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModelos = modelos?.filter(modelo =>
    modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.marca?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.tipo_dispositivo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInitializeData = () => {
    initializeCategorias.mutate();
    initializeMarcasGPS.mutate();
    initializeModelosGPS.mutate();
  };

  if (loadingMarcas || loadingModelos) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catálogo GPS</h2>
          <p className="text-muted-foreground">Marcas y modelos compatibles con Wialon</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleInitializeData}
            className="flex items-center gap-2"
            variant="outline"
            disabled={initializeMarcasGPS.isPending || initializeModelosGPS.isPending || initializeCategorias.isPending}
          >
            {initializeMarcasGPS.isPending || initializeModelosGPS.isPending || initializeCategorias.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Cargar Base de Datos Completa
          </Button>
        </div>
      </div>

      <Tabs defaultValue="modelos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modelos">Modelos GPS ({modelos?.length || 0})</TabsTrigger>
          <TabsTrigger value="marcas">Marcas ({marcas?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="modelos" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar modelos GPS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredModelos?.length || 0} modelos encontrados
            </Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conectividad</TableHead>
                    <TableHead>Precisión GPS</TableHead>
                    <TableHead>Precio USD</TableHead>
                    <TableHead>Características</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModelos?.map((modelo) => (
                    <TableRow key={modelo.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{modelo.nombre}</p>
                          {modelo.dimensiones && (
                            <p className="text-xs text-gray-500">{modelo.dimensiones}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{modelo.marca?.nombre}</span>
                          {modelo.marca?.sitio_web && (
                            <a
                              href={modelo.marca.sitio_web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{modelo.tipo_dispositivo}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {modelo.conectividad?.slice(0, 2).map((conn, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {conn}
                            </Badge>
                          ))}
                          {modelo.conectividad && modelo.conectividad.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{modelo.conectividad.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{modelo.gps_precision}</span>
                      </TableCell>
                      <TableCell>
                        {modelo.precio_referencia_usd && (
                          <span className="font-medium">${modelo.precio_referencia_usd}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {modelo.bateria_interna && (
                            <Badge variant="outline" className="text-xs">Batería</Badge>
                          )}
                          {modelo.sensores_soportados?.slice(0, 2).map((sensor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {sensor}
                            </Badge>
                          ))}
                          {modelo.sensores_soportados && modelo.sensores_soportados.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{modelo.sensores_soportados.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marcas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marcas?.map((marca) => (
              <Card key={marca.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{marca.nombre}</CardTitle>
                    {marca.soporte_wialon && (
                      <Badge variant="secondary">Wialon</Badge>
                    )}
                  </div>
                  <CardDescription>{marca.pais_origen}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Modelos disponibles:</span>{' '}
                      {modelos?.filter(m => m.marca_id === marca.id).length || 0}
                    </div>
                    {marca.sitio_web && (
                      <a
                        href={marca.sitio_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
                      >
                        Sitio web <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
