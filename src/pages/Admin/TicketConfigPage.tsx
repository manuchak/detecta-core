import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTicketConfig } from '@/hooks/useTicketConfig';
import { Loader2, Tags, Clock, Calendar, AlertTriangle, ChevronRight, Settings } from 'lucide-react';
import { CategoryManagement } from '@/components/admin/tickets/CategoryManagement';
import { BusinessHoursConfig } from '@/components/admin/tickets/BusinessHoursConfig';
import { HolidayCalendar } from '@/components/admin/tickets/HolidayCalendar';
import { EscalationRules } from '@/components/admin/tickets/EscalationRules';
import { cn } from '@/lib/utils';

const TicketConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('categorias');
  const config = useTicketConfig();

  if (config.loading) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'categorias', 
      label: 'Categorías', 
      icon: Tags, 
      count: config.categorias.length,
      description: 'Gestiona categorías, subcategorías y SLAs'
    },
    { 
      id: 'horarios', 
      label: 'Horario Laboral', 
      icon: Clock, 
      count: config.businessHours.length,
      description: 'Define días y horarios de atención'
    },
    { 
      id: 'feriados', 
      label: 'Feriados', 
      icon: Calendar, 
      count: config.holidays.length,
      description: 'Calendario de días no laborables'
    },
    { 
      id: 'escalacion', 
      label: 'Escalación', 
      icon: AlertTriangle, 
      count: config.escalationRules.filter(r => r.activo).length,
      description: 'Reglas de escalación automática'
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fade-in">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Admin</span>
          <ChevronRight className="h-4 w-4" />
          <span>Tickets</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Configuración</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              Configuración de Tickets
            </h1>
            <p className="text-muted-foreground mt-2">
              Administra categorías, horarios laborales, feriados y reglas de escalación
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 p-1 bg-muted/50 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "relative flex items-center gap-2 py-3 px-4 rounded-lg transition-all",
                    "data-[state=active]:bg-background data-[state=active]:shadow-md"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="hidden sm:inline font-medium">{tab.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "h-5 min-w-[20px] px-1.5 text-xs rounded-full",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="categorias" className="animate-fade-in">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tags className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Gestión de Categorías</CardTitle>
                    <CardDescription>
                      Configura las categorías y subcategorías de tickets, SLAs y departamentos responsables
                    </CardDescription>
                  </div>
                </div>
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

          <TabsContent value="horarios" className="animate-fade-in">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Horario Laboral</CardTitle>
                    <CardDescription>
                      Define los días y horarios de atención para el cálculo de SLAs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BusinessHoursConfig 
                  businessHours={config.businessHours}
                  onUpdate={config.updateBusinessHour}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feriados" className="animate-fade-in">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Calendario de Feriados</CardTitle>
                    <CardDescription>
                      Gestiona los días feriados que se excluyen del cálculo de SLAs
                    </CardDescription>
                  </div>
                </div>
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

          <TabsContent value="escalacion" className="animate-fade-in">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Reglas de Escalación</CardTitle>
                    <CardDescription>
                      Configura acciones automáticas cuando se cumplen ciertas condiciones
                    </CardDescription>
                  </div>
                </div>
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
    </div>
  );
};

export default TicketConfigPage;
