import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  FileText, 
  UserCheck,
  Activity,
  Target,
  Timer,
  Zap,
  BarChart3,
  Settings
} from "lucide-react";
import { useSupplyDashboard } from "@/hooks/useSupplyDashboard";
import { Link } from "react-router-dom";

const SupplyDashboardExtended = () => {
  const { 
    metrics, 
    leadProcessing, 
    emailAutomations, 
    loading, 
    toggleEmailAutomation 
  } = useSupplyDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard de Supply...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Supply Extendido</h1>
            <p className="text-muted-foreground">
              Gestión integral del proceso de custodios y automatizaciones
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/admin/custodian-portal">
                <UserCheck className="mr-2 h-4 w-4" />
                Vista Portal Custodios
              </Link>
            </Button>
            <Button asChild>
              <Link to="/leads">
                <FileText className="mr-2 h-4 w-4" />
                Gestionar Leads
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="processing">Procesamiento Leads</TabsTrigger>
            <TabsTrigger value="custodians">Custodios</TabsTrigger>
            <TabsTrigger value="automation">Automatización</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_leads}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.leads_this_month} este mes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.conversion_rate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.custodians_active} custodios activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.tickets_open}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.tickets_resolved_this_week} resueltos esta semana
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.avg_response_time_hours}h</div>
                  <p className="text-xs text-muted-foreground">
                    Promedio de respuesta
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Actividad de Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Servicios Completados</span>
                    <span className="font-semibold">{metrics.services_completed_today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aprobaciones Pendientes</span>
                    <span className="font-semibold">{metrics.pending_approvals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Custodios Activos</span>
                    <span className="font-semibold">{metrics.custodians_active} / {metrics.custodians_total}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Métricas de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Eficiencia de Procesamiento</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Satisfacción de Custodios</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tiempo de Respuesta</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="processing" className="space-y-6">
            {/* Lead Processing Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pipeline de Procesamiento de Leads
                </CardTitle>
                <CardDescription>
                  Estado actual del proceso de incorporación de custodios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {leadProcessing.leads_in_psicometricos}
                    </div>
                    <div className="text-sm text-muted-foreground">Psicométricos</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {leadProcessing.leads_in_toxicologicos}
                    </div>
                    <div className="text-sm text-muted-foreground">Toxicológicos</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {leadProcessing.leads_pending_gps}
                    </div>
                    <div className="text-sm text-muted-foreground">Instalación GPS</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {leadProcessing.leads_active_custodians}
                    </div>
                    <div className="text-sm text-muted-foreground">Activos</div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tiempo Promedio de Procesamiento:</span>
                    <span className="text-lg font-bold">{leadProcessing.avg_processing_time_days} días</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones de Procesamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar Leads Pendientes ({metrics.pending_approvals})
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Revisar Timeouts de Procesos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Recordatorios Automáticos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas y Notificaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Leads con retraso en psicométricos</p>
                      <p className="text-xs text-muted-foreground">3 leads pendientes</p>
                    </div>
                    <Badge variant="destructive">Alta</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">Instalaciones GPS programadas</p>
                      <p className="text-xs text-muted-foreground">5 instalaciones hoy</p>
                    </div>
                    <Badge variant="secondary">Info</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custodians" className="space-y-6">
            {/* Custodian Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Estado de Custodios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total de Custodios</span>
                    <span className="font-semibold">{metrics.custodians_total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Custodios Activos</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{metrics.custodians_active}</span>
                      <Badge variant="default">
                        {((metrics.custodians_active / metrics.custodians_total) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Disponibles para Servicios</span>
                    <span className="font-semibold">{Math.floor(metrics.custodians_active * 0.7)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>En Servicio</span>
                    <span className="font-semibold">{Math.floor(metrics.custodians_active * 0.3)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones de Gestión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/admin/custodian-portal">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Ver Portal de Custodios
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Activity className="mr-2 h-4 w-4" />
                    Revisar Actividad Reciente
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Notificaciones
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            {/* Email Automations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automatizaciones de Email
                </CardTitle>
                <CardDescription>
                  Gestión de emails automáticos y timeouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailAutomations.map((automation) => (
                    <div key={automation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {automation.trigger_type === 'lead_timeout' && 'Timeout de Leads'}
                              {automation.trigger_type === 'custodian_inactive' && 'Custodio Inactivo'}
                              {automation.trigger_type === 'ticket_escalation' && 'Escalación de Tickets'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {automation.total_sent} enviados | {automation.success_rate}% éxito
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                          {automation.status === 'active' ? 'Activo' : 'Pausado'}
                        </Badge>
                        <Switch
                          checked={automation.status === 'active'}
                          onCheckedChange={() => toggleEmailAutomation(automation.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Automatizaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeout de Leads (días)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Psicométricos:</span>
                      <Badge variant="outline">7 días</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Toxicológicos:</span>
                      <Badge variant="outline">5 días</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Instalación GPS:</span>
                      <Badge variant="outline">3 días</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Configuración de Escalación</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tickets críticos:</span>
                      <Badge variant="outline">2 horas</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Custodio inactivo:</span>
                      <Badge variant="outline">24 horas</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Timeouts
                  </Button>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Plantillas de Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupplyDashboardExtended;