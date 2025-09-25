import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  Users,
  FileText,
  Calendar,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { usePersonalProveedorArmados, type PersonalProveedorArmado } from '@/hooks/usePersonalProveedorArmados';
import { useProveedoresArmados } from '@/hooks/useProveedoresArmados';
import type { ProveedorArmado } from '@/hooks/useArmedGuardsOperativos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ArmedGuardComplianceDashboard: React.FC = () => {
  const { personal, loading, getAlertasLicencias } = usePersonalProveedorArmados();
  const { proveedores } = useProveedoresArmados();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState<string>('todos');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');

  const alertasLicencias = getAlertasLicencias();

  const getProveedorNombre = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre_empresa || 'Proveedor desconocido';
  };

  const filteredPersonal = personal.filter(p => {
    const matchesSearch = p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.cedula_rfc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getProveedorNombre(p.proveedor_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProveedor = selectedProveedor === 'todos' || p.proveedor_id === selectedProveedor;
    const matchesEstado = selectedEstado === 'todos' || p.estado_verificacion === selectedEstado;

    return matchesSearch && matchesProveedor && matchesEstado;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'verificado':
        return <Badge variant="default" className="bg-success text-success-foreground">Verificado</Badge>;
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'rechazado':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getLicenciaStatus = (personal: PersonalProveedorArmado) => {
    if (!personal.vigencia_licencia) {
      return { status: 'sin_fecha', dias: null, color: 'muted' };
    }

    const diasVencimiento = Math.ceil(
      (new Date(personal.vigencia_licencia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasVencimiento < 0) {
      return { status: 'vencida', dias: Math.abs(diasVencimiento), color: 'destructive' };
    } else if (diasVencimiento <= 7) {
      return { status: 'critica', dias: diasVencimiento, color: 'destructive' };
    } else if (diasVencimiento <= 15) {
      return { status: 'alta', dias: diasVencimiento, color: 'warning' };
    } else if (diasVencimiento <= 30) {
      return { status: 'media', dias: diasVencimiento, color: 'secondary' };
    } else {
      return { status: 'vigente', dias: diasVencimiento, color: 'success' };
    }
  };

  const getLicenciaBadge = (personal: PersonalProveedorArmado) => {
    const { status, dias, color } = getLicenciaStatus(personal);
    
    switch (status) {
      case 'vencida':
        return <Badge variant="destructive">Vencida hace {dias} días</Badge>;
      case 'critica':
        return <Badge variant="destructive">Vence en {dias} días</Badge>;
      case 'alta':
        return <Badge variant="destructive">Vence en {dias} días</Badge>;
      case 'media':
        return <Badge variant="secondary">Vence en {dias} días</Badge>;
      case 'vigente':
        return <Badge variant="outline" className="bg-success/10 text-success">Vigente</Badge>;
      case 'sin_fecha':
        return <Badge variant="outline">Sin fecha</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getResumenCompliance = () => {
    const total = personal.length;
    const verificados = personal.filter(p => p.estado_verificacion === 'verificado').length;
    const disponibles = personal.filter(p => p.disponible_para_servicios && p.activo).length;
    const alertas = alertasLicencias.length;
    
    return { total, verificados, disponibles, alertas };
  };

  const resumen = getResumenCompliance();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Cargando dashboard de compliance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{resumen.total}</p>
                <p className="text-sm text-muted-foreground">Total Personal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{resumen.verificados}</p>
                <p className="text-sm text-muted-foreground">Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{resumen.disponibles}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{resumen.alertas}</p>
                <p className="text-sm text-muted-foreground">Con Alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas importantes */}
      {alertasLicencias.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hay {alertasLicencias.length} personal(es) con licencias próximas a vencer o vencidas que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="w-full">
        <TabsList>
          <TabsTrigger value="personal">Personal Activo</TabsTrigger>
          <TabsTrigger value="alertas">Alertas de Licencias</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nombre, RFC o proveedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Proveedor</label>
                  <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los proveedores</SelectItem>
                      {proveedores.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre_empresa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                  <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="verificado">Verificado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de personal */}
          <div className="grid gap-4">
            {filteredPersonal.map((persona) => (
              <Card key={persona.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{persona.nombre_completo}</h3>
                        {getEstadoBadge(persona.estado_verificacion)}
                        {!persona.activo && <Badge variant="outline">Inactivo</Badge>}
                        {!persona.disponible_para_servicios && <Badge variant="secondary">No Disponible</Badge>}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {getProveedorNombre(persona.proveedor_id)}
                        </div>
                        {persona.cedula_rfc && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {persona.cedula_rfc}
                          </div>
                        )}
                        {persona.telefono_personal && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {persona.telefono_personal}
                          </div>
                        )}
                        {persona.email_personal && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {persona.email_personal}
                          </div>
                        )}
                      </div>

                      {persona.licencia_portacion && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-3 w-3" />
                          <span>Licencia: {persona.licencia_portacion}</span>
                          {getLicenciaBadge(persona)}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm">
                      {persona.fecha_ultima_verificacion && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Verificado: {format(new Date(persona.fecha_ultima_verificacion), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPersonal.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No se encontró personal que coincida con los filtros</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas de Licencias
              </CardTitle>
              <CardDescription>
                Personal con licencias próximas a vencer o vencidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertasLicencias.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="text-muted-foreground">No hay alertas de licencias pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertasLicencias.map((persona) => {
                    const { status, dias } = getLicenciaStatus(persona);
                    return (
                      <div key={persona.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{persona.nombre_completo}</h4>
                            <p className="text-sm text-muted-foreground">
                              {getProveedorNombre(persona.proveedor_id)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Shield className="h-4 w-4" />
                              <span className="text-sm">{persona.licencia_portacion}</span>
                              {getLicenciaBadge(persona)}
                            </div>
                          </div>
                          <div className="text-right">
                            {persona.vigencia_licencia && (
                              <p className="text-sm text-muted-foreground">
                                Vence: {format(new Date(persona.vigencia_licencia), 'dd/MM/yyyy', { locale: es })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};