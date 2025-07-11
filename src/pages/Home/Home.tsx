
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  MapPin, 
  Clock, 
  Settings,
  Bell,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Truck,
  UserCheck,
  Monitor
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
    const baseActions = [
      { 
        title: 'Mi Perfil', 
        icon: User, 
        href: '/settings', 
        description: 'Configurar información personal',
        color: 'bg-blue-50 text-blue-600 border-blue-100'
      },
      { 
        title: 'Monitoreo General', 
        icon: Monitor, 
        href: '/monitoring', 
        description: 'Ver estado del sistema en tiempo real',
        color: 'bg-green-50 text-green-600 border-green-100'
      },
      { 
        title: 'Soporte', 
        icon: Bell, 
        href: '/tickets', 
        description: 'Centro de ayuda y tickets',
        color: 'bg-orange-50 text-orange-600 border-orange-100'
      }
    ];

    const roleSpecificActions = [];

    // Dashboard para roles administrativos
    if (['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi'].includes(userRole || '')) {
      roleSpecificActions.push({
        title: 'Dashboard Ejecutivo',
        icon: TrendingUp,
        href: '/executive-dashboard',
        description: 'Analítica avanzada y métricas financieras',
        color: 'bg-purple-50 text-purple-600 border-purple-100',
        featured: true
      });
    }

    // Servicios para roles operativos
    if (['custodio', 'supply', 'instalador'].includes(userRole || '')) {
      roleSpecificActions.push({
        title: 'Mis Servicios',
        icon: Truck,
        href: '/services',
        description: 'Gestionar servicios asignados',
        color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
      });
    }

    // Portal instalador
    if (['instalador'].includes(userRole || '')) {
      roleSpecificActions.push({
        title: 'Portal Instalador',
        icon: Settings,
        href: '/installers/portal',
        description: 'Gestionar instalaciones',
        color: 'bg-cyan-50 text-cyan-600 border-cyan-100'
      });
    }

    // WMS para roles de suministros
    if (['supply_admin', 'supply', 'admin', 'owner'].includes(userRole || '')) {
      roleSpecificActions.push({
        title: 'WMS - GPS',
        icon: BarChart3,
        href: '/wms',
        description: 'Gestión de inventario y suministros',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
      });
    }

    // Leads para ventas y administración
    if (['admin', 'owner', 'supply_admin', 'ejecutivo_ventas'].includes(userRole || '')) {
      roleSpecificActions.push({
        title: 'Gestión de Leads',
        icon: UserCheck,
        href: '/leads',
        description: 'Administrar candidatos y reclutamiento',
        color: 'bg-pink-50 text-pink-600 border-pink-100'
      });
    }

    return [...roleSpecificActions, ...baseActions];
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/30 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-24">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-2 rounded-full border-gray-200 bg-white/80 backdrop-blur-sm">
                <Shield className="h-4 w-4 mr-2" />
                {getRoleDisplay(userRole || 'unverified')}
              </Badge>
              <h1 className="text-5xl sm:text-6xl font-light text-gray-900 tracking-tight">
                {getWelcomeMessage()},
                <span className="block font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Bienvenido al sistema de gestión GPS - DetectaSecurity
              </p>
              <div className="flex items-center justify-center text-gray-400 text-sm">
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
      </div>

      {/* Main Actions Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        <div className="mb-12">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-2">Acciones Disponibles</h2>
          <p className="text-gray-600 text-center">Accede rápidamente a los módulos más importantes</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getQuickActions().map((action, index) => {
            const Icon = action.icon;
            const isFeatured = action.featured;
            
            return (
              <Link 
                key={index} 
                to={action.href}
                className="group block"
              >
                <Card className={`
                  relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm 
                  hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50
                  transition-all duration-500 ease-out
                  hover:-translate-y-2 cursor-pointer
                  ${isFeatured ? 'lg:col-span-2' : ''}
                `}>
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      <div className={`
                        p-4 rounded-2xl ${action.color} border
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        <Icon className="h-8 w-8" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700">
                            {action.title}
                          </h3>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* System Status */}
        <div className="mt-20">
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Estado del Sistema</h3>
                    <p className="text-green-600 font-medium">Todos los sistemas operativos</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Última actualización</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleTimeString('es-MX', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Buttons */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-light text-gray-900 mb-8">Acceso Rápido</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/settings" 
              className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </Link>
            <Link 
              to="/monitoring" 
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
            >
              <Monitor className="h-4 w-4" />
              <span>Monitoreo</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
