import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useArmedGuardsOperativos, ArmedGuardOperativo, ProveedorArmado, ServiceRequestFilters } from './useArmedGuardsOperativos';

export interface ArmedGuard {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  zona_base?: string;
  disponibilidad: string;
  estado: string;
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  experiencia_anos: number;
  rating_promedio: number;
  numero_servicios: number;
  tasa_respuesta: number;
  tasa_confirmacion: number;
  equipamiento_disponible?: string[];
  observaciones?: string;
  fecha_ultimo_servicio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArmedProvider {
  id: string;
  nombre_empresa: string;
  contacto_principal: string;
  telefono_contacto: string;
  email_contacto?: string;
  zonas_cobertura: string[];
  tarifa_por_servicio?: number;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio?: number;
  rating_proveedor: number;
  servicios_completados: number;
  activo: boolean;
  documentacion_legal?: string[];
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceRequest {
  zona_base?: string;
  tipo_servicio?: string;
  incluye_armado?: boolean;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
}

export function useArmedGuardsWithTracking(serviceData?: ServiceRequest) {
  // Convert serviceData to new format
  const filters: ServiceRequestFilters = {
    zona_base: serviceData?.zona_base,
    tipo_servicio: serviceData?.tipo_servicio as 'local' | 'foraneo' | 'alta_seguridad',
    incluye_armado: serviceData?.incluye_armado,
    fecha_programada: serviceData?.fecha_programada,
    hora_ventana_inicio: serviceData?.hora_ventana_inicio
  };

  // Use the optimized hook
  const {
    armedGuards: operativeGuards,
    providers: operativeProviders,
    loading,
    error,
    assignArmedGuard: assignOperativeGuard,
    updateAssignmentStatus: updateOperativeStatus,
    refreshAvailability,
    refetch
  } = useArmedGuardsOperativos(filters);

  // Convert to legacy format for backward compatibility
  const armedGuards: ArmedGuard[] = operativeGuards.filter(g => g.tipo_armado === 'interno').map(guard => ({
    id: guard.id,
    nombre: guard.nombre,
    telefono: guard.telefono,
    email: guard.email,
    zona_base: guard.zona_base,
    disponibilidad: guard.disponibilidad,
    estado: guard.estado,
    licencia_portacion: guard.licencia_portacion,
    fecha_vencimiento_licencia: guard.fecha_vencimiento_licencia,
    experiencia_anos: guard.experiencia_anos,
    rating_promedio: guard.rating_promedio,
    numero_servicios: guard.numero_servicios,
    tasa_respuesta: guard.tasa_respuesta,
    tasa_confirmacion: guard.tasa_confirmacion,
    equipamiento_disponible: guard.equipamiento_disponible,
    observaciones: '',
    fecha_ultimo_servicio: guard.fecha_ultimo_servicio,
    created_at: guard.created_at,
    updated_at: guard.updated_at
  }));

  const providers: ArmedProvider[] = operativeProviders.map(provider => ({
    id: provider.id,
    nombre_empresa: provider.nombre_empresa,
    contacto_principal: provider.contacto_principal,
    telefono_contacto: provider.telefono_contacto,
    email_contacto: provider.email_contacto,
    zonas_cobertura: provider.zonas_cobertura,
    tarifa_por_servicio: provider.tarifa_base_local,
    disponibilidad_24h: provider.disponibilidad_24h,
    tiempo_respuesta_promedio: provider.tiempo_respuesta_promedio,
    rating_proveedor: provider.rating_proveedor,
    servicios_completados: provider.numero_servicios_empresa,
    activo: provider.activo,
    documentacion_legal: provider.documentacion_legal,
    observaciones: provider.observaciones,
    created_at: provider.created_at,
    updated_at: provider.updated_at
  }));

  const assignArmedGuard = async (
    servicioId: string,
    custodioId: string,
    armadoId: string,
    tipoAsignacion: 'interno' | 'proveedor',
    puntoEncuentro: string,
    horaEncuentro: string,
    fechaServicio: string,
    providerId?: string
  ) => {
    return assignOperativeGuard(
      servicioId,
      custodioId,
      armadoId,
      tipoAsignacion,
      puntoEncuentro,
      horaEncuentro,
      fechaServicio,
      providerId
    );
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: 'confirmado' | 'rechazado' | 'completado' | 'cancelado',
    observaciones?: string
  ) => {
    return updateOperativeStatus(assignmentId, status, observaciones);
  };

  return {
    armedGuards,
    providers,
    loading,
    error,
    assignArmedGuard,
    updateAssignmentStatus,
    refreshAvailability,
    refetch
  };
}