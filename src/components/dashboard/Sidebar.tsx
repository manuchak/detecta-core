
import React from "react";
import {
  Home,
  Car,
  Users,
  Shield,
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
  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);

  const toggleExpanded = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter((itemIndex) => itemIndex !== index));
    } else {
      setExpandedItems([...expandedItems, index]);
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
        { title: "Lista de Candidatos", path: "/leads" },
        // Aprobaciones disponibles para supply_admin/lead y admins
        ...(hasSkill('leads_approval') || isAdminUser || ['supply_admin', 'supply_lead', 'admin', 'owner'].includes(userRole || '') ? [
          { title: "Aprobaciones", path: "/leads/approvals" }
        ] : []),
        // Estrategia Nacional - solo para coordinadores y administradores
        ...(userRole === 'admin' || userRole === 'owner' || userRole === 'manager' || userRole === 'coordinador_operaciones' ? [
          { title: "Estrategia Nacional", path: "/recruitment-strategy" }
        ] : []),
        // Evaluación SIERCP - igual que supply_admin en el menú
        ...(userRole === 'admin' || userRole === 'owner' || userRole === 'supply_admin' || userRole === 'supply_lead' ? [
          { title: "Evaluación SIERCP", path: "/evaluation/siercp" },
          { title: "Metodología SIERCP", path: "/evaluation/siercp/methodology" }
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
        { title: "Supply Chain", path: "/monitoring/supply-chain" },
        { title: "Auditoría Forense", path: "/monitoring/forensic-audit" },
      ]
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
            {navigationItems.map((item, index) => (
              <div key={index}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    if (item.subItems) {
                      toggleExpanded(index);
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
                        expandedItems.includes(index) && "rotate-180"
                      )}
                    />
                  )}
                </Button>
                
                {item.subItems && expandedItems.includes(index) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <Button
                        key={subIndex}
                        variant={location.pathname === subItem.path ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => navigate(subItem.path)}
                      >
                        {subItem.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Sidebar };
