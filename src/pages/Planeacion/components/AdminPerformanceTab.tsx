import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAssignmentAudit } from '@/hooks/useAssignmentAudit';
import { User, Clock, TrendingUp, Activity, Shield, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminPerformanceTab() {
  const { 
    auditLogs, 
    performanceMetrics,
    loading,
    error,
    loadAuditLogs,
    loadPerformanceMetrics
  } = useAssignmentAudit();

  useEffect(() => {
    loadAuditLogs();
    loadPerformanceMetrics();
  }, []);

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Badge variant="success">Creado</Badge>;
      case 'updated':
        return <Badge variant="secondary">Actualizado</Badge>;
      case 'confirmed':
        return <Badge variant="success">Confirmado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          <p className="text-muted-foreground">
            Monitoreo de rendimiento y auditoría de asignaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPerformanceMetrics} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualizar Métricas
          </Button>
          <Button onClick={() => loadAuditLogs()} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Actualizar Logs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance por Usuario</TabsTrigger>
          <TabsTrigger value="audit">Historial de Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Global Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{performanceMetrics.length}</div>
                    <div className="text-sm text-muted-foreground">Usuarios Activos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.reduce((sum, user) => sum + user.total_assignments, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Asignaciones</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.reduce((sum, user) => sum + user.assignments_today, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Asignaciones Hoy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        performanceMetrics.reduce((sum, user) => sum + user.avg_time_to_assign, 0) / 
                        (performanceMetrics.length || 1)
                      )}m
                    </div>
                    <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Detallado por Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de performance disponibles
                </div>
              ) : (
                <div className="space-y-4">
                  {performanceMetrics.map((user) => (
                    <div
                      key={user.user_id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.user_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Última asignación: {format(new Date(user.most_recent_assignment), 'PPp', { locale: es })}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-lg">{user.total_assignments}</div>
                            <div className="text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg">{user.assignments_today}</div>
                            <div className="text-muted-foreground">Hoy</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-lg ${getPerformanceColor(user.success_rate)}`}>
                              {user.success_rate.toFixed(1)}%
                            </div>
                            <div className="text-muted-foreground">Éxito</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg">{user.avg_time_to_assign}m</div>
                            <div className="text-muted-foreground">Tiempo Prom.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de Auditoría - Últimas 50 Acciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-center py-8 text-red-600">{error}</div>
              )}

              {!error && auditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay registros de auditoría disponibles
                </div>
              )}

              {!error && auditLogs.length > 0 && (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{log.performer_name}</span>
                              <span className="text-muted-foreground text-sm ml-2">
                                {format(new Date(log.created_at), 'PPp', { locale: es })}
                              </span>
                            </div>
                          </div>

                          {log.changes_summary && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {log.changes_summary}
                            </p>
                          )}

                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {log.service_id && <span>Servicio: {log.service_id}</span>}
                            {log.custodio_id && <span>Custodio ID: {log.custodio_id}</span>}
                            {log.armado_id && <span>Armado ID: {log.armado_id}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {getActionBadge(log.action_type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}