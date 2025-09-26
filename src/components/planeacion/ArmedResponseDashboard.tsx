import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { useArmedIndisponibilidades } from '@/hooks/useArmedIndisponibilidades';
import { useArmedGuardsOperativos } from '@/hooks/useArmedGuardsOperativos';
import { ArmedUnavailabilityManager } from './ArmedUnavailabilityManager';

interface CallAttempt {
  id: string;
  guardId: string;
  guardName: string;
  serviceId: string;
  timestamp: string;
  status: 'calling' | 'accepted' | 'rejected' | 'no_answer' | 'timeout';
  responseTime?: number;
  rejectionReason?: string;
  notes?: string;
}

// Mock data for demonstration - in real app this would come from database
const mockCallAttempts: CallAttempt[] = [
  {
    id: '1',
    guardId: 'guard-1',
    guardName: 'Juan Carlos Hernández',
    serviceId: 'SRV-001',
    timestamp: '2024-01-20T10:30:00Z',
    status: 'accepted',
    responseTime: 45
  },
  {
    id: '2',
    guardId: 'guard-2',
    guardName: 'Ana María González',
    serviceId: 'SRV-002',
    timestamp: '2024-01-20T11:15:00Z',
    status: 'rejected',
    responseTime: 30,
    rejectionReason: 'Ocupado con otro servicio'
  },
  {
    id: '3',
    guardId: 'guard-3',
    guardName: 'Miguel Ángel Torres',
    serviceId: 'SRV-003',
    timestamp: '2024-01-20T12:00:00Z',
    status: 'calling',
  },
];

export function ArmedResponseDashboard() {
  const [callAttempts] = useState<CallAttempt[]>(mockCallAttempts);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { activeIndisponibilidades } = useArmedIndisponibilidades();
  const { armedGuards } = useArmedGuardsOperativos();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'calling': return 'bg-blue-500 animate-pulse';
      case 'no_answer': return 'bg-yellow-500';
      case 'timeout': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Aceptado';
      case 'rejected': return 'Rechazado';
      case 'calling': return 'Llamando...';
      case 'no_answer': return 'Sin respuesta';
      case 'timeout': return 'Timeout';
      default: return 'Desconocido';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate metrics
  const totalCalls = callAttempts.length;
  const acceptedCalls = callAttempts.filter(c => c.status === 'accepted').length;
  const rejectedCalls = callAttempts.filter(c => c.status === 'rejected').length;
  const pendingCalls = callAttempts.filter(c => c.status === 'calling').length;
  
  const acceptanceRate = totalCalls > 0 ? (acceptedCalls / totalCalls) * 100 : 0;
  const avgResponseTime = callAttempts
    .filter(c => c.responseTime)
    .reduce((sum, c) => sum + (c.responseTime || 0), 0) / 
    callAttempts.filter(c => c.responseTime).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Respuestas - Armados</h1>
          <p className="text-muted-foreground">Gestión y seguimiento de llamadas a armados</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gestionar Indisponibilidades
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestión de Indisponibilidades</DialogTitle>
            </DialogHeader>
            <ArmedUnavailabilityManager />
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalCalls}</p>
                <p className="text-sm text-muted-foreground">Llamadas Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{acceptanceRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Tasa de Aceptación</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{avgResponseTime.toFixed(0)}s</p>
                <p className="text-sm text-muted-foreground">Tiempo Respuesta Prom.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{activeIndisponibilidades.length}</p>
                <p className="text-sm text-muted-foreground">No Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="active-calls">Llamadas Activas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acceptance Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribución de Respuestas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aceptados</span>
                    <span className="text-sm font-medium">{acceptedCalls}</span>
                  </div>
                  <Progress value={(acceptedCalls / totalCalls) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rechazados</span>
                    <span className="text-sm font-medium">{rejectedCalls}</span>
                  </div>
                  <Progress value={(rejectedCalls / totalCalls) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pendientes</span>
                    <span className="text-sm font-medium">{pendingCalls}</span>
                  </div>
                  <Progress value={(pendingCalls / totalCalls) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Armados Más Responsivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {armedGuards.slice(0, 5).map((guard, index) => (
                    <div key={guard.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{guard.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            ⭐ {guard.rating_promedio?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Calls Tab */}
        <TabsContent value="active-calls">
          <Card>
            <CardHeader>
              <CardTitle>Llamadas en Curso</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCalls === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay llamadas activas en este momento
                </div>
              ) : (
                <div className="space-y-4">
                  {callAttempts.filter(c => c.status === 'calling').map((attempt) => (
                    <Card key={attempt.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(attempt.status)}`} />
                              <span className="font-medium">{attempt.guardName}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Servicio: {attempt.serviceId} • Iniciada: {formatTime(attempt.timestamp)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Llamadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {callAttempts.map((attempt) => (
                  <Card key={attempt.id} className="border-l-4" style={{
                    borderLeftColor: attempt.status === 'accepted' ? '#22c55e' : 
                                   attempt.status === 'rejected' ? '#ef4444' : '#6b7280'
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{attempt.guardName}</span>
                            <Badge 
                              variant={attempt.status === 'accepted' ? 'default' : 
                                     attempt.status === 'rejected' ? 'destructive' : 'secondary'}
                            >
                              {getStatusLabel(attempt.status)}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <span>Servicio: {attempt.serviceId}</span>
                            <span className="mx-2">•</span>
                            <span>{formatTime(attempt.timestamp)}</span>
                            {attempt.responseTime && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Respuesta: {attempt.responseTime}s</span>
                              </>
                            )}
                          </div>
                          
                          {attempt.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              Motivo: {attempt.rejectionReason}
                            </p>
                          )}
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(attempt.status)}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}