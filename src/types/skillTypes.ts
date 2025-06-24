
// Sistema de skills para control granular de acceso
export type Skill = 
  | 'dashboard_view'
  | 'leads_management'
  | 'leads_approval'
  | 'user_management'
  | 'role_management'
  | 'monitoring_view'
  | 'monitoring_manage'
  | 'services_view'
  | 'services_manage'
  | 'installer_portal_only'  // Solo acceso al portal de instalador
  | 'custodio_tracking_only' // Solo seguimiento de reclutamiento
  | 'supply_chain_view'
  | 'supply_chain_manage'
  | 'reports_view'
  | 'reports_export'
  | 'settings_view'
  | 'settings_manage'
  | 'wms_view'
  | 'wms_manage'
  | 'tickets_view'
  | 'tickets_manage'
  | 'admin_full_access';

export interface UserSkill {
  id: string;
  user_id: string;
  skill: Skill;
  granted_by: string;
  granted_at: string;
  is_active: boolean;
  expires_at?: string;
}

export interface SkillDefinition {
  skill: Skill;
  name: string;
  description: string;
  category: string;
  requires_skills?: Skill[];
  conflicts_with?: Skill[];
}

// Definiciones predefinidas de skills
export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    skill: 'admin_full_access',
    name: 'Acceso Completo de Administrador',
    description: 'Acceso total al sistema, incluyendo gestión de usuarios y configuración',
    category: 'Administración'
  },
  {
    skill: 'dashboard_view',
    name: 'Ver Dashboard',
    description: 'Acceso para visualizar el dashboard principal',
    category: 'Dashboard'
  },
  {
    skill: 'leads_management',
    name: 'Gestión de Candidatos',
    description: 'Crear, editar y gestionar candidatos en el CRM',
    category: 'Leads'
  },
  {
    skill: 'leads_approval',
    name: 'Aprobación de Candidatos',
    description: 'Aprobar o rechazar candidatos en el proceso de reclutamiento',
    category: 'Leads'
  },
  {
    skill: 'custodio_tracking_only',
    name: 'Seguimiento de Custodio',
    description: 'Solo acceso para hacer seguimiento al proceso de reclutamiento como custodio',
    category: 'Leads',
    conflicts_with: ['leads_management', 'leads_approval']
  },
  {
    skill: 'installer_portal_only',
    name: 'Portal de Instalador',
    description: 'Acceso únicamente al portal de instalación de GPS',
    category: 'Instalación',
    conflicts_with: ['dashboard_view', 'leads_management', 'monitoring_view', 'services_view']
  },
  {
    skill: 'user_management',
    name: 'Gestión de Usuarios',
    description: 'Crear, editar y gestionar usuarios del sistema',
    category: 'Administración'
  },
  {
    skill: 'role_management',
    name: 'Gestión de Roles',
    description: 'Crear y asignar roles y permisos',
    category: 'Administración'
  },
  {
    skill: 'monitoring_view',
    name: 'Ver Monitoreo',
    description: 'Acceso de solo lectura al sistema de monitoreo',
    category: 'Monitoreo'
  },
  {
    skill: 'monitoring_manage',
    name: 'Gestionar Monitoreo',
    description: 'Gestión completa del sistema de monitoreo',
    category: 'Monitoreo',
    requires_skills: ['monitoring_view']
  },
  {
    skill: 'services_view',
    name: 'Ver Servicios',
    description: 'Visualizar servicios y su estado',
    category: 'Servicios'
  },
  {
    skill: 'services_manage',
    name: 'Gestionar Servicios',
    description: 'Crear, editar y gestionar servicios',
    category: 'Servicios',
    requires_skills: ['services_view']
  }
];

// Mapeo de roles tradicionales a skills para migración
export const ROLE_TO_SKILLS_MAPPING: Record<string, Skill[]> = {
  'owner': ['admin_full_access'],
  'admin': ['admin_full_access'],
  'supply_admin': ['dashboard_view', 'leads_management', 'services_manage', 'supply_chain_manage', 'reports_view'],
  'coordinador_operaciones': ['dashboard_view', 'services_manage', 'monitoring_view', 'reports_view'],
  'jefe_seguridad': ['dashboard_view', 'monitoring_manage', 'services_view'],
  'analista_seguridad': ['monitoring_view', 'services_view'],
  'supply_lead': ['supply_chain_manage', 'services_view'],
  'ejecutivo_ventas': ['leads_management', 'dashboard_view'],
  'custodio': ['custodio_tracking_only'],
  'instalador': ['installer_portal_only'],
  'bi': ['dashboard_view', 'reports_view', 'reports_export'],
  'monitoring_supervisor': ['monitoring_manage', 'dashboard_view'],
  'monitoring': ['monitoring_view'],
  'supply': ['supply_chain_view'],
  'soporte': ['services_view', 'tickets_manage'],
  'pending': [],
  'unverified': []
};
