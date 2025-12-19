import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, LogOut, User, TestTube2, Shield, ChevronRight } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useSandbox } from '@/contexts/SandboxContext';
import { Logo } from '@/components/landing/Logo';
import { CommandMenu } from './CommandMenu';
import { NotificationDropdown } from './NotificationDropdown';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useContextualActions } from '@/hooks/useContextualActions';
import { cn } from '@/lib/utils';

export function SimplifiedTopBar() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { isSandboxMode } = useSandbox();
  const breadcrumbs = useBreadcrumbs();
  const contextualActions = useContextualActions();

  const canAccessSandbox = userRole === 'admin' || userRole === 'owner';

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    if (!user?.email) return 'Usuario';
    return user.email.split('@')[0];
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-3">
        {/* Logo */}
        <div className="shrink-0">
          <Logo />
        </div>

        {/* Breadcrumbs - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => {
            const Icon = crumb.icon;
            return (
              <React.Fragment key={crumb.path}>
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
                {crumb.isLast ? (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {crumb.label}
                  </span>
                ) : (
                  <Link 
                    to={crumb.path}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Command Menu - Search */}
        <div className="hidden sm:block">
          <CommandMenu />
        </div>

        {/* Contextual Actions - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2">
          {contextualActions.map((action) => {
            const Icon = action.icon;
            return (
              <TooltipProvider key={action.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={action.variant || 'ghost'}
                      size="sm"
                      onClick={action.action}
                      className={cn(
                        "h-8 gap-1.5",
                        action.variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{action.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-6 w-px bg-border/50" />

        {/* Right Section */}
        <div className="flex items-center gap-1.5">
          {/* Environment Badge */}
          {canAccessSandbox && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2"
                    onClick={() => navigate('/settings?tab=entorno')}
                  >
                    {isSandboxMode ? (
                      <>
                        <TestTube2 className="h-4 w-4 text-warning" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning hidden sm:inline-flex">
                          Sandbox
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 text-success" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success text-success hidden sm:inline-flex">
                          Prod
                        </Badge>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isSandboxMode 
                      ? 'Entorno de pruebas activo' 
                      : 'Entorno de producción activo'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Click para configurar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 rounded-full pl-2 pr-3 hover:bg-background/80">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium">
                  {getUserName()}
                </span>
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
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
