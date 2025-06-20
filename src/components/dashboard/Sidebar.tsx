
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Shield,
  Ticket,
  FileText,
  MapPin,
  Calendar,
  Wrench,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    servicios: false,
    installers: false,
    monitoring: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Servicios',
      icon: FileText,
      children: [
        {
          title: 'Gestión de Servicios',
          href: '/services',
          icon: FileText,
        },
        {
          title: 'Rendimiento',
          href: '/services/rendimiento',
          icon: TrendingUp,
        }
      ]
    },
    {
      title: 'Instaladores',
      icon: Wrench,
      children: [
        {
          title: 'Gestión',
          href: '/installers',
          icon: Users,
        },
        {
          title: 'Calendario',
          href: '/installers/calendar',
          icon: Calendar,
        },
        {
          title: 'Programación',
          href: '/installers/schedule',
          icon: MapPin,
        },
        {
          title: 'Portal Instalador',
          href: '/installers/portal',
          icon: Activity,
        }
      ]
    },
    {
      title: 'Monitoreo',
      icon: Shield,
      children: [
        {
          title: 'Centro de Control',
          href: '/monitoring',
          icon: Shield,
        },
        {
          title: 'Cadena de Suministro',
          href: '/monitoring/supply-chain',
          icon: BarChart3,
        },
        {
          title: 'Auditoría Forense',
          href: '/monitoring/forensic-audit',
          icon: Shield,
        }
      ]
    },
    {
      title: 'Leads',
      href: '/leads',
      icon: Users,
    },
    {
      title: 'Tickets',
      href: '/tickets',
      icon: Ticket,
    },
    {
      title: 'Configuración',
      href: '/settings',
      icon: Settings,
    },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const hasActiveChild = (children: any[]) => {
    return children?.some(child => isActiveRoute(child.href));
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 h-screen transition-all duration-300 flex flex-col',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="p-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MS</span>
          </div>
          {isOpen && (
            <span className="font-semibold text-xl text-gray-900">
              MonitorSys
            </span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            if (item.children) {
              const sectionKey = item.title.toLowerCase().replace(' ', '');
              const isExpanded = expandedSections[sectionKey];
              const hasActiveChildren = hasActiveChild(item.children);

              return (
                <div key={item.title}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-left font-medium',
                      hasActiveChildren ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    )}
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {isOpen && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                  
                  {isOpen && isExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.href}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'w-full justify-start text-left',
                            isActiveRoute(child.href)
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          )}
                          asChild
                        >
                          <Link to={child.href}>
                            <child.icon className="mr-3 h-4 w-4" />
                            {child.title}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Button
                key={item.title}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left font-medium',
                  isActiveRoute(item.href!)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                )}
                asChild
              >
                <Link to={item.href!}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {isOpen && item.title}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={signOut}
        >
          <Settings className="mr-3 h-4 w-4" />
          {isOpen && 'Cerrar Sesión'}
        </Button>
      </div>
    </div>
  );
};
