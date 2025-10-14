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
  Shield,
  CheckCircle2,
  LucideIcon
} from 'lucide-react';

export interface NavigationChild {
  id: string;
  label: string;
  path: string;
  roles?: string[];
  matchPaths?: string[];
  icon?: LucideIcon;
  sandboxReady?: boolean;
}

export interface NavigationModule {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  roles?: string[];
  matchPaths?: string[]; // Additional paths that should mark this module as active
  children?: NavigationChild[];
  sandboxReady?: boolean;
}

export const navigationModules: NavigationModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    sandboxReady: false
  },
  {
    id: 'recruitment',
    label: 'Reclutamiento',
    icon: Users,
    path: '/recruitment-strategy',
    roles: ['admin', 'owner', 'manager', 'coordinador_operaciones'],
    sandboxReady: false
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: UserCheck,
    path: '/leads',
    matchPaths: ['/leads/approvals'],
    sandboxReady: true,
    children: [
      {
        id: 'leads_list',
        label: 'Lista de Candidatos',
        path: '/leads',
        sandboxReady: true
      },
      {
        id: 'leads_approvals',
        label: 'Aprobaciones',
        path: '/leads/approvals',
        roles: ['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead', 'ejecutivo_ventas'],
        matchPaths: ['/leads/approvals'],
        icon: CheckCircle2,
        sandboxReady: true
      }
    ]
  },
  {
    id: 'planeacion',
    label: 'Planeación',
    icon: CalendarCheck,
    path: '/planeacion',
    sandboxReady: false
  },
  {
    id: 'services',
    label: 'Servicios',
    icon: Wrench,
    path: '/services',
    sandboxReady: false
  },
  {
    id: 'monitoring',
    label: 'Monitoreo',
    icon: Activity,
    path: '/monitoring',
    sandboxReady: false
  },
  {
    id: 'wms',
    label: 'WMS',
    icon: Package,
    path: '/wms',
    roles: ['admin', 'owner', 'monitoring_supervisor', 'monitoring', 'coordinador_operaciones'],
    sandboxReady: false
  },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: Ticket,
    path: '/tickets',
    sandboxReady: false
  },
  {
    id: 'administration',
    label: 'Administración',
    icon: Shield,
    path: '/administration',
    roles: ['admin', 'owner', 'bi', 'supply_admin'],
    sandboxReady: false
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    path: '/settings',
    sandboxReady: false
  }
];
