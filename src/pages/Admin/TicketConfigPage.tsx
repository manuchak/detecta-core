import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTicketConfig } from '@/hooks/useTicketConfig';
import { Loader2, Tags, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { CategoryManagement } from '@/components/admin/tickets/CategoryManagement';
import { BusinessHoursConfig } from '@/components/admin/tickets/BusinessHoursConfig';
import { HolidayCalendar } from '@/components/admin/tickets/HolidayCalendar';
import { EscalationRules } from '@/components/admin/tickets/EscalationRules';

const TicketConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('categorias');
  const config = useTicketConfig();

  if (config.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Tickets</h1>
        <p className="text-muted-foreground">
          Administra categorías, horarios laborales, feriados y reglas de escalación
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="categorias" className="gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="horarios" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horario Laboral</span>
          </TabsTrigger>
          <TabsTrigger value="feriados" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Feriados</span>
          </TabsTrigger>
          <TabsTrigger value="escalacion" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Escalación</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Categorías</CardTitle>
              <CardDescription>
                Configura las categorías y subcategorías de tickets, SLAs y departamentos responsables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement 
                categorias={config.categorias}
                subcategorias={config.subcategorias}
                onUpdateCategoria={config.updateCategoria}
                onCreateCategoria={config.createCategoria}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle>Horario Laboral</CardTitle>
              <CardDescription>
                Define los días y horarios de atención para el cálculo de SLAs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessHoursConfig 
                businessHours={config.businessHours}
                onUpdate={config.updateBusinessHour}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feriados">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Feriados</CardTitle>
              <CardDescription>
                Gestiona los días feriados que se excluyen del cálculo de SLAs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HolidayCalendar 
                holidays={config.holidays}
                onUpdate={config.updateHoliday}
                onCreate={config.createHoliday}
                onDelete={config.deleteHoliday}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalacion">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Escalación</CardTitle>
              <CardDescription>
                Configura acciones automáticas cuando se cumplen ciertas condiciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EscalationRules 
                rules={config.escalationRules}
                categorias={config.categorias}
                onUpdate={config.updateEscalationRule}
                onCreate={config.createEscalationRule}
                onDelete={config.deleteEscalationRule}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TicketConfigPage;
