 /**
  * Tipos base para el sistema de checklist de servicios para custodios
  * Sistema offline-first con validación de geolocalización
  */
 
 // ============ ENUMS Y TIPOS BASE ============
 
 export type TipoDocumentoCustodio = 
   | 'licencia_conducir'
   | 'tarjeta_circulacion'
   | 'poliza_seguro'
   | 'verificacion_vehicular'
   | 'credencial_custodia';
 
 export type EstadoChecklist = 'pendiente' | 'completo' | 'incompleto';
 
 export type ValidacionGeo = 'ok' | 'sin_gps' | 'fuera_rango' | 'pendiente';
 
 export type AnguloFoto = 'frontal' | 'trasero' | 'lateral_izq' | 'lateral_der';
 
 export type NivelCombustible = 'lleno' | '3/4' | '1/2' | '1/4' | 'vacio';
 
 // ============ INTERFACES DE DATOS ============
 
 export interface DocumentoCustodio {
   id: string;
   custodio_telefono: string;
   tipo_documento: TipoDocumentoCustodio;
   numero_documento?: string;
   fecha_emision?: string;
   fecha_vigencia: string;
   foto_url?: string;
   verificado: boolean;
   verificado_por?: string;
   fecha_verificacion?: string;
   notas?: string;
   created_at: string;
   updated_at: string;
 }
 
 export interface ItemsInspeccion {
   vehiculo: {
     llantas_ok: boolean | null;
     luces_ok: boolean | null;
     frenos_ok: boolean | null;
     espejos_ok: boolean | null;
     limpiabrisas_ok: boolean | null;
     carroceria_ok: boolean | null;
     nivel_combustible: NivelCombustible | null;
   };
   equipamiento: {
     gato_hidraulico: boolean | null;
     llanta_refaccion: boolean | null;
     triangulos: boolean | null;
     extintor: boolean | null;
   };
 }
 
 export interface FotoValidada {
   angle: AnguloFoto;
   url?: string;
   localBlobId?: string;
   geotag_lat: number | null;
   geotag_lng: number | null;
   distancia_origen_m: number | null;
   validacion: ValidacionGeo;
   captured_at: string;
   capturado_offline: boolean;
 }
 
 export interface ChecklistServicio {
   id: string;
   servicio_id: string;
   custodio_telefono: string;
   fecha_checklist: string;
   fecha_captura_local?: string;
   fecha_sincronizacion?: string;
   estado: EstadoChecklist;
   sincronizado_offline: boolean;
   items_inspeccion: ItemsInspeccion;
   fotos_validadas: FotoValidada[];
   observaciones?: string;
   firma_base64?: string;
   ubicacion_lat?: number;
   ubicacion_lng?: number;
   created_at: string;
   updated_at: string;
 }
 
 // ============ CONSTANTES PARA UI ============
 
 export const DOCUMENTO_LABELS: Record<TipoDocumentoCustodio, string> = {
   licencia_conducir: 'Licencia de Conducir',
   tarjeta_circulacion: 'Tarjeta de Circulación',
   poliza_seguro: 'Póliza de Seguro',
   verificacion_vehicular: 'Verificación Vehicular',
   credencial_custodia: 'Credencial de Custodia'
 };
 
 export const ANGULO_LABELS: Record<AnguloFoto, string> = {
   frontal: 'Frontal',
   trasero: 'Trasero',
   lateral_izq: 'Lateral Izquierdo',
   lateral_der: 'Lateral Derecho'
 };
 
 export const INSPECCION_ITEMS = [
   { key: 'llantas_ok', label: 'Llantas', icon: '🛞' },
   { key: 'luces_ok', label: 'Luces', icon: '💡' },
   { key: 'frenos_ok', label: 'Frenos', icon: '🛑' },
   { key: 'espejos_ok', label: 'Espejos', icon: '🪞' },
   { key: 'limpiabrisas_ok', label: 'Limpiabrisas', icon: '🚿' },
   { key: 'carroceria_ok', label: 'Carrocería', icon: '🚗' },
 ] as const;
 
 export const EQUIPAMIENTO_ITEMS = [
   { key: 'gato_hidraulico', label: 'Gato Hidráulico', icon: '🔧' },
   { key: 'llanta_refaccion', label: 'Llanta de Refacción', icon: '🛞' },
   { key: 'triangulos', label: 'Triángulos', icon: '⚠️' },
   { key: 'extintor', label: 'Extintor', icon: '🧯' },
 ] as const;
 
 export const NIVELES_COMBUSTIBLE: { value: NivelCombustible; label: string }[] = [
   { value: 'lleno', label: 'Lleno' },
   { value: '3/4', label: '3/4' },
   { value: '1/2', label: '1/2' },
   { value: '1/4', label: '1/4' },
   { value: 'vacio', label: 'Vacío' },
 ];
 
 // ============ TIPOS PARA INDEXEDDB (OFFLINE) ============
 
 export interface ChecklistDraft {
   servicioId: string;
   custodioPhone: string;
   items: ItemsInspeccion;
   observaciones: string;
   firma?: string;
   createdAt: string;
   updatedAt: string;
 }
 
 export interface PhotoBlob {
   id: string;
   servicioId: string;
   angle: AnguloFoto;
   blob: Blob;
   mimeType: string;
   geotagLat: number | null;
   geotagLng: number | null;
   distanciaOrigen: number | null;
   validacion: ValidacionGeo;
   capturedAt: string;
 }
 
 export interface SyncQueueItem {
   id: string;
   action: 'upload_photo' | 'save_checklist' | 'update_document';
   payload: Record<string, unknown>;
   attempts: number;
   lastAttempt: string | null;
   createdAt: string;
 }
 
 // ============ VALORES POR DEFECTO ============
 
 export const DEFAULT_ITEMS_INSPECCION: ItemsInspeccion = {
   vehiculo: {
     llantas_ok: null,
     luces_ok: null,
     frenos_ok: null,
     espejos_ok: null,
     limpiabrisas_ok: null,
     carroceria_ok: null,
     nivel_combustible: null
   },
   equipamiento: {
     gato_hidraulico: null,
     llanta_refaccion: null,
     triangulos: null,
     extintor: null
   }
 };
 
 // ============ CONFIGURACIÓN ============
 
 export const GEO_CONFIG = {
   TOLERANCIA_METROS: 500,
   TIMEOUT_GPS_MS: 10000,
   MAX_AGE_GPS_MS: 60000,
 } as const;

