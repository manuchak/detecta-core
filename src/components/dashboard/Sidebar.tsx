
import React from "react";
import {
  Home,
  Car,
  Users,
  Shield,
  ShieldAlert,
  Wrench,
  Package,
  MessageSquare,
  Settings,
  ChevronDown,
  UserCog,
  LogOut,
  User,
  BarChart3,
  Calendar,
  TestTube,
  CheckCircle2,
  Map,
  ClipboardCheck,
  BookOpen,
  Rocket,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserSkills } from "@/hooks/useUserSkills";
import { useAuth } from "@/contexts/AuthContext";
import { useWMSAccess } from "@/hooks/useWMSAccess";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SIERCP_ALLOWED_ROLES } from "@/constants/accessControl";

const Sidebar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSkill, hasAnySkill } = useUserSkills();
  const { user, userRole, signOut } = useAuth();
  const { hasWMSAccess } = useWMSAccess();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleDisplayName = (role: string | null) => {
    const roleMap: Record<string, string> = {
      'admin': 'Administrador',
      'owner': 'Propietario',
      'supply_admin': 'Admin Supply',
      'coordinador_operaciones': 'Coordinador',
      'jefe_seguridad': 'Jefe Seguridad',
      'analista_seguridad': 'Analista Seguridad',
      'supply_lead': 'Lead Supply',
      'ejecutivo_ventas': 'Ejecutivo Ventas',
      'bi': 'Business Intelligence',
      'monitoring_supervisor': 'Supervisor Monitoreo',
      'monitoring': 'Monitoreo',
      'supply': 'Supply',
      'instalador': 'Instalador',
      'soporte': 'Soporte',
      'unverified': 'No Verificado',
    };
    return roleMap[role || 'unverified'] || 'Usuario';
  };

  // ⚠️ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (key: string) => {
    if (expandedItems.includes(key)) {
      setExpandedItems(expandedItems.filter((itemKey) => itemKey !== key));
    } else {
      setExpandedItems([...expandedItems, key]);
    }
  };


  // Crear componente UserProfile - ahora con mejor UX en la parte superior
  const UserProfile = () => (
    <div className="px-3 py-3 border-b border-border bg-muted/30">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-accent">
            <div className="flex items-center space-x-3 w-full">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getRoleDisplayName(userRole)}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64"
          side="right"
          sideOffset={8}
        >
          <div className="px-3 py-2 bg-muted/50">
            <p className="text-sm font-semibold">{getUserDisplayName()}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-primary font-medium mt-1">{getRoleDisplayName(userRole)}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </DropdownMenuItem>
          {(userRole === 'admin' || userRole === 'owner') && (
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Verificar si el usuario tiene acceso completo de admin o es instalador/custodio limitado
  const isAdminUser = hasSkill('admin_full_access') || userRole === 'supply_admin' || userRole === 'admin' || userRole === 'owner';
  const isInstallerOnly = hasSkill('installer_portal_only') && !isAdminUser && userRole !== 'supply_admin';
  const isCustodioOnly = hasSkill('custodio_tracking_only') && !isAdminUser && userRole !== 'supply_admin';

  // Si es instalador únicamente, solo mostrar su portal
  if (isInstallerOnly) {
    return (
      <div className={cn("flex flex-col h-full", className)} {...props}>
        {/* Profile section at the top for easy access */}
        {user && <UserProfile />}
        
        <div className="flex-1 space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Portal de Instalador
            </h2>
            <div className="space-y-1">
              <Button
                variant={location.pathname === "/installers/portal" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate("/installers/portal")}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Mis Instalaciones
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si es custodio únicamente, solo mostrar seguimiento de leads
  if (isCustodioOnly) {
    return (
      <div className={cn("flex flex-col h-full", className)} {...props}>
        {/* Profile section at the top for easy access */}
        {user && <UserProfile />}
        
        <div className="flex-1 space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Mi Panel
            </h2>
            <div className="space-y-1">
              <Button
                variant={location.pathname === "/leads" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate("/leads")}
              >
                <Users className="mr-2 h-4 w-4" />
                Candidatos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface para subitems con iconos opcionales
  interface SubMenuItem {
    title: string;
    path: string;
    icon?: LucideIcon;
  }

  // Menu completo para usuarios con múltiples permisos
  const navigationItems = [
    // Home - siempre accesible para todos los usuarios
    {
      title: "Inicio",
      icon: Home,
      path: "/home",
    },

    // Dashboard - solo para usuarios con acceso
    ...(isAdminUser ? [{
      title: "Panel Principal",
      icon: BarChart3,
      path: "/dashboard",
    }] : []),

    // Leads - principal funcionalidad - Supply Admin y Supply Lead tienen acceso (mismos menús, sin asignación)
    ...(hasAnySkill(['leads_management', 'leads_approval', 'custodio_tracking_only']) || isAdminUser || ['supply_admin', 'supply_lead', 'admin', 'owner'].includes(userRole || '') ? [{
      title: "Candidatos",
      icon: Users,
      path: "/leads",
      subItems: [
        { title: "Lista de Candidatos", path: "/leads", icon: Users },
        // Aprobaciones disponibles para supply_admin/lead, coordinadores, ejecutivos y admins
        ...(hasSkill('leads_approval') || isAdminUser || ['supply_admin', 'supply_lead', 'coordinador_operaciones', 'ejecutivo_ventas', 'admin', 'owner'].includes(userRole || '') ? [
          { title: "Aprobaciones", path: "/leads/approvals", icon: CheckCircle2 }
        ] : []),
        // Evaluaciones - supply team y admins
        ...(isAdminUser || ['supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones', 'admin', 'owner'].includes(userRole || '') ? [
          { title: "Evaluaciones", path: "/leads/evaluaciones", icon: ClipboardCheck }
        ] : []),
        // Liberación - supply leads y admins
        ...(isAdminUser || ['supply_admin', 'supply_lead', 'coordinador_operaciones', 'admin', 'owner'].includes(userRole || '') ? [
          { title: "Liberación", path: "/leads/liberacion", icon: Rocket }
        ] : []),
        // Estrategia Nacional - solo para coordinadores y administradores
        ...(userRole === 'admin' || userRole === 'owner' || userRole === 'manager' || userRole === 'coordinador_operaciones' ? [
          { title: "Estrategia Nacional", path: "/recruitment-strategy", icon: Map }
        ] : []),
        // Evaluación SIERCP - usando constante centralizada
        ...(SIERCP_ALLOWED_ROLES.includes(userRole as typeof SIERCP_ALLOWED_ROLES[number]) ? [
          { title: "Evaluación SIERCP", path: "/evaluation/siercp", icon: ClipboardCheck },
          { title: "Metodología SIERCP", path: "/evaluation/siercp/methodology", icon: BookOpen }
        ] : []),
      ]
    }] : []),

    // Servicios - solo si tiene permisos de servicios
    ...(hasAnySkill(['services_view', 'services_manage']) || isAdminUser ? [{
      title: "Servicios",
      icon: Car,
      path: "/services",
      subItems: [
        { title: "Gestión de Servicios", path: "/services" },
        { title: "Análisis de Rendimiento", path: "/services/rendimiento" },
      ]
    }] : []),

    // Planeación de Custodias - solo para usuarios con permisos administrativos
    ...(userRole === 'admin' || userRole === 'owner' || userRole === 'coordinador_operaciones' || userRole === 'planificador' ? [{
      title: "Planeación",
      icon: Calendar,
      path: "/planeacion",
    }] : []),

    // Monitoreo - solo si tiene permisos de monitoreo
    ...(hasAnySkill(['monitoring_view', 'monitoring_manage']) || isAdminUser ? [{
      title: "Monitoreo",
      icon: Shield,
      path: "/monitoring",
      subItems: [
        { title: "Panel de Monitoreo", path: "/monitoring" },
      ]
    }] : []),

    // Seguridad - inteligencia de riesgo
    ...(isAdminUser || ['jefe_seguridad', 'analista_seguridad', 'coordinador_operaciones'].includes(userRole || '') ? [{
      title: "Seguridad",
      icon: ShieldAlert,
      path: "/seguridad",
    }] : []),

    // Instaladores - solo si tiene permisos
    ...(hasAnySkill(['installer_portal_only']) || isAdminUser ? [{
      title: "Instalaciones",
      icon: Wrench,
      subItems: [
        { title: "Control Instaladores", path: "/installers/portal" },
        { title: "Registro Instaladores", path: "/installers/registro" },
        { title: "Programación", path: "/installers/schedule" },
        { title: "Calendario", path: "/installers/calendar" },
      ]
    }] : []),

    // WMS - solo si tiene permisos (usando nuevo sistema de roles)
    ...(hasWMSAccess || hasAnySkill(['wms_view', 'wms_manage']) || isAdminUser ? [{
      title: "Inventario GPS",
      icon: Package,
      path: "/wms",
    }] : []),

    // Tickets - solo si tiene permisos
    ...(hasAnySkill(['tickets_view', 'tickets_manage']) || isAdminUser ? [{
      title: "Soporte",
      icon: MessageSquare,
      path: "/tickets",
    }] : []),

    // Administración - solo para admins
    ...(isAdminUser ? [{
      title: "Administración",
      icon: UserCog,
      subItems: [
        { title: "Control de Versiones", path: "/admin/version-control" },
        { title: "Gestión de Landing", path: "/admin/landing-manager" },
        { title: "Limpieza de BD", path: "/maintenance/duplicate-cleanup" },
        { title: "Sistema de Testing", path: "/system-testing" },
      ]
    }] : []),

    // Configuración - solo para admins y owners
    ...(userRole === 'admin' || userRole === 'owner' ? [{
      title: "Configuración",
      icon: Settings,
      path: "/settings",
    }] : []),
  ];

  // Auto-expand menu when on a route that belongs to a submenu
  React.useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.subItems) {
        const itemKey = item.path || item.title;
        const isSubItemActive = item.subItems.some(sub => location.pathname.startsWith(sub.path));
        
        if (isSubItemActive && !expandedItems.includes(itemKey)) {
          setExpandedItems(prev => [...prev, itemKey]);
        }
      }
    });
  }, [location.pathname]);

  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      {/* Profile section at the top for easy access */}
      {user && <UserProfile />}
      
      <div className="flex-1 space-y-4 py-4 overflow-y-auto">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu Principal
          </h2>
          <div className="space-y-1">
            {navigationItems.map((item, index) => {
              const itemKey = item.path || item.title;
              const isExpanded = expandedItems.includes(itemKey);
              
              return (
                <div key={index}>
                  <Button
                    variant={location.pathname === item.path ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      if (item.subItems) {
                        toggleExpanded(itemKey);
                        if (item.path) navigate(item.path);
                      } else {
                        navigate(item.path);
                      }
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                    {item.subItems && (
                      <ChevronDown 
                        className={cn(
                          "ml-auto h-4 w-4 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    )}
                  </Button>
                  
                  {item.subItems && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem, subIndex) => {
                        const isActive = location.pathname === subItem.path;
                        const SubItemIcon = subItem.icon;
                        
                        return (
                          <Button
                            key={subIndex}
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full justify-start transition-all",
                              isActive && "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                            )}
                            onClick={() => navigate(subItem.path)}
                          >
                            {SubItemIcon && <SubItemIcon className="mr-2 h-3.5 w-3.5" />}
                            {subItem.title}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Sidebar };
