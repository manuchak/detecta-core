import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Activity,
  Home as HomeIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeRobust = () => {
  const { user, userRole } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getRoleDisplay = (role?: string | null) => {
    if (!role) return "Usuario";
    
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

  // Acciones universales que funcionan para todos los usuarios
  const getUniversalActions = () => {
    return [
      { 
        title: 'Mi Perfil', 
        icon: User, 
        href: '/settings', 
        description: 'Configurar información personal',
        color: 'bg-blue-100 text-blue-600'
      },
      { 
        title: 'Monitoreo General', 
        icon: MapPin, 
        href: '/monitoring', 
        description: 'Ver estado general del sistema',
        color: 'bg-green-100 text-green-600'
      },
      { 
        title: 'Soporte', 
        icon: Bell, 
        href: '/tickets', 
        description: 'Centro de ayuda y tickets',
        color: 'bg-orange-100 text-orange-600'
      }
    ];
  };

  // Acciones específicas para supply_admin
  const getSupplyAdminActions = () => {
    return [
      { 
        title: 'WMS - Inventario', 
        icon: Activity, 
        href: '/wms', 
        description: 'Gestión de inventario y suministros',
        color: 'bg-purple-100 text-purple-600'
      },
      { 
        title: 'Dashboard Ejecutivo', 
        icon: Activity, 
        href: '/executive-dashboard', 
        description: 'Métricas y análisis avanzado',
        color: 'bg-indigo-100 text-indigo-600'
      },
      { 
        title: 'Gestión de Leads', 
        icon: User, 
        href: '/leads', 
        description: 'Administrar leads y prospects',
        color: 'bg-pink-100 text-pink-600'
      }
    ];
  };

  const getAllActions = () => {
    const universal = getUniversalActions();
    
    // Agregar acciones específicas según el rol
    if (userRole === 'supply_admin' || user?.email?.includes('detectasecurity.io')) {
      return [...universal, ...getSupplyAdminActions()];
    }
    
    return universal;
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
                Bienvenido al sistema de gestión GPS - DetectaSecurity
              </p>
              {user?.email && (
                <p className="text-sm text-gray-500 mt-2">
                  Conectado como: {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {getRoleDisplay(userRole)}
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

        {/* Estado de Debug */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-700">
              <p>User ID: {user?.id}</p>
              <p>Email: {user?.email}</p>
              <p>Role: {userRole || 'Loading...'}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
            </CardContent>
          </Card>
        )}

        {/* Acciones Rápidas */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Acciones Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getAllActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <Link to={action.href} className="block">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg group-hover:text-blue-600 transition-colors">
                        <div className={`p-2 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
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
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Todos los sistemas operativos</span>
              </div>
              <span className="text-xs text-gray-500">
                Última actualización: {new Date().toLocaleTimeString('es-MX')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Acceso de Emergencia */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <HomeIcon className="h-5 w-5" />
              Acceso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">Configuración</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/monitoring">Monitoreo</Link>
              </Button>
              {(userRole === 'supply_admin' || user?.email?.includes('detectasecurity.io')) && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/wms">Inventario</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/executive-dashboard">Dashboard</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeRobust;