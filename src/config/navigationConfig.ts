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
}

export interface NavigationModule {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  roles?: string[];
  matchPaths?: string[]; // Additional paths that should mark this module as active
  children?: NavigationChild[];
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
    path: '/leads',
    matchPaths: ['/leads/approvals'],
    children: [
      {
        id: 'leads_list',
        label: 'Lista de Candidatos',
        path: '/leads'
      },
      {
        id: 'leads_approvals',
        label: 'Aprobaciones',
        path: '/leads/approvals',
        roles: ['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead', 'ejecutivo_ventas'],
        matchPaths: ['/leads/approvals'],
        icon: CheckCircle2
      }
    ]
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
    id: 'administration',
    label: 'Administración',
    icon: Shield,
    path: '/administration',
    roles: ['admin', 'owner', 'bi', 'supply_admin']
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    path: '/settings'
  }
];
