import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplyTeamMetrics } from "./SupplyTeamMetrics";
import { AnalystMetricsGrid } from "./analyst/AnalystMetricsGrid";
import { Users, TrendingUp, BarChart3 } from "lucide-react";

export const SupplyDashboardExtended = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Supply</h1>
        <p className="text-muted-foreground mt-1">
          Métricas de equipo y desempeño individual de analistas
        </p>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Métricas de Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="analysts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Por Analista</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <SupplyTeamMetrics />
        </TabsContent>

        <TabsContent value="analysts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Desempeño por Analista
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Métricas individuales de carga de trabajo y conversión
              </p>
            </CardHeader>
            <CardContent>
              <AnalystMetricsGrid />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
