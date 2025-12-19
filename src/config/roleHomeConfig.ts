import { 
  Users, Calendar, TrendingUp, AlertTriangle, UserPlus, 
  BarChart3, Truck, Package, Settings, Bell, Monitor, 
  Shield, ClipboardList, Wrench, FileText, Map
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type UserRole = 
  | 'owner' 
  | 'admin' 
  | 'supply_admin' 
  | 'supply_lead' 
  | 'ejecutivo_ventas' 
  | 'planificador' 
  | 'monitoring' 
  | 'monitoring_supervisor'
  | 'bi' 
  | 'instalador'
  | 'custodio'
  | 'coordinador_operaciones'
  | 'jefe_seguridad'
  | 'analista_seguridad'
  | 'soporte'
  | 'pending'
  | 'unverified';

export type WidgetType = 
  | 'pendingCandidates'
  | 'activeCustodians'
  | 'monthlyGMV'
  | 'unassignedServices'
  | 'todayServices'
  | 'weekServices'
  | 'completionRate'
  | 'newLeads'
  | 'conversionRate'
  | 'myAssigned'
  | 'activeAlerts'
  | 'vehiclesOnline'
  | 'offlineVehicles'
  | 'pendingInstallations'
  | 'completedInstallations'
  | 'openTickets';

export type HeroType = WidgetType;

export interface HeroConfig {
  type: HeroType;
  title: string;
  description: string;
  cta: { label: string; route: string };
  icon: LucideIcon;
  urgencyThreshold?: { warning: number; critical: number };
}

export interface WidgetConfig {
  type: WidgetType;
  label: string;
  icon?: LucideIcon;
}

export interface ModuleConfig {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  color: string;
}

export interface RoleHomeConfiguration {
  hero?: HeroConfig;
  widgets?: WidgetConfig[];
  modules: string[];
  redirect?: string;
}

// Module definitions
export const MODULES: Record<string, ModuleConfig> = {
  leads: { 
    id: 'leads', 
    label: 'Candidatos', 
    route: '/leads', 
    icon: Users,
    color: 'hsl(var(--chart-2))'
  },
  liberacion: { 
    id: 'liberacion', 
    label: 'Liberación', 
    route: '/leads/liberacion', 
    icon: Shield,
    color: 'hsl(var(--chart-1))'
  },
  planeacion: { 
    id: 'planeacion', 
    label: 'Planeación', 
    route: '/planeacion', 
    icon: Calendar,
    color: 'hsl(var(--chart-3))'
  },
  services: { 
    id: 'services', 
    label: 'Servicios', 
    route: '/services', 
    icon: Truck,
    color: 'hsl(var(--chart-4))'
  },
  monitoring: { 
    id: 'monitoring', 
    label: 'Monitoreo', 
    route: '/monitoring', 
    icon: Monitor,
    color: 'hsl(var(--chart-5))'
  },
  wms: { 
    id: 'wms', 
    label: 'Inventario', 
    route: '/wms', 
    icon: Package,
    color: 'hsl(142, 76%, 36%)'
  },
  reports: { 
    id: 'reports', 
    label: 'Reportes', 
    route: '/dashboard/reports', 
    icon: BarChart3,
    color: 'hsl(262, 83%, 58%)'
  },
  bi: { 
    id: 'bi', 
    label: 'Dashboard BI', 
    route: '/executive-dashboard', 
    icon: TrendingUp,
    color: 'hsl(217, 91%, 60%)'
  },
  tickets: { 
    id: 'tickets', 
    label: 'Tickets', 
    route: '/tickets', 
    icon: Bell,
    color: 'hsl(24, 95%, 53%)'
  },
  installers: { 
    id: 'installers', 
    label: 'Instaladores', 
    route: '/installers/portal', 
    icon: Wrench,
    color: 'hsl(180, 70%, 45%)'
  },
  settings: { 
    id: 'settings', 
    label: 'Configuración', 
    route: '/settings', 
    icon: Settings,
    color: 'hsl(var(--muted-foreground))'
  },
  incidentes: { 
    id: 'incidentes', 
    label: 'Incidentes', 
    route: '/incidentes', 
    icon: AlertTriangle,
    color: 'hsl(0, 84%, 60%)'
  },
  documentation: { 
    id: 'documentation', 
    label: 'Documentos', 
    route: '/documentation', 
    icon: FileText,
    color: 'hsl(200, 70%, 50%)'
  },
  zonas: { 
    id: 'zonas', 
    label: 'Zonas', 
    route: '/monitoring/zonas', 
    icon: Map,
    color: 'hsl(280, 60%, 55%)'
  },
};

// Role configurations
export const ROLE_HOME_CONFIG: Record<UserRole, RoleHomeConfiguration> = {
  // Supply Admin - Gestión de candidatos y operaciones
  supply_admin: {
    hero: {
      type: 'pendingCandidates',
      title: 'Candidatos pendientes',
      description: 'Hay candidatos esperando revisión o aprobación',
      cta: { label: 'Revisar ahora', route: '/leads' },
      icon: Users,
      urgencyThreshold: { warning: 5, critical: 10 }
    },
    widgets: [
      { type: 'activeCustodians', label: 'Activos' },
      { type: 'pendingCandidates', label: 'Pendientes' },
      { type: 'monthlyGMV', label: 'GMV Mes' }
    ],
    modules: ['leads', 'liberacion', 'wms', 'reports', 'bi', 'settings']
  },

  // Supply Lead - Similar a Supply Admin
  supply_lead: {
    hero: {
      type: 'pendingCandidates',
      title: 'Candidatos pendientes',
      description: 'Candidatos en proceso de evaluación',
      cta: { label: 'Gestionar', route: '/leads' },
      icon: Users,
      urgencyThreshold: { warning: 3, critical: 8 }
    },
    widgets: [
      { type: 'activeCustodians', label: 'Activos' },
      { type: 'pendingCandidates', label: 'Pendientes' },
      { type: 'todayServices', label: 'Hoy' }
    ],
    modules: ['leads', 'liberacion', 'wms', 'settings']
  },

  // Planificador - Asignación de servicios
  planificador: {
    hero: {
      type: 'unassignedServices',
      title: 'Servicios sin asignar',
      description: 'Servicios programados sin custodio asignado',
      cta: { label: 'Asignar', route: '/planeacion' },
      icon: Calendar,
      urgencyThreshold: { warning: 3, critical: 8 }
    },
    widgets: [
      { type: 'todayServices', label: 'Hoy' },
      { type: 'weekServices', label: 'Semana' },
      { type: 'completionRate', label: 'Completados' }
    ],
    modules: ['planeacion', 'services', 'monitoring', 'settings']
  },

  // Ejecutivo de Ventas - Leads y conversión
  ejecutivo_ventas: {
    hero: {
      type: 'newLeads',
      title: 'Nuevos candidatos',
      description: 'Candidatos recientes sin contactar',
      cta: { label: 'Contactar', route: '/leads' },
      icon: UserPlus,
      urgencyThreshold: { warning: 5, critical: 12 }
    },
    widgets: [
      { type: 'newLeads', label: 'Esta semana' },
      { type: 'conversionRate', label: 'Conversión' },
      { type: 'myAssigned', label: 'Asignados' }
    ],
    modules: ['leads', 'reports', 'settings']
  },

  // Monitoring - Alertas y vehículos
  monitoring: {
    hero: {
      type: 'activeAlerts',
      title: 'Alertas activas',
      description: 'Vehículos con alertas de geofence o velocidad',
      cta: { label: 'Ver mapa', route: '/monitoring' },
      icon: AlertTriangle,
      urgencyThreshold: { warning: 3, critical: 10 }
    },
    widgets: [
      { type: 'vehiclesOnline', label: 'En línea' },
      { type: 'activeAlerts', label: 'Alertas' },
      { type: 'offlineVehicles', label: 'Sin señal' }
    ],
    modules: ['monitoring', 'services', 'tickets', 'incidentes', 'settings']
  },

  // Monitoring Supervisor
  monitoring_supervisor: {
    hero: {
      type: 'activeAlerts',
      title: 'Alertas del sistema',
      description: 'Monitoreo de alertas y operaciones',
      cta: { label: 'Ver dashboard', route: '/monitoring' },
      icon: Monitor,
      urgencyThreshold: { warning: 5, critical: 15 }
    },
    widgets: [
      { type: 'vehiclesOnline', label: 'En línea' },
      { type: 'activeAlerts', label: 'Alertas' },
      { type: 'todayServices', label: 'Servicios hoy' }
    ],
    modules: ['monitoring', 'services', 'tickets', 'reports', 'settings']
  },

  // BI - Dashboard y análisis
  bi: {
    hero: {
      type: 'monthlyGMV',
      title: 'GMV del mes',
      description: 'Métricas financieras actualizadas',
      cta: { label: 'Ver análisis', route: '/executive-dashboard' },
      icon: TrendingUp
    },
    widgets: [
      { type: 'monthlyGMV', label: 'GMV' },
      { type: 'activeCustodians', label: 'Activos' },
      { type: 'completionRate', label: 'Completados' }
    ],
    modules: ['bi', 'reports', 'monitoring', 'settings']
  },

  // Instalador - Portal dedicado
  instalador: {
    hero: {
      type: 'pendingInstallations',
      title: 'Instalaciones pendientes',
      description: 'Instalaciones programadas para hoy',
      cta: { label: 'Ver agenda', route: '/installers/portal' },
      icon: Wrench,
      urgencyThreshold: { warning: 2, critical: 5 }
    },
    widgets: [
      { type: 'pendingInstallations', label: 'Pendientes' },
      { type: 'completedInstallations', label: 'Completadas' },
      { type: 'todayServices', label: 'Hoy' }
    ],
    modules: ['installers', 'services', 'wms', 'settings']
  },

  // Admin - Vista completa
  admin: {
    hero: {
      type: 'pendingCandidates',
      title: 'Acciones pendientes',
      description: 'Resumen de actividad del sistema',
      cta: { label: 'Ver dashboard', route: '/executive-dashboard' },
      icon: TrendingUp,
      urgencyThreshold: { warning: 10, critical: 20 }
    },
    widgets: [
      { type: 'monthlyGMV', label: 'GMV Mes' },
      { type: 'activeCustodians', label: 'Custodios' },
      { type: 'todayServices', label: 'Servicios' }
    ],
    modules: ['bi', 'leads', 'planeacion', 'monitoring', 'wms', 'settings']
  },

  // Owner - Vista ejecutiva
  owner: {
    hero: {
      type: 'monthlyGMV',
      title: 'Rendimiento del mes',
      description: 'Métricas clave del negocio',
      cta: { label: 'Dashboard ejecutivo', route: '/executive-dashboard' },
      icon: TrendingUp
    },
    widgets: [
      { type: 'monthlyGMV', label: 'GMV' },
      { type: 'activeCustodians', label: 'Custodios' },
      { type: 'completionRate', label: 'Eficiencia' }
    ],
    modules: ['bi', 'reports', 'leads', 'monitoring', 'settings']
  },

  // Coordinador de Operaciones
  coordinador_operaciones: {
    hero: {
      type: 'unassignedServices',
      title: 'Servicios del día',
      description: 'Coordinación de operaciones activas',
      cta: { label: 'Coordinar', route: '/planeacion' },
      icon: ClipboardList,
      urgencyThreshold: { warning: 5, critical: 10 }
    },
    widgets: [
      { type: 'todayServices', label: 'Hoy' },
      { type: 'unassignedServices', label: 'Sin asignar' },
      { type: 'activeAlerts', label: 'Alertas' }
    ],
    modules: ['planeacion', 'services', 'monitoring', 'tickets', 'settings']
  },

  // Jefe de Seguridad
  jefe_seguridad: {
    hero: {
      type: 'activeAlerts',
      title: 'Alertas de seguridad',
      description: 'Estado de seguridad del sistema',
      cta: { label: 'Ver alertas', route: '/monitoring' },
      icon: Shield,
      urgencyThreshold: { warning: 3, critical: 8 }
    },
    widgets: [
      { type: 'activeAlerts', label: 'Alertas' },
      { type: 'vehiclesOnline', label: 'Monitoreo' },
      { type: 'todayServices', label: 'Servicios' }
    ],
    modules: ['monitoring', 'incidentes', 'reports', 'bi', 'settings']
  },

  // Analista de Seguridad
  analista_seguridad: {
    hero: {
      type: 'activeAlerts',
      title: 'Análisis de riesgo',
      description: 'Evaluaciones pendientes de seguridad',
      cta: { label: 'Analizar', route: '/monitoring' },
      icon: Shield,
      urgencyThreshold: { warning: 5, critical: 12 }
    },
    widgets: [
      { type: 'activeAlerts', label: 'Alertas' },
      { type: 'pendingCandidates', label: 'Evaluaciones' },
      { type: 'completionRate', label: 'Completadas' }
    ],
    modules: ['monitoring', 'leads', 'incidentes', 'settings']
  },

  // Soporte
  soporte: {
    hero: {
      type: 'openTickets',
      title: 'Tickets abiertos',
      description: 'Solicitudes de soporte pendientes',
      cta: { label: 'Atender', route: '/tickets' },
      icon: Bell,
      urgencyThreshold: { warning: 5, critical: 15 }
    },
    widgets: [
      { type: 'openTickets', label: 'Abiertos' },
      { type: 'todayServices', label: 'Hoy' },
      { type: 'completionRate', label: 'Resueltos' }
    ],
    modules: ['tickets', 'monitoring', 'services', 'settings']
  },

  // Custodio - Redirige a portal dedicado
  custodio: {
    redirect: '/custodian',
    modules: []
  },

  // Pending/Unverified
  pending: {
    modules: ['settings']
  },
  unverified: {
    modules: ['settings']
  }
};

// Helper to get urgency level
export const getUrgencyLevel = (
  value: number, 
  threshold?: { warning: number; critical: number }
): 'normal' | 'warning' | 'critical' => {
  if (!threshold) return 'normal';
  if (value >= threshold.critical) return 'critical';
  if (value >= threshold.warning) return 'warning';
  return 'normal';
};
