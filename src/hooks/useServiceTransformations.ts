import type { Servicio } from '@/types/planeacion';
import type { PendingService } from './usePendingServices';
import type { EditableService } from '@/components/planeacion/EditServiceModal';

/**
 * Hook para centralizar transformaciones entre tipos de servicio
 * Facilita la migración futura a UnifiedServiceModal
 */
export function useServiceTransformations() {
  const servicioToPending = (servicio: Servicio): PendingService => {
    return {
      id: servicio.id,
      id_servicio: servicio.folio,
      id_interno_cliente: (servicio as any).id_interno_cliente, // Referencia cliente - crítico para facturación
      nombre_cliente: typeof servicio.cliente === 'string' 
        ? servicio.cliente 
        : servicio.cliente?.nombre || '',
      origen: servicio.origen_texto,
      destino: servicio.destino_texto,
      fecha_hora_cita: `${servicio.fecha_programada}T${servicio.hora_ventana_inicio}`,
      tipo_servicio: servicio.tipo_servicio,
      requiere_armado: servicio.requiere_armado || false,
      observaciones: servicio.notas_especiales,
      created_at: servicio.created_at,
      // Normalize: accept both string and object formats
      custodio_asignado: typeof servicio.custodio_asignado === 'string'
        ? servicio.custodio_asignado
        : servicio.custodio_asignado?.nombre,
      armado_asignado: typeof (servicio as any).armado_asignado === 'string'
        ? (servicio as any).armado_asignado
        : (servicio as any).armado_asignado?.nombre || null,
      estado: servicio.estado
    };
  };

  const servicioToEditable = (servicio: Servicio): EditableService => {
    return {
      id: servicio.id,
      id_servicio: servicio.folio,
      id_interno_cliente: (servicio as any).id_interno_cliente,
      nombre_cliente: typeof servicio.cliente === 'string' 
        ? servicio.cliente 
        : servicio.cliente?.nombre || '',
      origen: servicio.origen_texto,
      destino: servicio.destino_texto,
      fecha_hora_cita: `${servicio.fecha_programada}T${servicio.hora_ventana_inicio}`,
      tipo_servicio: servicio.tipo_servicio,
      requiere_armado: servicio.requiere_armado || false,
      // Normalize: accept both string and object formats
      custodio_asignado: typeof servicio.custodio_asignado === 'string'
        ? servicio.custodio_asignado
        : servicio.custodio_asignado?.nombre,
      armado_asignado: typeof (servicio as any).armado_asignado === 'string'
        ? (servicio as any).armado_asignado
        : (servicio as any).armado_asignado?.nombre || null,
      estado_planeacion: servicio.estado,
      observaciones: servicio.notas_especiales
    };
  };

  return {
    servicioToPending,
    servicioToEditable
  };
}
