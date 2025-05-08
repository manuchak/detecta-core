
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BarChartBig,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  HelpCircle,
  HomeIcon,
  LifeBuoy,
  ListChecks,
  MonitorIcon,
  Settings,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { user, userRole } = useAuth();
  
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  const sidebarLinks = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Leads",
      href: "/leads",
      icon: UsersRound,
      isActive: pathname.startsWith("/leads"),
      submenu: [
        {
          title: "Lista de Leads",
          href: "/leads",
          isActive: pathname === "/leads",
        },
        {
          title: "Aprobación de Leads",
          href: "/leads/approval",
          isActive: pathname === "/leads/approval",
        },
        {
          title: "Crear Lead",
          href: "/leads/new",
          isActive: pathname === "/leads/new",
        },
      ],
    },
    {
      title: "Servicios",
      href: "/services",
      icon: FileBarChart2,
      isActive: pathname.startsWith("/services"),
      submenu: [
        {
          title: "Lista de Servicios",
          href: "/services",
          isActive: pathname === "/services",
        },
        {
          title: "Rendimiento",
          href: "/services/performance",
          isActive: pathname === "/services/performance",
        },
      ],
    },
    {
      title: "Instalaciones GPS",
      href: "/installations",
      icon: MonitorIcon,
      isActive: pathname.startsWith("/installations"),
      submenu: [
        {
          title: "Calendario",
          href: "/installations",
          isActive: pathname === "/installations",
        },
        {
          title: "Instaladores",
          href: "/installations/installers",
          isActive: pathname === "/installations/installers",
        },
      ],
    },
    {
      title: "Monitoreo",
      href: "/monitoring",
      icon: BarChartBig,
      isActive: pathname.startsWith("/monitoring"),
    },
    {
      title: "Tickets",
      href: "/tickets",
      icon: LifeBuoy,
      isActive: pathname.startsWith("/tickets"),
      submenu: [
        {
          title: "Lista de Tickets",
          href: "/tickets",
          isActive: pathname === "/tickets",
        },
        {
          title: "Crear Ticket",
          href: "/tickets/new",
          isActive: pathname === "/tickets/new",
        },
      ],
    },
    ...(isAdmin ? [
      {
        title: "Configuración",
        href: "/settings",
        icon: Settings,
        isActive: pathname.startsWith("/settings"),
      },
    ] : []),
  ];

  // Mobile sidebar with sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0">
          <div className="flex h-full flex-col gap-0">
            <div className="flex h-14 items-center border-b px-4">
              <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                <MonitorIcon className="h-6 w-6" />
                <span>Lead Flow Navigator</span>
              </Link>
            </div>
            <ScrollArea className="flex-1 px-2 py-4">
              <div className="flex flex-col gap-1">
                {sidebarLinks.map((link) => {
                  // No submenu case
                  if (!link.submenu) {
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                          link.isActive && "bg-accent text-accent-foreground"
                        )}
                      >
                        <link.icon className="h-4 w-4" />
                        <span>{link.title}</span>
                      </Link>
                    );
                  }
                  
                  // With submenu case - using Accordion for mobile
                  return (
                    <Accordion type="single" collapsible key={link.href}>
                      <AccordionItem value={link.title} className="border-none">
                        <AccordionTrigger 
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                            (link.submenu.some(item => item.isActive)) && "text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <link.icon className="h-4 w-4" />
                            <span>{link.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-0">
                          <div className="pl-6 space-y-1">
                            {link.submenu.map((sublink) => (
                              <Link
                                key={sublink.href}
                                to={sublink.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:text-foreground",
                                  sublink.isActive && "bg-muted text-foreground"
                                )}
                              >
                                <span>{sublink.title}</span>
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        isOpen ? "w-64" : "w-14"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {isOpen ? (
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <MonitorIcon className="h-6 w-6" />
            <span>Lead Flow Navigator</span>
          </Link>
        ) : (
          <MonitorIcon className="h-6 w-6 mx-auto" />
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {sidebarLinks.map((link) => {
            // No submenu case
            if (!link.submenu) {
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                    link.isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {isOpen && <span>{link.title}</span>}
                </Link>
              );
            }
            
            // With submenu case - only show accordion when sidebar is open
            if (isOpen) {
              return (
                <Accordion type="single" collapsible key={link.href}>
                  <AccordionItem value={link.title} className="border-none">
                    <AccordionTrigger 
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                        (link.submenu.some(item => item.isActive)) && "text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className="h-4 w-4" />
                        <span>{link.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-0">
                      <div className="pl-6 space-y-1">
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.href}
                            to={sublink.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:text-foreground",
                              sublink.isActive && "bg-muted text-foreground"
                            )}
                          >
                            <span>{sublink.title}</span>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }
            
            // When sidebar is collapsed, just show the main link with icon
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all hover:text-foreground",
                  (link.isActive || link.submenu.some(item => item.isActive)) && "bg-accent text-accent-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-center"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
