
import { Button } from "@/components/ui/button";
import { Search, Menu, Bell, Settings, User, LogOut, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showCreateButton?: boolean;
  onCreateService?: () => void;
}

export const Header = ({ sidebarOpen, setSidebarOpen, showCreateButton, onCreateService }: HeaderProps) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-background border-b border-border/40">
      <div className="flex flex-1 justify-between px-4 md:px-6">
        <div className="flex flex-1 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          <div className="max-w-lg flex-1 md:w-80">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-full bg-secondary/50 border-none pl-8 md:max-w-xs rounded-lg"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {showCreateButton && (
            <Button 
              onClick={onCreateService}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 h-9 rounded-lg font-medium"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Crear Servicio
            </Button>
          )}
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
              <Bell className="h-4.5 w-4.5" />
            </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
            <Settings className="h-4.5 w-4.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.email ? user.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.display_name || "Usuario"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "usuario@ejemplo.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Ajustes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
