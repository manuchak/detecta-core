import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Calendar, MapPin, TrendingUp, Clock, Smartphone, Calculator } from 'lucide-react';

import ClientesTab from './components/ClientesTab';
import CustodiosTab from './components/CustodiosTab';
import ServiciosTab from './components/ServiciosTab';
import KPIDashboard from './components/KPIDashboard';
import { ComodatosGPSTab } from './components/ComodatosGPSTab';
import { MatrizPreciosTab } from './components/MatrizPreciosTab';

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
        <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="precios" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Precios
          </TabsTrigger>
          <TabsTrigger value="custodios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Custodios
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="gps-comodato" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            GPS Comodato
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

        {/* Matriz Precios Tab */}
        <TabsContent value="precios" className="space-y-6 mt-6">
          <MatrizPreciosTab />
        </TabsContent>

        {/* Custodios Tab */}
        <TabsContent value="custodios" className="space-y-6 mt-6">
          <CustodiosTab />
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-6 mt-6">
          <ClientesTab />
        </TabsContent>

        {/* GPS Comodato Tab */}
        <TabsContent value="gps-comodato" className="space-y-6 mt-6">
          <ComodatosGPSTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}