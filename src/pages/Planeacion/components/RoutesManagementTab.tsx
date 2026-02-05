import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Map, History, TrendingUp, Building2 } from 'lucide-react';
import { useRoutesStats } from '@/hooks/useRoutesWithPendingPrices';
import { PendingRoutesTable } from './routes/PendingRoutesTable';
import { PriceHistoryTable } from './routes/PriceHistoryTable';
import { MatrizPreciosTab } from './MatrizPreciosTab';
import { ClientesConRutasTable } from './routes/ClientesConRutasTable';

export function RoutesManagementTab() {
  const [activeSubTab, setActiveSubTab] = useState('pending');
  const { data: stats } = useRoutesStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Gestión de Rutas</h2>
        <p className="text-muted-foreground">
          Administra rutas, actualiza precios y revisa el historial de cambios
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Totales</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">rutas activas</p>
          </CardContent>
        </Card>

        <Card className={stats?.pendingPrices ? 'border-warning' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precios Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.pendingPrices || 0}</div>
            <p className="text-xs text-muted-foreground">requieren actualización</p>
          </CardContent>
        </Card>

        <Card className={stats?.negativeMargin ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Negativo</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.negativeMargin || 0}</div>
            <p className="text-xs text-muted-foreground">requieren revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Válidas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.validRoutes || 0}</div>
            <p className="text-xs text-muted-foreground">con precios correctos</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pendientes
            {(stats?.pendingPrices || 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                {stats?.pendingPrices}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas las Rutas
          </TabsTrigger>
          <TabsTrigger value="clientes">
            <Building2 className="h-4 w-4 mr-1" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingRoutesTable />
        </TabsContent>

        <TabsContent value="all">
          <MatrizPreciosTab />
        </TabsContent>

        <TabsContent value="clientes">
          <ClientesConRutasTable />
        </TabsContent>

        <TabsContent value="history">
          <PriceHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
