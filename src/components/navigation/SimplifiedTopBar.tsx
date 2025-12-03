import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut, User, TestTube2, Shield } from 'lucide-react';
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

export function SimplifiedTopBar() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { isSandboxMode } = useSandbox();

  const canAccessSandbox = userRole === 'admin' || userRole === 'owner';

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
      <div className="flex h-12 items-center px-4 gap-4">
        {/* Logo */}
        <div className="shrink-0">
          <Logo />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Section: Environment Badge, Notifications & User */}
        <div className="flex items-center gap-2">
          {/* Environment Badge - Solo para admin/owner */}
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
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning">
                          Sandbox
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 text-success" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success text-success">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
      </div>
    </header>
  );
}
