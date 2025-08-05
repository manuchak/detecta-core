export interface EmpresaInstaladora {
  id: string;
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  telefono_principal: string;
  email_principal: string;
  direccion_fiscal?: string;
  cobertura_geografica: string[];
  especialidades: string[];
  estado_contrato: 'activo' | 'inactivo' | 'suspendido';
  tarifas_negociadas: Record<string, any>;
  documentacion_completa: boolean;
  certificaciones: string[];
  años_experiencia?: number;
  capacidad_instaladores?: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactoEmpresa {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  cargo: string;
  telefono: string;
  email: string;
  rol_contacto: 'comercial' | 'tecnico' | 'administrativo' | 'coordinador';
  es_contacto_principal: boolean;
  activo: boolean;
  permisos_acceso: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateEmpresaData {
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  telefono_principal: string;
  email_principal: string;
  direccion_fiscal?: string;
  cobertura_geografica: string[];
  especialidades: string[];
  tarifas_negociadas?: Record<string, any>;
  certificaciones?: string[];
  años_experiencia?: number;
  capacidad_instaladores?: number;
  observaciones?: string;
}

export interface CreateContactoData {
  empresa_id: string;
  nombre_completo: string;
  cargo: string;
  telefono: string;
  email: string;
  rol_contacto: 'comercial' | 'tecnico' | 'administrativo' | 'coordinador';
  es_contacto_principal?: boolean;
  permisos_acceso?: string[];
}