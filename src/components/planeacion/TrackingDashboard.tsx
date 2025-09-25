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
  RefreshCw,
  Scale,
  UserCheck,
  UserX
} from "lucide-react";
import { useCustodiosConProximidad } from "@/hooks/useProximidadOperacional";
import { useCustodioTracking } from "@/hooks/useCustodioTracking";
import { CustodioPerformanceCard } from "./CustodioPerformanceCard";
import { toast } from 'sonner';

interface TrackingDashboardProps {
  servicioNuevo?: any;
}

export const TrackingDashboard = ({ servicioNuevo }: TrackingDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyHighScore, setShowOnlyHighScore] = useState(false);

  // Usar hook categorizado para algoritmo equitativo
  const { data: custodiosCategorizados, isLoading, refetch } = useCustodiosConProximidad(servicioNuevo);
  const { logCommunication } = useCustodioTracking();

  // Combinar custodios para stats y compatibilidad
  const todosCustodios = custodiosCategorizados ? [
    ...custodiosCategorizados.disponibles,
    ...custodiosCategorizados.parcialmenteOcupados,
    ...custodiosCategorizados.ocupados
  ] : [];

  // Estadísticas mejoradas con métricas de equidad
  const stats = {
    total: todosCustodios.length,
    disponibles: custodiosCategorizados?.disponibles.length || 0,
    parcialmenteOcupados: custodiosCategorizados?.parcialmenteOcupados.length || 0,
    ocupados: custodiosCategorizados?.ocupados.length || 0,
    noDisponibles: custodiosCategorizados?.noDisponibles.length || 0,
    score_promedio: todosCustodios.length > 0 
      ? todosCustodios.reduce((sum, c) => sum + (c.scoring_proximidad?.score_total || c.score_total || 0), 0) / todosCustodios.length
      : 0,
    excelentes: todosCustodios.filter(c => (c.scoring_proximidad?.score_total || c.score_total || 0) >= 80).length,
    buenos: todosCustodios.filter(c => {
      const score = c.scoring_proximidad?.score_total || c.score_total || 0;
      return score >= 60 && score < 80;
    }).length,
    regulares: todosCustodios.filter(c => {
      const score = c.scoring_proximidad?.score_total || c.score_total || 0;
      return score >= 40 && score < 60;
    }).length,
    nuevos: todosCustodios.filter(c => (c.numero_servicios || 0) < 5).length
  };

  // Filtrar custodios por búsqueda y filtros
  const filtrarCustodios = (custodios: any[]) => {
    return custodios.filter(custodio => {
      const matchesSearch = !searchTerm || 
        custodio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custodio.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custodio.zona_base?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAvailable = !showOnlyAvailable || custodio.disponibilidad === 'disponible';
      const matchesHighScore = !showOnlyHighScore || (custodio.scoring_proximidad?.score_total || custodio.score_total || 0) >= 7;

      return matchesSearch && matchesAvailable && matchesHighScore;
    });
  };

  const handleRecalculate = async () => {
    await refetch();
    toast.success('Scores recalculados con algoritmo equitativo');
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

  // Obtener mejor custodio de los disponibles
  const mejorCustodio = custodiosCategorizados?.disponibles?.[0] || null;
  const topCustodios = custodiosCategorizados?.disponibles?.slice(1, 4) || [];

  return (
    <div className="space-y-6">
      {/* Header con estadísticas mejoradas de equidad */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <p className="text-sm font-medium text-muted-foreground">Libres</p>
              <p className="text-2xl font-bold text-green-600">{stats.disponibles}</p>
              <p className="text-xs text-muted-foreground">0 servicios hoy</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ocupados</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.parcialmenteOcupados + stats.ocupados}</p>
              <p className="text-xs text-muted-foreground">1+ servicios hoy</p>
            </div>
            <Scale className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score Promedio</p>
              <p className="text-2xl font-bold">{stats.score_promedio.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">No Disponibles</p>
              <p className="text-2xl font-bold text-red-600">{stats.noDisponibles}</p>
              <p className="text-xs text-muted-foreground">Límites alcanzados</p>
            </div>
            <UserX className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Algoritmo Equitativo - Información */}
      {servicioNuevo && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Algoritmo Equitativo Activo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
              <div>
                <strong>Proximidad (60%):</strong> Temporal + Geográfica + Operacional
              </div>
              <div>
                <strong>Equidad (25%):</strong> Balance de servicios diarios
              </div>
              <div>
                <strong>Oportunidad (15%):</strong> Rotación inteligente
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mejor recomendación */}
      {mejorCustodio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mejor Recomendación
              {servicioNuevo && (
                <div className="flex gap-2 ml-auto">
                  <Badge variant="outline" className="bg-green-50">
                    Algoritmo Equitativo
                  </Badge>
                  {mejorCustodio.categoria_disponibilidad && (
                    <Badge 
                      variant={mejorCustodio.categoria_disponibilidad === 'libre' ? 'default' : 'secondary'}
                    >
                      {mejorCustodio.categoria_disponibilidad === 'libre' ? '🎯 Ideal' : 
                       mejorCustodio.categoria_disponibilidad === 'parcialmente_ocupado' ? '✅ Bueno' : '⚖️ Aceptable'}
                    </Badge>
                  )}
                </div>
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

      {/* Top custodios disponibles */}
      {topCustodios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Custodios Disponibles ({topCustodios.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Recalcular
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {topCustodios.map((custodio, index) => (
                <div key={custodio.id} className="relative">
                  <Badge className="absolute -top-2 -left-2 z-10 bg-gradient-to-r from-blue-500 to-blue-600">
                    #{index + 2}
                  </Badge>
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

      {/* Filtros y búsqueda con categorías equitativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Categorías por Disponibilidad
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
                variant={showOnlyAvailable ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              >
                Solo Disponibles
              </Button>
              <Button
                variant={showOnlyHighScore ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyHighScore(!showOnlyHighScore)}
              >
                Score Alto (7+)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Custodios categorizados por disponibilidad */}
          {custodiosCategorizados && (
            <div className="space-y-6">
              
              {/* Custodios Libres (Ideal) */}
              {custodiosCategorizados.disponibles.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">
                        Custodios Libres - Ideal ({filtrarCustodios(custodiosCategorizados.disponibles).length})
                      </h3>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      0 servicios hoy - Máxima disponibilidad
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtrarCustodios(custodiosCategorizados.disponibles).map(custodio => (
                  <CustodioPerformanceCard
                    key={custodio.id}
                    custodio={{
                      ...custodio,
                      performance_level: 'bueno' as const,
                      rejection_risk: 'medio' as const,
                      response_speed: 'normal' as const,
                      experience_category: 'intermedio' as const
                    }}
                    compact={true}
                    onSelect={() => handleContactSimulation(custodio)}
                  />
                    ))}
                  </div>
                </div>
              )}

              {/* Custodios Parcialmente Ocupados */}
              {custodiosCategorizados.parcialmenteOcupados.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-800">
                        Parcialmente Ocupados ({filtrarCustodios(custodiosCategorizados.parcialmenteOcupados).length})
                      </h3>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      1 servicio hoy - Disponible
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtrarCustodios(custodiosCategorizados.parcialmenteOcupados).map(custodio => (
                    <CustodioPerformanceCard
                      key={custodio.id}
                      custodio={{
                        ...custodio,
                        performance_level: 'bueno' as const,
                        rejection_risk: 'medio' as const,
                        response_speed: 'normal' as const,
                        experience_category: 'intermedio' as const
                      }}
                      compact={true}
                      onSelect={() => handleContactSimulation(custodio)}
                    />
                    ))}
                  </div>
                </div>
              )}

              {/* Custodios Ocupados (Último recurso) */}
              {custodiosCategorizados.ocupados.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold text-orange-800">
                        Muy Ocupados - Último Recurso ({filtrarCustodios(custodiosCategorizados.ocupados).length})
                      </h3>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      2+ servicios hoy - Considerar fatiga
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtrarCustodios(custodiosCategorizados.ocupados).map(custodio => (
                      <CustodioPerformanceCard
                        key={custodio.id}
                        custodio={custodio}
                        compact={true}
                        onSelect={() => handleContactSimulation(custodio)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay custodios filtrados */}
              {(filtrarCustodios(todosCustodios).length === 0) && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron custodios que coincidan con los criterios de búsqueda.
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Calculando distribución equitativa...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del sistema mejorada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Algoritmo Equitativo - Sistema Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>✅ Implementado:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Factor de equidad (workload balance)</li>
                <li>• Sistema de rotación inteligente</li>
                <li>• Límites automáticos de servicios/día</li>
                <li>• Métricas de fatiga</li>
                <li>• Categorización por disponibilidad</li>
              </ul>
            </div>
            <div>
              <strong>🎯 Beneficios de Equidad:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Distribución justa de ingresos</li>
                <li>• Prevención de burnout</li>
                <li>• Mejor retención de custodios</li>
                <li>• Oportunidades para todos</li>
                <li>• Calidad sostenible del servicio</li>
              </ul>
            </div>
            <div>
              <strong>📊 Algoritmo:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Proximidad Operacional (60%)</li>
                <li>• Factor de Equidad (25%)</li>
                <li>• Factor de Oportunidad (15%)</li>
                <li>• Límite: 3 servicios/día máximo</li>
                <li>• Penalización por fatiga</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};