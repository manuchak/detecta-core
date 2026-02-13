import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/landing/Logo';
import { 
  LayoutDashboard,
  Users, 
  UserCheck,
  Wrench,
  Activity,
  Package,
  Settings,
  LogOut,
  User,
  Receipt,
  HeartHandshake
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Module {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  roles?: string[];
}

const modules: Module[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    id: 'recruitment',
    label: 'Reclutamiento',
    icon: Users,
    path: '/recruitment-strategy',
    roles: ['admin', 'owner', 'manager', 'coordinador_operaciones']
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: UserCheck,
    path: '/leads'
  },
  {
    id: 'services',
    label: 'Servicios',
    icon: Wrench,
    path: '/services'
  },
  {
    id: 'monitoring',
    label: 'Monitoreo',
    icon: Activity,
    path: '/monitoring'
  },
  {
    id: 'wms',
    label: 'WMS',
    icon: Package,
    path: '/wms',
    roles: ['admin', 'owner', 'monitoring_supervisor', 'monitoring', 'coordinador_operaciones']
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    icon: Receipt,
    path: '/facturacion',
    roles: ['admin', 'owner', 'bi', 'facturacion_admin', 'facturacion', 'finanzas_admin', 'finanzas', 'coordinador_operaciones']
  },
  {
    id: 'customer-success',
    label: 'Customer Success',
    icon: HeartHandshake,
    path: '/customer-success',
    roles: ['admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones']
  }
];

export function GlobalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();

  const getActiveModule = () => {
    const path = location.pathname;
    return modules.find(m => path.startsWith(m.path))?.id || 'dashboard';
  };

  const activeModule = getActiveModule();

  const filteredModules = modules.filter(module => {
    if (!module.roles) return true;
    return module.roles.includes(userRole || '');
  });

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {/* Logo */}
        <div className="mr-6">
          <Logo />
        </div>

        {/* Module Tabs */}
        <nav className="flex items-center space-x-1 flex-1">
          {filteredModules.map((module) => {
            const isActive = activeModule === module.id;
            const Icon = module.icon;
            
            return (
              <Button
                key={module.id}
                variant="ghost"
                size="sm"
                onClick={() => navigate(module.path)}
                className={cn(
                  "relative h-10 px-4 rounded-lg transition-all duration-200",
                  "hover:bg-accent/50",
                  isActive && "bg-primary/10 text-primary font-medium shadow-sm"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="text-sm">{module.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-t-full" />
                )}
              </Button>
            );
          })}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userRole || 'Usuario'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