// ============ TIPOS PARA MONITOREO ============

export type EstadoChecklistMonitoreo = 'completo' | 'pendiente' | 'incompleto' | 'sin_checklist';

export type TipoAlertaChecklist = 
  | 'sin_checklist_urgente'
  | 'gps_fuera_rango'
  | 'gps_sin_datos'
  | 'item_critico_fallido'
  | 'fotos_incompletas';

export interface AlertaChecklist {
  tipo: TipoAlertaChecklist;
  descripcion: string;
  detalles?: string[];
  severidad: 'critica' | 'alta' | 'media';
}

export interface ServicioConChecklist {
  servicioId: string;
  idServicio: string;
  nombreCliente: string;
  custodioAsignado: string;
  custodioTelefono: string | null;
  fechaHoraCita: string;
  estadoPlaneacion: string;
  origen: string | null;
  destino: string | null;
  // Checklist data
  checklistId: string | null;
  checklistEstado: EstadoChecklistMonitoreo;
  fechaChecklist: string | null;
  fotosValidadas: FotoValidada[];
  itemsInspeccion: ItemsInspeccion | null;
  observaciones: string | null;
  firmaBase64: string | null;
  // Computed
  fotosCount: number;
  alertasGps: number;
  itemsFallidos: string[];
  alertas: AlertaChecklist[];
  tieneAlerta: boolean;
  minutosParaCita: number;
}

export interface ResumenChecklists {
  completos: number;
  pendientes: number;
  sinChecklist: number;
  conAlertas: number;
  total: number;
}

export type FiltroChecklist = 'todos' | 'completos' | 'pendientes' | 'sin_checklist' | 'alertas';