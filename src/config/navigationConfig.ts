import { 
  LayoutDashboard,
  Users, 
  UserCheck,
  Wrench,
  Activity,
  Package,
  CalendarCheck,
  Ticket,
  Settings,
  LucideIcon
} from 'lucide-react';

export interface NavigationModule {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  roles?: string[];
  matchPaths?: string[]; // Additional paths that should mark this module as active
}

export const navigationModules: NavigationModule[] = [
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
    id: 'planeacion',
    label: 'Planeación',
    icon: CalendarCheck,
    path: '/planeacion'
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
    id: 'tickets',
    label: 'Tickets',
    icon: Ticket,
    path: '/tickets'
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    path: '/settings'
  }
];
