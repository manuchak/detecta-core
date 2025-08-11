import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Calendar, MapPin, TrendingUp, Clock } from 'lucide-react';

import ClientesTab from './components/ClientesTab';
import CustodiosTab from './components/CustodiosTab';
import ServiciosTab from './components/ServiciosTab';
import KPIDashboard from './components/KPIDashboard';

export default function PlaneacionDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Planeación de Custodias</h1>
        <p className="text-muted-foreground">
          Gestiona clientes, custodios y servicios de seguridad de manera eficiente
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="custodios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Custodios
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <KPIDashboard />
        </TabsContent>

        {/* Servicios Tab */}
        <TabsContent value="servicios" className="space-y-6 mt-6">
          <ServiciosTab />
        </TabsContent>

        {/* Custodios Tab */}
        <TabsContent value="custodios" className="space-y-6 mt-6">
          <CustodiosTab />
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-6 mt-6">
          <ClientesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}