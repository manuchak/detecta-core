
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      title: "Panel Principal",
      icon: Home,
      path: "/dashboard",
    },
    {
      title: "Servicios",
      icon: Car,
      subItems: [
        { title: "Gestión de Servicios", path: "/services" },
        { title: "Rendimiento", path: "/services/rendimiento" },
      ]
    },
    {
      title: "Leads",
      icon: Users,
      path: "/leads",
      subItems: [
        { title: "Aprobaciones", path: "/leads/approvals" },
      ]
    },
    {
      title: "Monitoreo",
      icon: Shield,
      path: "/monitoring",
      subItems: [
        { title: "Supply Chain", path: "/monitoring/supply-chain" },
        { title: "Auditoría Forense", path: "/monitoring/forensic-audit" },
      ]
    },
    {
      title: "Instaladores",
      icon: Wrench,
      path: "/installers",
      subItems: [
        { title: "Programación", path: "/installers/schedule" },
        { title: "Calendario", path: "/installers/calendar" },
        { title: "Portal", path: "/installers/portal" },
      ]
    },
    {
      title: "WMS - GPS",
      icon: Package,
      path: "/wms",
    },
    {
      title: "Tickets",
      icon: MessageSquare,
      path: "/tickets",
    },
    {
      title: "Configuración",
      icon: Settings,
      path: "/settings",
    },
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
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
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
}
