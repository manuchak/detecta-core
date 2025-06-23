
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  MapPin, 
  Clock, 
  Settings,
  Bell,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user, userRole } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'owner': 'Propietario',
      'admin': 'Administrador',
      'supply_admin': 'Admin Suministros',
      'coordinador_operaciones': 'Coordinador',
      'jefe_seguridad': 'Jefe Seguridad',
      'analista_seguridad': 'Analista Seguridad',
      'supply_lead': 'Lead Suministros',
      'ejecutivo_ventas': 'Ejecutivo Ventas',
      'custodio': 'Custodio',
      'bi': 'Analista BI',
      'monitoring_supervisor': 'Supervisor Monitoreo',
      'monitoring': 'Monitoreo',
      'supply': 'Suministros',
      'instalador': 'Instalador',
      'soporte': 'Soporte Técnico',
      'pending': 'Pendiente',
      'unverified': 'No Verificado'
    };
    return roleMap[role] || role;
  };

  const getQuickActions = () => {
    const actions = [];
    
    // Acciones comunes para todos
    actions.push(
      { title: 'Mi Perfil', icon: User, href: '/settings', description: 'Configurar información personal' },
      { title: 'Monitoreo', icon: MapPin, href: '/monitoring', description: 'Ver estado de servicios en tiempo real' }
    );

    // Acciones específicas por rol
    if (['custodio', 'supply', 'instalador'].includes(userRole || '')) {
      actions.push(
        { title: 'Mis Servicios', icon: Activity, href: '/services', description: 'Ver servicios asignados' }
      );
    }

    if (['instalador'].includes(userRole || '')) {
      actions.push(
        { title: 'Portal Instalador', icon: Settings, href: '/installers/portal', description: 'Gestionar instalaciones' }
      );
    }

    if (['monitoring', 'monitoring_supervisor'].includes(userRole || '')) {
      actions.push(
        { title: 'Centro de Monitoreo', icon: MapPin, href: '/monitoring', description: 'Supervisar operaciones' }
      );
    }

    if (['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi'].includes(userRole || '')) {
      actions.push(
        { title: 'Dashboard Ejecutivo', icon: Activity, href: '/executive-dashboard', description: 'Datos financieros y métricas avanzadas' }
      );
    }

    return actions;
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header de Bienvenida */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getWelcomeMessage()}, {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido al sistema de gestión GPS
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {getRoleDisplay(userRole || 'unverified')}
              </Badge>
              <div className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                {new Date().toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getQuickActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link to={action.href}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        {action.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm">{action.description}</p>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Todos los sistemas operativos</span>
              </div>
              <span className="text-xs text-gray-500">
                Última actualización: {new Date().toLocaleTimeString('es-MX')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
