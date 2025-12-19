import { 
  LayoutDashboard,
  Users, 
  UserCheck,
  UserPlus,
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
  Calendar,
  ClipboardList,
  BookOpen,
  GitBranch,
  FileText,
  LucideIcon,
  Radio,
  Headphones
} from 'lucide-react';

// Navigation Groups for visual separation
export interface NavigationGroup {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const navigationGroups: NavigationGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'supply', label: 'Supply & Talento', icon: Users },
  { id: 'operations', label: 'Operaciones', icon: CalendarCheck },
  { id: 'monitoring', label: 'Monitoreo & Soporte', icon: Radio },
  { id: 'system', label: 'Sistema', icon: Settings },
];

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
  group: string; // Reference to navigationGroups.id
}

export const navigationModules: NavigationModule[] = [
  // ===== DASHBOARD GROUP =====
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    group: 'dashboard',
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
      },
      {
        id: 'dashboard_reports',
        label: 'Informes',
        path: '/dashboard/reports',
        icon: FileText,
        roles: ['admin', 'owner', 'bi']
      }
    ]
  },

  // ===== SUPPLY & TALENTO GROUP =====
  {
    id: 'leads',
    label: 'Pipeline',
    icon: UserCheck,
    path: '/leads',
    group: 'supply',
    matchPaths: ['/leads/approvals', '/leads/liberacion', '/leads/evaluaciones'],
    children: [
      {
        id: 'leads_list',
        label: 'Candidatos',
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
      },
      {
        id: 'leads_invitaciones',
        label: 'Invitaciones',
        path: '/admin/custodian-invitations',
        roles: ['admin', 'owner', 'supply_admin', 'supply_lead', 'supply'],
        icon: UserPlus
      }
    ]
  },
  {
    id: 'recruitment',
    label: 'Estrategia',
    icon: TrendingUp,
    path: '/recruitment-strategy',
    group: 'supply',
    roles: ['admin', 'owner', 'manager', 'coordinador_operaciones']
  },

  // ===== OPERACIONES GROUP =====
  {
    id: 'planeacion',
    label: 'Planeación',
    icon: CalendarCheck,
    path: '/planeacion',
    group: 'operations',
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
    id: 'services',
    label: 'Servicios',
    icon: Wrench,
    path: '/services',
    group: 'operations',
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
    id: 'installers',
    label: 'Instaladores',
    icon: Wrench,
    path: '/installers',
    group: 'operations',
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
    id: 'wms',
    label: 'WMS',
    icon: Package,
    path: '/wms',
    group: 'operations',
    roles: ['admin', 'owner', 'monitoring_supervisor', 'monitoring', 'coordinador_operaciones']
  },

  // ===== MONITOREO & SOPORTE GROUP =====
  {
    id: 'monitoring',
    label: 'Monitoreo',
    icon: Activity,
    path: '/monitoring',
    group: 'monitoring',
    children: [
      {
        id: 'monitoring_general',
        label: 'Centro de Control',
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
    id: 'tickets',
    label: 'Tickets',
    icon: Headphones,
    path: '/tickets',
    group: 'monitoring',
    matchPaths: ['/admin/ticket-config', '/admin/ticket-metrics', '/admin/ticket-templates'],
    children: [
      {
        id: 'tickets_list',
        label: 'Lista',
        path: '/tickets',
        icon: Ticket
      },
      {
        id: 'tickets_metrics',
        label: 'Métricas',
        path: '/admin/ticket-metrics',
        roles: ['admin', 'owner', 'bi', 'supply_admin'],
        icon: BarChart3
      },
      {
        id: 'tickets_config',
        label: 'Configuración',
        path: '/admin/ticket-config',
        roles: ['admin', 'owner', 'bi'],
        icon: Settings
      },
      {
        id: 'tickets_templates',
        label: 'Templates',
        path: '/admin/ticket-templates',
        roles: ['admin', 'owner', 'supply_admin'],
        icon: ClipboardList
      }
    ]
  },

  // ===== SISTEMA GROUP =====
  {
    id: 'administration',
    label: 'Administración',
    icon: Shield,
    path: '/administration',
    group: 'system',
    roles: ['admin', 'owner', 'bi', 'supply_admin']
  },
  {
    id: 'tools',
    label: 'Herramientas',
    icon: Cog,
    path: '/tools',
    group: 'system',
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
    id: 'architecture',
    label: 'Documentación',
    icon: BookOpen,
    path: '/architecture',
    group: 'system',
    roles: ['admin', 'owner'],
    children: [
      {
        id: 'arch_overview',
        label: 'Arquitectura',
        path: '/architecture',
        icon: GitBranch
      }
    ]
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    path: '/settings',
    group: 'system'
  }
];

// Helper to get modules by group
export const getModulesByGroup = (groupId: string) => 
  navigationModules.filter(m => m.group === groupId);