import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home,
  BarChart3,
  Users,
  Target,
  Calendar,
  Map,
  TestTube,
  Bot,
  Settings,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SandboxToggle } from '@/components/sandbox/SandboxToggle';

interface MainNavigationProps {
  className?: string;
}

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Vista ejecutiva principal',
    icon: BarChart3,
    route: '/dashboard',
    roles: ['admin', 'owner', 'bi', 'supply_admin']
  },
  {
    id: 'leads',
    title: 'Leads',
    description: 'Gestión de candidatos',
    icon: Users,
    route: '/leads',
    roles: ['admin', 'owner', 'supply_admin', 'ejecutivo_ventas']
  },
  {
    id: 'recruitment',
    title: 'Estrategia',
    description: 'Reclutamiento inteligente',
    icon: Target,
    route: '/recruitment-strategy',
    roles: ['admin', 'owner', 'manager', 'coordinador_operaciones']
  },
  {
    id: 'planning',
    title: 'Planificación',
    description: 'Estrategia temporal',
    icon: Calendar,
    route: '/recruitment-planning',
    roles: ['admin', 'owner', 'manager', 'coordinador_operaciones']
  },
  {
    id: 'map',
    title: 'Mapa Nacional',
    description: 'Vista geográfica',
    icon: Map,
    route: '/national-map',
    roles: ['admin', 'owner', 'manager', 'coordinador_operaciones']
  },
  {
    id: 'simulation',
    title: 'Simulación',
    description: 'Escenarios y ROI',
    icon: TestTube,
    route: '/simulation-scenarios',
    roles: ['admin', 'owner', 'manager']
  },
  {
    id: 'ai',
    title: 'IA Avanzada',
    description: 'Inteligencia artificial',
    icon: Bot,
    route: '/ai-advanced',
    roles: ['admin', 'owner', 'manager']
  }
];

export function MainNavigation({ className }: MainNavigationProps) {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  // Filter navigation items based on user role
  const availableItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole || '')
  );

  const handleNavigation = (route: string) => {
    navigate(route);
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
    <nav className={cn("bg-background/95 backdrop-blur border-b", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section: Logo + Main Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo/Home */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 hover:bg-transparent"
            >
              <Home className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg text-foreground">SIERCP</span>
            </Button>

            {/* Main Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {availableItems.slice(0, 4).map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation(item.route)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                  title={item.description}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.title}</span>
                </Button>
              ))}

              {/* More Menu for additional items */}
              {availableItems.length > 4 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
                    >
                      <span>Más</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Más opciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableItems.slice(4).map((item) => (
                      <DropdownMenuItem 
                        key={item.id}
                        onClick={() => handleNavigation(item.route)}
                        className="flex items-center space-x-2"
                      >
                        <item.icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Right section: Sandbox Toggle + User Menu */}
          <div className="flex items-center">
            {/* Sandbox Toggle (solo admins) */}
            {(userRole === 'admin' || userRole === 'owner') && (
              <SandboxToggle />
            )}
            
            {/* User Role Badge */}
            {userRole && (
              <Badge variant="secondary" className="hidden sm:flex ml-4">
                {userRole}
              </Badge>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block font-medium">
                    {user?.email?.split('@')[0] || 'Usuario'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <div className="space-y-1">
                    <div className="w-5 h-0.5 bg-foreground"></div>
                    <div className="w-5 h-0.5 bg-foreground"></div>
                    <div className="w-5 h-0.5 bg-foreground"></div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Navegación</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.id}
                    onClick={() => handleNavigation(item.route)}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}