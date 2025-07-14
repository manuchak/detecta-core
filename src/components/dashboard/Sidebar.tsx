
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserSkills } from "@/hooks/useUserSkills";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSkill, hasAnySkill } = useUserSkills();
  const { user, userRole, signOut } = useAuth();

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

  // Crear componente UserProfile
  const UserProfile = () => (
    <div className="px-3 py-2 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-2 h-auto">
            <div className="flex items-center space-x-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getRoleDisplayName(userRole)}
                </p>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56"
          side="right"
        >
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{getUserDisplayName()}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Verificar si el usuario tiene acceso completo de admin o es instalador/custodio limitado
  const isAdminUser = hasSkill('admin_full_access');
  const isInstallerOnly = hasSkill('installer_portal_only') && !isAdminUser;
  const isCustodioOnly = hasSkill('custodio_tracking_only') && !isAdminUser;

  // Si es instalador únicamente, solo mostrar su portal
  if (isInstallerOnly) {
    return (
      <div className={cn("pb-12 flex flex-col h-full", className)} {...props}>
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
        {/* Profile section at the bottom */}
        {user && <UserProfile />}
      </div>
    );
  }

  // Si es custodio únicamente, solo mostrar seguimiento de leads
  if (isCustodioOnly) {
    return (
      <div className={cn("pb-12 flex flex-col h-full", className)} {...props}>
        <div className="flex-1 space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Seguimiento de Candidatos
            </h2>
            <div className="space-y-1">
              <Button
                variant={location.pathname === "/leads" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate("/leads")}
              >
                <Users className="mr-2 h-4 w-4" />
                Mi Proceso de Reclutamiento
              </Button>
            </div>
          </div>
        </div>
        {/* Profile section at the bottom */}
        {user && <UserProfile />}
      </div>
    );
  }

  // Menu completo para usuarios con múltiples permisos
  const navigationItems = [
    // Dashboard - solo si tiene el skill
    ...(hasSkill('dashboard_view') || isAdminUser ? [{
      title: "Panel Principal",
      icon: Home,
      path: "/dashboard",
    }] : []),

    // Servicios - solo si tiene permisos de servicios
    ...(hasAnySkill(['services_view', 'services_manage']) || isAdminUser ? [{
      title: "Servicios",
      icon: Car,
      subItems: [
        { title: "Gestión de Servicios", path: "/services" },
        { title: "Rendimiento", path: "/services/rendimiento" },
      ]
    }] : []),

    // Leads - solo si tiene permisos de leads
    ...(hasAnySkill(['leads_management', 'leads_approval', 'custodio_tracking_only']) || isAdminUser ? [{
      title: "Leads",
      icon: Users,
      subItems: [
        { title: "Gestión de Leads", path: "/leads" },
        ...(hasSkill('leads_approval') || isAdminUser ? [
          { title: "Aprobaciones", path: "/leads/approvals" }
        ] : []),
      ]
    }] : []),

    // Monitoreo - solo si tiene permisos de monitoreo
    ...(hasAnySkill(['monitoring_view', 'monitoring_manage']) || isAdminUser ? [{
      title: "Monitoreo",
      icon: Shield,
      path: "/monitoring",
      subItems: [
        { title: "Supply Chain", path: "/monitoring/supply-chain" },
        { title: "Auditoría Forense", path: "/monitoring/forensic-audit" },
      ]
    }] : []),

    // Instaladores - solo si tiene permisos
    ...(hasAnySkill(['installer_portal_only']) || isAdminUser ? [{
      title: "Instaladores",
      icon: Wrench,
      path: "/installers",
      subItems: [
        { title: "Programación", path: "/installers/schedule" },
        { title: "Calendario", path: "/installers/calendar" },
        { title: "Portal", path: "/installers/portal" },
      ]
    }] : []),

    // WMS - solo si tiene permisos
    ...(hasAnySkill(['wms_view', 'wms_manage']) || isAdminUser ? [{
      title: "WMS - GPS",
      icon: Package,
      path: "/wms",
    }] : []),

    // Tickets - solo si tiene permisos
    ...(hasAnySkill(['tickets_view', 'tickets_manage']) || isAdminUser ? [{
      title: "Tickets",
      icon: MessageSquare,
      path: "/tickets",
    }] : []),

    // Administración - solo para admins
    ...(isAdminUser ? [{
      title: "Administración",
      icon: UserCog,
      subItems: [
        { title: "Landing Page", path: "/admin/landing-manager" },
        { title: "Mantenimiento DB", path: "/maintenance/duplicate-cleanup" },
      ]
    }] : []),

    // Configuración - solo si tiene permisos
    ...(hasAnySkill(['settings_view', 'settings_manage']) || isAdminUser ? [{
      title: "Configuración",
      icon: Settings,
      path: "/settings",
    }] : []),
  ];

  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);

  const toggleExpanded = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter((itemIndex) => itemIndex !== index));
    } else {
      setExpandedItems([...expandedItems, index]);
    }
  };

  return (
    <div className={cn("pb-12 flex flex-col h-full", className)} {...props}>
      <div className="flex-1 space-y-4 py-4">
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
      
      {/* Profile section at the bottom */}
      {user && <UserProfile />}
    </div>
  );
}
