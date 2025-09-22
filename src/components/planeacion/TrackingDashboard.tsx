import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { useCustodiosWithTracking } from "@/hooks/useCustodiosWithTracking";
import { useCustodioTracking } from "@/hooks/useCustodioTracking";
import { CustodioPerformanceCard } from "./CustodioPerformanceCard";
import { toast } from 'sonner';

interface TrackingDashboardProps {
  servicioNuevo?: any;
}

export const TrackingDashboard = ({ servicioNuevo }: TrackingDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    zona: '',
    disponibilidad: undefined as boolean | undefined,
    score_minimo: 0
  });

  const { custodios, loading, getMejorCustodio, getTopCustodios, stats, refetch } = useCustodiosWithTracking({
    servicioNuevo,
    filtros
  });

  const { recalculateScores, logCommunication } = useCustodioTracking();

  // Filtrar custodios por búsqueda
  const custodiosFiltrados = custodios.filter(custodio =>
    custodio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    custodio.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    custodio.zona_base?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecalculate = async () => {
    try {
      await recalculateScores();
      await refetch();
      toast.success('Scores actualizados correctamente');
    } catch (error) {
      toast.error('Error al actualizar scores');
    }
  };

  const handleContactSimulation = async (custodio: any) => {
    try {
      await logCommunication({
        custodio_id: custodio.id,
        custodio_nombre: custodio.nombre,
        custodio_telefono: custodio.telefono || 'N/A',
        servicio_id: servicioNuevo?.id,
        tipo_comunicacion: 'whatsapp',
        contenido: `Servicio disponible: ${servicioNuevo?.origen_texto || 'Nueva asignación'} → ${servicioNuevo?.destino_texto || 'Destino'}`
      });
      toast.success(`WhatsApp enviado a ${custodio.nombre}`);
    } catch (error) {
      toast.error('Error enviando mensaje');
    }
  };

  const mejorCustodio = getMejorCustodio();
  const topCustodios = getTopCustodios(3);

  return (
    <div className="space-y-6">
      {/* Header con estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Custodios</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score Promedio</p>
              <p className="text-2xl font-bold">{stats.score_promedio.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Excelentes</p>
              <p className="text-2xl font-bold text-green-600">{stats.excelentes}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nuevos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.nuevos}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Mejor recomendación */}
      {mejorCustodio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mejor Recomendación
              {servicioNuevo && (
                <Badge variant="outline" className="ml-auto">
                  Con análisis de proximidad
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <CustodioPerformanceCard 
                custodio={mejorCustodio} 
                compact={false}
              />
              <Button 
                onClick={() => handleContactSimulation(mejorCustodio)}
                className="ml-4"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contactar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 custodios */}
      {topCustodios.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top 3 Recomendados
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recalcular
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {topCustodios.map((custodio, index) => (
                <div key={custodio.id} className="relative">
                  {index === 0 && (
                    <Badge className="absolute -top-2 -left-2 z-10 bg-gradient-to-r from-yellow-400 to-yellow-600">
                      #1
                    </Badge>
                  )}
                  <CustodioPerformanceCard 
                    custodio={custodio} 
                    compact={true}
                    onSelect={() => handleContactSimulation(custodio)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, teléfono o zona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtros.disponibilidad === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltros({
                  ...filtros,
                  disponibilidad: filtros.disponibilidad === true ? undefined : true
                })}
              >
                Disponibles
              </Button>
              <Button
                variant={filtros.score_minimo > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltros({
                  ...filtros,
                  score_minimo: filtros.score_minimo > 0 ? 0 : 7
                })}
              >
                Score Alto (7+)
              </Button>
            </div>
          </div>

          <Separator />
          
          {/* Lista completa */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Todos los Custodios ({custodiosFiltrados.length})
              </h3>
              <div className="flex gap-2">
                <Badge variant="secondary">{stats.excelentes} excelentes</Badge>
                <Badge variant="outline">{stats.buenos} buenos</Badge>
                <Badge variant="secondary">{stats.regulares} regulares</Badge>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Cargando custodios...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {custodiosFiltrados.map(custodio => (
                  <CustodioPerformanceCard
                    key={custodio.id}
                    custodio={custodio}
                    compact={true}
                    onSelect={() => handleContactSimulation(custodio)}
                  />
                ))}
              </div>
            )}

            {custodiosFiltrados.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron custodios que coincidan con los criterios de búsqueda.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sistema de Tracking - Fase 1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>✅ Implementado:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Tracking de comunicaciones</li>
                <li>• Métricas de performance</li>
                <li>• Sistema de scoring dinámico</li>
                <li>• Historial de respuestas</li>
              </ul>
            </div>
            <div>
              <strong>🔄 Próximas fases:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Timeouts automáticos</li>
                <li>• Notificaciones push</li>
                <li>• WhatsApp API real</li>
                <li>• Escalamiento automático</li>
              </ul>
            </div>
            <div>
              <strong>📊 Beneficios:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Identifica custodios problemáticos</li>
                <li>• Mejora asignación inteligente</li>
                <li>• Reduce tiempo de gestión</li>
                <li>• Datos confiables para decisiones</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};