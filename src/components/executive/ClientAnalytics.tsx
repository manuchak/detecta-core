import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Route,
  Users,
  CheckCircle,
  BarChart3,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useClientsData, useClientAnalytics, ClientSummary } from '@/hooks/useClientAnalytics';
import { Button } from '@/components/ui/button';

export const ClientAnalytics = () => {
  const { data: clients, isLoading } = useClientsData();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: clientAnalytics, isLoading: analyticsLoading } = useClientAnalytics(selectedClient || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredClients = clients?.filter(client => 
    client.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedClient && clientAnalytics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedClient(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Clientes
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{clientAnalytics.clientName}</h2>
              <p className="text-muted-foreground">Análisis detallado de performance</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAnalytics.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                {clientAnalytics.servicesPerMonth.toFixed(1)}/mes promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GMV Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(clientAnalytics.totalGMV)}</div>
              <p className="text-xs text-muted-foreground">
                AOV: {formatCurrency(clientAnalytics.averageAOV)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAnalytics.completionRate}%</div>
              <Progress value={clientAnalytics.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KM Promedio</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAnalytics.averageKm}</div>
              <p className="text-xs text-muted-foreground">
                Total: {clientAnalytics.totalKm.toLocaleString()} km
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Actividad Temporal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Primer Servicio</span>
                <span className="text-sm">{clientAnalytics.firstService}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Último Servicio</span>
                <span className="text-sm">{clientAnalytics.lastService}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Servicios Completados</span>
                <Badge variant="outline">{clientAnalytics.completedServices}</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Servicios Cancelados</span>
                <Badge variant="destructive">{clientAnalytics.cancelledServices}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tipos de Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientAnalytics.serviceTypes.map((type, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{type.count}</span>
                      <Badge variant="outline">{type.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia Mensual (Últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clientAnalytics.monthlyTrend.map((month, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="text-sm font-medium">{month.month}</div>
                  <div className="text-lg font-bold">{month.services} servicios</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(month.gmv)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custodian Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance por Custodio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientAnalytics.custodianPerformance.map((custodian, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{custodian.custodian}</div>
                    <div className="text-sm text-muted-foreground">
                      {custodian.services} servicios • {custodian.averageKm.toFixed(0)} km promedio
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{custodian.completionRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Cumplimiento</div>
                    </div>
                    <div className="w-20">
                      <Progress value={custodian.completionRate} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Clientes</h2>
          <p className="text-muted-foreground">Selecciona un cliente para ver su análisis detallado</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedClient(client.nombre_cliente)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {client.nombre_cliente}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Servicios</div>
                  <div className="font-bold">{client.totalServices}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">GMV</div>
                  <div className="font-bold">{formatCurrency(client.totalGMV)}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Cumplimiento</span>
                  <span className="font-medium">{client.completionRate}%</span>
                </div>
                <Progress value={client.completionRate} className="h-2" />
              </div>

              <div className="text-xs text-muted-foreground">
                Último servicio: {client.lastService}
              </div>
              
              <Button variant="outline" size="sm" className="w-full mt-3">
                Ver Análisis Detallado
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No se encontraron clientes</h3>
          <p className="text-muted-foreground">Intenta con un término de búsqueda diferente</p>
        </div>
      )}
    </div>
  );
};