import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, LayoutDashboard, TrendingUp, Users, Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PipelineKanban from './components/PipelineKanban';
import RevenueForecast from './components/RevenueForecast';
import ClientServicesLink from './components/ClientServicesLink';
import ActivityFeed from './components/ActivityFeed';

const TAB_MAP: Record<string, string> = {
  pipeline: 'pipeline',
  forecast: 'forecast',
  clients: 'clients',
  activity: 'activity',
};

export default function CRMHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabParam = searchParams.get('tab') || 'pipeline';
  const activeTab = TAB_MAP[tabParam] || 'pipeline';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    await queryClient.invalidateQueries({ queryKey: ['crm-forecast'] });
    await queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
    await queryClient.invalidateQueries({ queryKey: ['crm-pipeline-stages'] });
    await queryClient.invalidateQueries({ queryKey: ['crm-client-matches'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">CRM Hub</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline de ventas, forecast e integración con Pipedrive
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="pipeline" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Actividad</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <PipelineKanban />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <RevenueForecast />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientServicesLink />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
