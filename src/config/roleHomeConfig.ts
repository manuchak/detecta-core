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
  | 'customer_success'
  | 'pending'
  | 'unverified';

export type WidgetType = 
  | 'pendingCandidates'
  | 'activeCustodians'
  | 'monthlyGMV'
  | 'monthlyServices'
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
  | 'openTickets'
  // Executive-level widgets with context
  | 'gmvVariation'
  | 'serviceGrowth'
  | 'capacityUtilization'
  // New widgets with full context (subtext)
  | 'monthlyGMVWithContext'
  | 'activeCustodiansWithContext'
  | 'completionRateToday'
  | 'shiftPulse';

export type HeroType = WidgetType | 'businessHealth' | 'criticalAlerts' | 'monthlyTrend';

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
  isContext?: boolean; // Para indicar que es contexto del sistema vs tarea personal
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
  contextWidgets?: WidgetConfig[]; // Widgets de contexto del sistema
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
      title: 'Candidatos en proceso',
      description: 'Candidatos que requieren seguimiento o acción',
      cta: { label: 'Gestionar', route: '/leads' },
      icon: Users,
      urgencyThreshold: { warning: 5, critical: 10 }
    },
    contextWidgets: [
      { type: 'monthlyGMV', label: 'GMV Mes', isContext: true },
      { type: 'activeCustodians', label: 'Custodios Activos', isContext: true },
      { type: 'monthlyServices', label: 'Servicios Mes', isContext: true }
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
    contextWidgets: [
      { type: 'monthlyGMV', label: 'GMV Mes', isContext: true },
      { type: 'activeCustodians', label: 'Custodios Activos', isContext: true },
      { type: 'monthlyServices', label: 'Servicios Mes', isContext: true }
    ],
    modules: ['leads', 'liberacion', 'wms', 'settings']
  },

  // Planificador - Asignación de servicios
  planificador: {
    hero: {
      type: 'unassignedServices',
      title: 'Servicios sin asignar',
      description: 'Servicios programados que requieren custodio',
      cta: { label: 'Asignar', route: '/planeacion' },
      icon: Calendar,
      urgencyThreshold: { warning: 3, critical: 8 }
    },
    contextWidgets: [
      { type: 'todayServices', label: 'Hoy', isContext: true },
      { type: 'weekServices', label: 'Semana', isContext: true },
      { type: 'completionRate', label: 'Completados', isContext: true }
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
    contextWidgets: [
      { type: 'newLeads', label: 'Esta semana', isContext: true },
      { type: 'conversionRate', label: 'Conversión', isContext: true },
      { type: 'myAssigned', label: 'Asignados', isContext: true }
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
    contextWidgets: [
      { type: 'vehiclesOnline', label: 'En línea', isContext: true },
      { type: 'activeAlerts', label: 'Alertas', isContext: true },
      { type: 'offlineVehicles', label: 'Sin señal', isContext: true }
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
    contextWidgets: [
      { type: 'vehiclesOnline', label: 'En línea', isContext: true },
      { type: 'activeAlerts', label: 'Alertas', isContext: true },
      { type: 'todayServices', label: 'Servicios hoy', isContext: true }
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
    contextWidgets: [
      { type: 'monthlyGMV', label: 'GMV', isContext: true },
      { type: 'activeCustodians', label: 'Custodios', isContext: true },
      { type: 'completionRate', label: 'Completados', isContext: true }
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
    contextWidgets: [
      { type: 'pendingInstallations', label: 'Pendientes', isContext: true },
      { type: 'completedInstallations', label: 'Completadas', isContext: true },
      { type: 'todayServices', label: 'Hoy', isContext: true }
    ],
    modules: ['installers', 'services', 'wms', 'settings']
  },

  // Admin/CEO - Vista ejecutiva financiera
  admin: {
    hero: {
      type: 'monthlyTrend',
      title: 'servicios finalizados',
      description: 'Avance mensual hacia la meta del Plan 2026',
      cta: { label: 'Dashboard ejecutivo', route: '/executive-dashboard' },
      icon: TrendingUp
      // Sin urgencyThreshold - métricas financieras no son "urgentes"
    },
    contextWidgets: [
      { type: 'monthlyGMVWithContext', label: 'GMV del Mes', isContext: true },
      { type: 'activeCustodiansWithContext', label: 'Fuerza Activa', isContext: true },
      { type: 'shiftPulse', label: 'Turno Actual', isContext: true }
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
    contextWidgets: [
      { type: 'monthlyGMV', label: 'GMV', isContext: true },
      { type: 'activeCustodians', label: 'Custodios', isContext: true },
      { type: 'monthlyServices', label: 'Servicios', isContext: true }
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
    contextWidgets: [
      { type: 'todayServices', label: 'Hoy', isContext: true },
      { type: 'unassignedServices', label: 'Sin asignar', isContext: true },
      { type: 'activeAlerts', label: 'Alertas', isContext: true }
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
    contextWidgets: [
      { type: 'activeAlerts', label: 'Alertas', isContext: true },
      { type: 'vehiclesOnline', label: 'Monitoreo', isContext: true },
      { type: 'todayServices', label: 'Servicios', isContext: true }
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
    contextWidgets: [
      { type: 'activeAlerts', label: 'Alertas', isContext: true },
      { type: 'pendingCandidates', label: 'Evaluaciones', isContext: true },
      { type: 'completionRate', label: 'Completadas', isContext: true }
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
    contextWidgets: [
      { type: 'openTickets', label: 'Abiertos', isContext: true },
      { type: 'todayServices', label: 'Hoy', isContext: true },
      { type: 'completionRate', label: 'Resueltos', isContext: true }
    ],
    modules: ['tickets', 'monitoring', 'services', 'settings']
  },

  // Customer Success
  customer_success: {
    redirect: '/customer-success',
    modules: ['settings', 'crm', 'lms']
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
