import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Globe,
  Cpu,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddGL320MGButton } from './AddGL320MGButton';

interface DeviceResult {
  id: string;
  nombre: string;
  marca: string;
  codigo: string;
}

interface ResearchResult {
  success: boolean;
  message: string;
  devices: DeviceResult[];
  raw_response?: string;
  error?: string;
}

export const GPSResearchTab = () => {
  const [searchQuery, setSearchQuery] = useState('GL320MG');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResearchResult | null>(null);
  const { toast } = useToast();

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setResults(null);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('research-gps-devices', {
        body: { searchQuery }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      setResults(data);

      if (data.success) {
        toast({
          title: "Investigación completada",
          description: `Se encontraron y procesaron ${data.devices?.length || 0} dispositivos GPS`,
        });
      } else {
        toast({
          title: "Error en la investigación",
          description: data.error || "No se pudo completar la investigación",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al conectar con el servicio de investigación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedQueries = [
    'GL320MG',
    'Quectel GL300W',
    'Teltonika FMB920',
    'Coban GPS306',
    'Topfly TLP2-SF',
    'Sinotrack ST-901'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Investigación de Dispositivos GPS
            </h2>
            <p className="text-muted-foreground">
              Enriquece la base de datos con nuevos modelos de dispositivos GPS tracking
            </p>
          </div>
        </div>
      </div>

      {/* Botón para agregar GL320MG directamente */}
      <AddGL320MGButton />

      {/* Formulario de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Dispositivos GPS
          </CardTitle>
          <CardDescription>
            Ingresa el modelo de dispositivo GPS que quieres investigar. La IA buscará información técnica detallada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Modelo de dispositivo GPS</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: GL320MG, Teltonika FMB920, etc."
                disabled={isLoading}
              />
            </div>

            {/* Consultas predefinidas */}
            <div className="space-y-2">
              <Label>Consultas sugeridas:</Label>
              <div className="flex flex-wrap gap-2">
                {predefinedQueries.map((query) => (
                  <Badge
                    key={query}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => !isLoading && setSearchQuery(query)}
                  >
                    {query}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Progreso */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Investigando dispositivos GPS en internet...
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !searchQuery.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Investigando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Iniciar Investigación
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              Resultados de la Investigación
            </CardTitle>
            <CardDescription>
              {results.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.success && results.devices && results.devices.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {results.devices.map((device) => (
                    <div 
                      key={device.id}
                      className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="p-2 rounded-lg bg-success/10 text-success">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{device.nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {device.marca} • {device.codigo}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Database className="h-3 w-3 mr-1" />
                        Agregado
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Próximos pasos</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Los dispositivos se han agregado al inventario con stock inicial 0</li>
                    <li>• Puedes ajustar stock, precios y configuraciones en el módulo de Inventario</li>
                    <li>• Se han creado configuraciones técnicas básicas para cada dispositivo</li>
                    <li>• Revisa las especificaciones técnicas en el catálogo GPS</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron dispositivos para agregar o ocurrió un error.</p>
                {results.error && (
                  <p className="text-sm mt-2 text-destructive">{results.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información sobre la Investigación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">¿Qué información se busca?</h4>
              <ul className="text-muted-foreground space-y-1 ml-4">
                <li>• Especificaciones técnicas detalladas</li>
                <li>• Características principales del dispositivo</li>
                <li>• Información de conectividad y sensores</li>
                <li>• Aplicaciones recomendadas</li>
                <li>• Precios estimados del mercado</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">¿Qué se agrega a la base de datos?</h4>
              <ul className="text-muted-foreground space-y-1 ml-4">
                <li>• Registro del producto en inventario</li>
                <li>• Configuraciones técnicas básicas</li>
                <li>• Especificaciones en formato JSON</li>
                <li>• Categorización automática</li>
                <li>• Stock inicial configurado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};