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
  BarChart3,
  TrendingUp,
  Rocket,
  Cog,
  TestTube2,
  Globe,
  AlertTriangle,
  Calendar,
  ClipboardList,
  BookOpen,
  GitBranch,
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
  matchPaths?: string[];
  children?: NavigationChild[];
}

export const navigationModules: NavigationModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    children: [
      {
        id: 'dashboard_main',
        label: 'Ejecutivo',
        path: '/dashboard',
        icon: LayoutDashboard
      },
      {
        id: 'dashboard_kpis',
        label: 'KPIs',
        path: '/dashboard/kpis',
        icon: BarChart3
      }
    ]
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
    matchPaths: ['/leads/approvals', '/leads/liberacion', '/leads/evaluaciones'],
    children: [
      {
        id: 'leads_list',
        label: 'Lista de Candidatos',
        path: '/leads',
        icon: UserCheck
      },
      {
        id: 'leads_evaluaciones',
        label: 'Evaluaciones',
        path: '/leads/evaluaciones',
        roles: ['admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones'],
        icon: CheckCircle2
      },
      {
        id: 'leads_approvals',
        label: 'Aprobaciones',
        path: '/leads/approvals',
        roles: ['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead', 'ejecutivo_ventas'],
        matchPaths: ['/leads/approvals'],
        icon: CheckCircle2
      },
      {
        id: 'leads_liberacion',
        label: 'Liberación',
        path: '/leads/liberacion',
        roles: ['admin', 'owner', 'supply_admin', 'supply_lead'],
        matchPaths: ['/leads/liberacion'],
        icon: Rocket
      }
    ]
  },
  {
    id: 'planeacion',
    label: 'Planeación',
    icon: CalendarCheck,
    path: '/planeacion',
    matchPaths: ['/planeacion/reportes'],
    children: [
      {
        id: 'planeacion_dashboard',
        label: 'Dashboard Operacional',
        path: '/planeacion',
        icon: CalendarCheck
      },
      {
        id: 'planeacion_reportes',
        label: 'Reportes',
        path: '/planeacion/reportes',
        roles: ['admin', 'owner'],
        icon: BarChart3
      }
    ]
  },
  {
    id: 'installers',
    label: 'Instaladores',
    icon: Wrench,
    path: '/installers',
    roles: ['admin', 'owner', 'supply_admin', 'coordinador_operaciones'],
    matchPaths: ['/installers/gestion', '/installers/calendar', '/installers/schedule'],
    children: [
      {
        id: 'installers_gestion',
        label: 'Gestión',
        path: '/installers/gestion',
        icon: Users
      },
      {
        id: 'installers_calendario',
        label: 'Calendario',
        path: '/installers/calendar',
        icon: Calendar
      },
      {
        id: 'installers_programacion',
        label: 'Programación',
        path: '/installers/schedule',
        icon: ClipboardList
      }
    ]
  },
  {
    id: 'services',
    label: 'Servicios',
    icon: Wrench,
    path: '/services',
    children: [
      {
        id: 'services_main',
        label: 'General',
        path: '/services',
        icon: Wrench
      },
      {
        id: 'services_rendimiento',
        label: 'Rendimiento',
        path: '/services/rendimiento',
        icon: TrendingUp
      }
    ]
  },
  {
    id: 'monitoring',
    label: 'Monitoreo',
    icon: Activity,
    path: '/monitoring',
    children: [
      {
        id: 'monitoring_general',
        label: 'General',
        path: '/monitoring',
        icon: Activity
      },
      {
        id: 'monitoring_supply',
        label: 'Supply Chain',
        path: '/monitoring/supply-chain',
        icon: Package
      },
      {
        id: 'monitoring_forensic',
        label: 'Auditoría Forense',
        path: '/monitoring/forensic-audit',
        roles: ['admin', 'owner', 'bi'],
        icon: Shield
      },
      {
        id: 'incidentes_rrss',
        label: 'Incidentes RRSS',
        path: '/incidentes-rrss',
        roles: ['admin', 'owner', 'bi', 'monitoring_supervisor'],
        icon: Globe
      }
    ]
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
    id: 'tools',
    label: 'Herramientas',
    icon: Cog,
    path: '/tools',
    roles: ['admin', 'owner'],
    children: [
      {
        id: 'siercp',
        label: 'SIERCP',
        path: '/evaluation/siercp',
        icon: CheckCircle2
      },
      {
        id: 'system_testing',
        label: 'Testing',
        path: '/system-testing',
        icon: TestTube2
      },
      {
        id: 'sandbox_test',
        label: 'Panel Sandbox',
        path: '/sandbox/test-panel',
        icon: TestTube2
      }
    ]
  },
  {
    id: 'administration',
    label: 'Administración',
    icon: Shield,
    path: '/administration',
    roles: ['admin', 'owner', 'bi', 'supply_admin']
  },
  {
    id: 'architecture',
    label: 'Arquitectura',
    icon: BookOpen,
    path: '/architecture',
    children: [
      {
        id: 'arch_overview',
        label: 'Vista General',
        path: '/architecture',
        icon: BookOpen
      },
      {
        id: 'arch_modules',
        label: 'Módulos',
        path: '/architecture',
        icon: GitBranch
      }
    ]
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    path: '/settings'
  }
];
