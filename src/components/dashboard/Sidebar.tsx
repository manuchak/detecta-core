
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Clipboard,
  Map,
  Settings,
  X,
  MessageSquare,
  BarChart,
  CalendarCheck,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const NavItem = ({ href, label, icon, end = false }: NavItemProps) => (
  <NavLink
    to={href}
    end={end}
    className={({ isActive }) =>
      cn(
        "menu-item",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const NavGroup = ({ label, icon, children }: NavGroupProps) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="menu-item w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent/50">
          <span className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-7 flex flex-col gap-1 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 md:sticky",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground">LFN</span>
            </div>
            <h2 className="font-semibold text-sidebar-foreground">Lead Flow Navigator</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-sidebar-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        
        {/* Sidebar content */}
        <div className="flex-1 overflow-auto py-4 px-3 flex flex-col gap-2">
          <NavItem
            href="/dashboard"
            label="Dashboard"
            icon={<Home className="h-5 w-5" />}
            end
          />
          
          <NavGroup
            label="Leads"
            icon={<Users className="h-5 w-5" />}
          >
            <NavItem
              href="/leads"
              label="Todos los leads"
              icon={<ChevronRight className="h-4 w-4" />}
            />
            <NavItem
              href="/leads/new"
              label="Crear lead"
              icon={<ChevronRight className="h-4 w-4" />}
            />
            <NavItem
              href="/leads/approval"
              label="Proceso de aprobación"
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </NavGroup>
          
          <NavGroup
            label="Servicios"
            icon={<CalendarCheck className="h-5 w-5" />}
          >
            <NavItem
              href="/services"
              label="Lista de servicios"
              icon={<ChevronRight className="h-4 w-4" />}
            />
            <NavItem
              href="/services/performance"
              label="Rendimiento"
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </NavGroup>
          
          <NavGroup
            label="Instalaciones"
            icon={<Map className="h-5 w-5" />}
          >
            <NavItem
              href="/installations"
              label="Instalaciones GPS"
              icon={<ChevronRight className="h-4 w-4" />}
            />
            <NavItem
              href="/installations/installers"
              label="Gestión de instaladores"
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </NavGroup>
          
          <NavItem
            href="/monitoring"
            label="Monitoreo"
            icon={<BarChart className="h-5 w-5" />}
          />
          
          <NavGroup
            label="Tickets"
            icon={<MessageSquare className="h-5 w-5" />}
          >
            <NavItem
              href="/tickets"
              label="Todos los tickets"
              icon={<ChevronRight className="h-4 w-4" />}
            />
            <NavItem
              href="/tickets/new"
              label="Crear ticket"
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </NavGroup>
          
          <Separator className="my-2 bg-sidebar-border" />
          
          <NavItem
            href="/settings"
            label="Configuración"
            icon={<Settings className="h-5 w-5" />}
          />
        </div>
      </div>
    </>
  );
};
