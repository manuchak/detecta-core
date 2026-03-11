import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Settings, LogOut, User } from 'lucide-react';
import { MobileTabSelector, type MobileTab } from './MobileTabSelector';
import { NotificationDropdown } from '@/components/navigation/NotificationDropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface MonitoringMobileShellProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  children: React.ReactNode;
}

export const MonitoringMobileShell: React.FC<MonitoringMobileShellProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  children,
}) => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  // Zoom reset for mobile — force 1.0
  useEffect(() => {
    const html = document.documentElement;
    const original = html.style.zoom;
    html.style.zoom = '1';
    return () => { html.style.zoom = original; };
  }, []);

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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Unified compact header — single 48px row */}
      <div className="flex items-center justify-between h-12 px-3 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        {/* Left: Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 touch-manipulation"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>

        {/* Center: Title */}
        <h1 className="text-base font-semibold text-foreground tracking-tight">
          Monitoreo
        </h1>

        {/* Right: Notifications + Refresh + Avatar */}
        <div className="flex items-center gap-0.5">
          <NotificationDropdown />

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 touch-manipulation"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
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
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab selector */}
      <div className="shrink-0">
        <MobileTabSelector tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Content area — full remaining height, scrollable per tab */}
      <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom,16px)]">
        {children}
      </div>
    </div>
  );
};
