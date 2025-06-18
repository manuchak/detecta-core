
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { GmvChart } from "@/components/dashboard/GmvChart";
import { ServicesCalendar } from "@/components/dashboard/ServicesCalendar";
import { ServiceStatusChart } from "@/components/dashboard/ServiceStatusChart";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import WorkflowBanner from "@/components/dashboard/WorkflowBanner";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Vista general del sistema de monitoreo GPS</p>
      </div>

      {/* Banner de Workflow */}
      <WorkflowBanner />

      {/* Métricas principales */}
      <MetricsCards />

      {/* Gráficos principales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GmvChart />
        <ServiceStatusChart />
      </div>

      {/* Calendario y gráficos secundarios */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ServicesCalendar />
        </div>
        <div className="space-y-6">
          <SecondaryCharts />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
