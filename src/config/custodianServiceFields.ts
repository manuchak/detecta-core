// Configuración unificada de campos para servicios de custodia
// Basado en el esquema real de la base de datos

export interface FieldDefinition {
  name: string;
  type: string;
  category: string;
  required: boolean;
  keywords: string[];
  patterns: RegExp[];
  description: string;
}

// Campos de la base de datos organizados por categoría
export const CUSTODIAN_SERVICE_FIELDS: Record<string, FieldDefinition[]> = {
  'Identificación': [
    {
      name: 'id_servicio',
      type: 'text',
      category: 'Identificación',
      required: true,
      keywords: ['id_servicio', 'servicio_id', 'service_id', 'id', 'servicio', 'service'],
      patterns: [/^id[\s_-]*servicio/i, /^servicio[\s_-]*id/i, /^service[\s_-]*id/i],
      description: 'ID único del servicio (requerido)'
    },
    {
      name: 'gm_transport_id',
      type: 'text',
      category: 'Identificación',
      required: false,
      keywords: ['gm_transport_id', 'transport_id', 'gm_id', 'transport', 'gm'],
      patterns: [/gm[\s_-]*transport/i, /transport[\s_-]*id/i],
      description: 'ID de transporte GM'
    },
    {
      name: 'folio_cliente',
      type: 'text',
      category: 'Identificación',
      required: false,
      keywords: ['folio_cliente', 'folio', 'cliente_folio', 'client_folio', 'numero_cliente'],
      patterns: [/folio[\s_-]*cliente/i, /cliente[\s_-]*folio/i],
      description: 'Folio del cliente'
    },
    {
      name: 'id_custodio',
      type: 'text',
      category: 'Identificación',
      required: false,
      keywords: ['id_custodio', 'custodio_id', 'custodian_id', 'custodio'],
      patterns: [/id[\s_-]*custodio/i, /custodio[\s_-]*id/i],
      description: 'ID del custodio'
    },
    {
      name: 'id_cotizacion',
      type: 'text',
      category: 'Identificación',
      required: false,
      keywords: ['id_cotizacion', 'cotizacion_id', 'quote_id', 'cotizacion'],
      patterns: [/id[\s_-]*cotizacion/i, /cotizacion[\s_-]*id/i],
      description: 'ID de la cotización'
    }
  ],
  'Cliente y Servicio': [
    {
      name: 'nombre_cliente',
      type: 'text',
      category: 'Cliente y Servicio',
      required: false,
      keywords: ['nombre_cliente', 'cliente_nombre', 'client_name', 'cliente', 'client'],
      patterns: [/nombre[\s_-]*cliente/i, /cliente[\s_-]*nombre/i],
      description: 'Nombre del cliente'
    },
    {
      name: 'tipo_servicio',
      type: 'text',
      category: 'Cliente y Servicio',
      required: false,
      keywords: ['tipo_servicio', 'service_type', 'tipo', 'servicio_tipo', 'service'],
      patterns: [/tipo[\s_-]*servicio/i, /servicio[\s_-]*tipo/i],
      description: 'Tipo de servicio'
    },
    {
      name: 'estado',
      type: 'text',
      category: 'Cliente y Servicio',
      required: false,
      keywords: ['estado', 'status', 'state', 'situacion'],
      patterns: [/estado/i, /status/i, /situacion/i],
      description: 'Estado del servicio'
    },
    {
      name: 'local_foraneo',
      type: 'text',
      category: 'Cliente y Servicio',
      required: false,
      keywords: ['local_foraneo', 'local', 'foraneo', 'tipo_ubicacion'],
      patterns: [/local[\s_-]*foraneo/i, /foraneo/i],
      description: 'Local o foráneo'
    },
    {
      name: 'ruta',
      type: 'text',
      category: 'Cliente y Servicio',
      required: false,
      keywords: ['ruta', 'route', 'camino'],
      patterns: [/ruta/i, /route/i],
      description: 'Ruta del servicio'
    }
  ],
  'Ubicaciones': [
    {
      name: 'origen',
      type: 'text',
      category: 'Ubicaciones',
      required: false,
      keywords: ['origen', 'origin', 'pickup', 'desde', 'from', 'salida'],
      patterns: [/origen/i, /origin/i, /pickup/i, /desde/i, /salida/i],
      description: 'Punto de origen'
    },
    {
      name: 'destino',
      type: 'text',
      category: 'Ubicaciones',
      required: false,
      keywords: ['destino', 'destination', 'delivery', 'hasta', 'to', 'llegada'],
      patterns: [/destino/i, /destination/i, /delivery/i, /hasta/i, /llegada/i],
      description: 'Punto de destino'
    }
  ],
  'Fechas y Horarios': [
    {
      name: 'fecha_hora_cita',
      type: 'timestamp',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['fecha_hora_cita', 'cita', 'appointment', 'fecha_cita'],
      patterns: [/fecha[\s_-]*hora[\s_-]*cita/i, /cita/i, /appointment/i],
      description: 'Fecha y hora de la cita'
    },
    {
      name: 'fecha_hora_asignacion',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['fecha_hora_asignacion', 'asignacion', 'assignment'],
      patterns: [/fecha[\s_-]*hora[\s_-]*asignacion/i, /asignacion/i],
      description: 'Fecha de asignación'
    },
    {
      name: 'hora_presentacion',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['hora_presentacion', 'presentacion', 'presentation'],
      patterns: [/hora[\s_-]*presentacion/i, /presentacion/i],
      description: 'Hora de presentación'
    },
    {
      name: 'hora_inicio_custodia',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['hora_inicio_custodia', 'inicio_custodia', 'start_custody'],
      patterns: [/hora[\s_-]*inicio[\s_-]*custodia/i, /inicio[\s_-]*custodia/i],
      description: 'Hora de inicio de custodia'
    },
    {
      name: 'hora_arribo',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['hora_arribo', 'arribo', 'arrival'],
      patterns: [/hora[\s_-]*arribo/i, /arribo/i, /arrival/i],
      description: 'Hora de arribo'
    },
    {
      name: 'hora_finalizacion',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['hora_finalizacion', 'finalizacion', 'end', 'completion'],
      patterns: [/hora[\s_-]*finalizacion/i, /finalizacion/i, /completion/i],
      description: 'Hora de finalización'
    },
    {
      name: 'tiempo_punto_origen',
      type: 'text',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['tiempo_punto_origen', 'tiempo_origen', 'origin_time'],
      patterns: [/tiempo[\s_-]*punto[\s_-]*origen/i, /tiempo[\s_-]*origen/i],
      description: 'Tiempo en punto de origen'
    },
    {
      name: 'duracion_servicio',
      type: 'interval',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['duracion_servicio', 'duracion', 'duration', 'tiempo_servicio'],
      patterns: [/duracion[\s_-]*servicio/i, /duracion/i, /duration/i],
      description: 'Duración del servicio'
    },
    {
      name: 'fecha_contratacion',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['fecha_contratacion', 'contratacion', 'contract_date'],
      patterns: [/fecha[\s_-]*contratacion/i, /contratacion/i],
      description: 'Fecha de contratación'
    },
    {
      name: 'fecha_primer_servicio',
      type: 'date',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['fecha_primer_servicio', 'primer_servicio', 'first_service'],
      patterns: [/fecha[\s_-]*primer[\s_-]*servicio/i, /primer[\s_-]*servicio/i],
      description: 'Fecha del primer servicio'
    },
    {
      name: 'created_at',
      type: 'text',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['created_at', 'fecha_creacion', 'creation_date'],
      patterns: [/created[\s_-]*at/i, /fecha[\s_-]*creacion/i],
      description: 'Fecha de creación'
    },
    {
      name: 'updated_time',
      type: 'timestamp',
      category: 'Fechas y Horarios',
      required: false,
      keywords: ['updated_time', 'fecha_actualizacion', 'last_updated', 'modified', 'actualizado'],
      patterns: [/updated[\s_-]*time/i, /fecha[\s_-]*actualizacion/i, /last[\s_-]*updated/i],
      description: 'Fecha de actualización'
    }
  ],
  'Custodio': [
    {
      name: 'nombre_custodio',
      type: 'text',
      category: 'Custodio',
      required: false,
      keywords: ['nombre_custodio', 'custodio_nombre', 'guardian_name', 'custodian_name', 'custodio'],
      patterns: [/nombre[\s_-]*custodio/i, /custodio[\s_-]*nombre/i, /guardian/i],
      description: 'Nombre del custodio'
    },
    {
      name: 'telefono',
      type: 'text',
      category: 'Custodio',
      required: false,
      keywords: ['telefono', 'phone', 'tel', 'celular', 'movil'],
      patterns: [/telefono/i, /phone/i, /^tel$/i, /celular/i],
      description: 'Teléfono del custodio'
    },
    {
      name: 'contacto_emergencia',
      type: 'text',
      category: 'Custodio',
      required: false,
      keywords: ['contacto_emergencia', 'emergencia', 'emergency_contact'],
      patterns: [/contacto[\s_-]*emergencia/i, /emergencia/i, /emergency/i],
      description: 'Contacto de emergencia'
    },
    {
      name: 'telefono_emergencia',
      type: 'text',
      category: 'Custodio',
      required: false,
      keywords: ['telefono_emergencia', 'emergency_phone', 'tel_emergencia'],
      patterns: [/telefono[\s_-]*emergencia/i, /emergency[\s_-]*phone/i],
      description: 'Teléfono de emergencia'
    },
    {
      name: 'proveedor',
      type: 'text',
      category: 'Custodio',
      required: false,
      keywords: ['proveedor', 'provider', 'supplier'],
      patterns: [/proveedor/i, /provider/i, /supplier/i],
      description: 'Proveedor del custodio'
    }
  ],
  'Vehículo y Seguridad': [
    {
      name: 'auto',
      type: 'text',
      category: 'Vehículo y Seguridad',
      required: false,
      keywords: ['auto', 'vehiculo', 'vehicle', 'car'],
      patterns: [/auto/i, /vehiculo/i, /vehicle/i, /car/i],
      description: 'Vehículo'
    },
    {
      name: 'placa',
      type: 'text',
      category: 'Vehículo y Seguridad',
      required: false,
      keywords: ['placa', 'placas', 'license_plate', 'plate'],
      patterns: [/placa/i, /license[\s_-]*plate/i, /plate/i],
      description: 'Placa del vehículo'
    },
    {
      name: 'armado',
      type: 'text',
      category: 'Vehículo y Seguridad',
      required: false,
      keywords: ['armado', 'armed', 'security'],
      patterns: [/armado/i, /armed/i, /security/i],
      description: 'Custodio armado'
    },
    {
      name: 'nombre_armado',
      type: 'text',
      category: 'Vehículo y Seguridad',
      required: false,
      keywords: ['nombre_armado', 'armado_nombre', 'armed_name'],
      patterns: [/nombre[\s_-]*armado/i, /armado[\s_-]*nombre/i],
      description: 'Nombre del custodio armado'
    },
    {
      name: 'telefono_armado',
      type: 'text',
      category: 'Vehículo y Seguridad',
      required: false,
      keywords: ['telefono_armado', 'armado_telefono', 'armed_phone'],
      patterns: [/telefono[\s_-]*armado/i, /armado[\s_-]*telefono/i],
      description: 'Teléfono del custodio armado'
    }
  ],
  'Transporte': [
    {
      name: 'cantidad_transportes',
      type: 'text',
      category: 'Transporte',
      required: false,
      keywords: ['cantidad_transportes', 'num_transportes', 'transport_count'],
      patterns: [/cantidad[\s_-]*transportes/i, /num[\s_-]*transportes/i],
      description: 'Cantidad de transportes'
    },
    {
      name: 'nombre_operador_transporte',
      type: 'text',
      category: 'Transporte',
      required: false,
      keywords: ['nombre_operador_transporte', 'operador_nombre', 'driver_name'],
      patterns: [/nombre[\s_-]*operador[\s_-]*transporte/i, /operador[\s_-]*nombre/i],
      description: 'Nombre del operador de transporte'
    },
    {
      name: 'telefono_operador',
      type: 'text',
      category: 'Transporte',
      required: false,
      keywords: ['telefono_operador', 'operador_telefono', 'driver_phone'],
      patterns: [/telefono[\s_-]*operador/i, /operador[\s_-]*telefono/i],
      description: 'Teléfono del operador'
    },
    {
      name: 'placa_carga',
      type: 'text',
      category: 'Transporte',
      required: false,
      keywords: ['placa_carga', 'carga_placa', 'cargo_plate'],
      patterns: [/placa[\s_-]*carga/i, /carga[\s_-]*placa/i],
      description: 'Placa del vehículo de carga'
    },
    {
      name: 'tipo_unidad',
      type: 'text',
      category: 'Transporte',
      required: false,
      keywords: ['tipo_unidad', 'unit_type', 'vehicle_type'],
      patterns: [/tipo[\s_-]*unidad/i, /unit[\s_-]*type/i],
      description: 'Tipo de unidad'
    },
    {
      name: 'tipo_carga',
      type: 'text',
      category: 'Transporte',
      required: false,
      keywords: ['tipo_carga', 'cargo_type', 'load_type'],
      patterns: [/tipo[\s_-]*carga/i, /cargo[\s_-]*type/i],
      description: 'Tipo de carga'
    }
  ],
  'Equipamiento': [
    {
      name: 'gadget_solicitado',
      type: 'text',
      category: 'Equipamiento',
      required: false,
      keywords: ['gadget_solicitado', 'gadget_requested', 'dispositivo_solicitado'],
      patterns: [/gadget[\s_-]*solicitado/i, /dispositivo[\s_-]*solicitado/i],
      description: 'Gadget solicitado'
    },
    {
      name: 'gadget',
      type: 'text',
      category: 'Equipamiento',
      required: false,
      keywords: ['gadget', 'dispositivo', 'device'],
      patterns: [/gadget/i, /dispositivo/i, /device/i],
      description: 'Gadget asignado'
    },
    {
      name: 'tipo_gadget',
      type: 'text',
      category: 'Equipamiento',
      required: false,
      keywords: ['tipo_gadget', 'gadget_type', 'device_type'],
      patterns: [/tipo[\s_-]*gadget/i, /gadget[\s_-]*type/i],
      description: 'Tipo de gadget'
    }
  ],
  'Métricas': [
    {
      name: 'km_teorico',
      type: 'numeric',
      category: 'Métricas',
      required: false,
      keywords: ['km_teorico', 'theoretical_km', 'km_expected'],
      patterns: [/km[\s_-]*teorico/i, /theoretical[\s_-]*km/i],
      description: 'Kilómetros teóricos'
    },
    {
      name: 'km_recorridos',
      type: 'numeric',
      category: 'Métricas',
      required: false,
      keywords: ['km_recorridos', 'actual_km', 'km_driven', 'kilometers'],
      patterns: [/km[\s_-]*recorridos/i, /actual[\s_-]*km/i, /km[\s_-]*driven/i],
      description: 'Kilómetros recorridos'
    },
    {
      name: 'km_extras',
      type: 'text',
      category: 'Métricas',
      required: false,
      keywords: ['km_extras', 'extra_km', 'additional_km'],
      patterns: [/km[\s_-]*extras/i, /extra[\s_-]*km/i],
      description: 'Kilómetros extras'
    },
    {
      name: 'tiempo_estimado',
      type: 'text',
      category: 'Métricas',
      required: false,
      keywords: ['tiempo_estimado', 'estimated_time', 'eta'],
      patterns: [/tiempo[\s_-]*estimado/i, /estimated[\s_-]*time/i],
      description: 'Tiempo estimado'
    },
    {
      name: 'tiempo_retraso',
      type: 'interval',
      category: 'Métricas',
      required: false,
      keywords: ['tiempo_retraso', 'delay_time', 'retraso'],
      patterns: [/tiempo[\s_-]*retraso/i, /delay[\s_-]*time/i, /retraso/i],
      description: 'Tiempo de retraso'
    },
    {
      name: 'presentacion',
      type: 'text',
      category: 'Métricas',
      required: false,
      keywords: ['presentacion', 'presentation', 'attendance'],
      patterns: [/presentacion/i, /presentation/i, /attendance/i],
      description: 'Presentación'
    }
  ],
  'Financiero': [
    {
      name: 'costo_custodio',
      type: 'text',
      category: 'Financiero',
      required: false,
      keywords: ['costo_custodio', 'custodian_cost', 'guardian_cost'],
      patterns: [/costo[\s_-]*custodio/i, /custodian[\s_-]*cost/i],
      description: 'Costo del custodio'
    },
    {
      name: 'casetas',
      type: 'text',
      category: 'Financiero',
      required: false,
      keywords: ['casetas', 'toll', 'peajes'],
      patterns: [/casetas/i, /toll/i, /peajes/i],
      description: 'Casetas de peaje'
    },
    {
      name: 'cobro_cliente',
      type: 'numeric',
      category: 'Financiero',
      required: false,
      keywords: ['cobro_cliente', 'client_charge', 'amount', 'monto'],
      patterns: [/cobro[\s_-]*cliente/i, /client[\s_-]*charge/i, /amount/i, /monto/i],
      description: 'Cobro al cliente'
    }
  ],
  'Observaciones': [
    {
      name: 'comentarios_adicionales',
      type: 'text',
      category: 'Observaciones',
      required: false,
      keywords: ['comentarios_adicionales', 'comments', 'observations', 'notas'],
      patterns: [/comentarios[\s_-]*adicionales/i, /comments/i, /observations/i, /notas/i],
      description: 'Comentarios adicionales'
    },
    {
      name: 'creado_via',
      type: 'text',
      category: 'Observaciones',
      required: false,
      keywords: ['creado_via', 'created_via', 'source'],
      patterns: [/creado[\s_-]*via/i, /created[\s_-]*via/i, /source/i],
      description: 'Creado vía'
    },
    {
      name: 'creado_por',
      type: 'text',
      category: 'Observaciones',
      required: false,
      keywords: ['creado_por', 'created_by', 'author'],
      patterns: [/creado[\s_-]*por/i, /created[\s_-]*by/i, /author/i],
      description: 'Creado por'
    }
  ]
};

// Función helper para obtener todos los campos como array plano
export function getAllFields(): FieldDefinition[] {
  return Object.values(CUSTODIAN_SERVICE_FIELDS).flat();
}

// Función helper para obtener campos por categoría
export function getFieldsByCategory(category: string): FieldDefinition[] {
  return CUSTODIAN_SERVICE_FIELDS[category] || [];
}

// Función helper para obtener un campo específico por nombre
export function getFieldByName(fieldName: string): FieldDefinition | undefined {
  return getAllFields().find(field => field.name === fieldName);
}

// Función helper para obtener las categorías disponibles
export function getCategories(): string[] {
  return Object.keys(CUSTODIAN_SERVICE_FIELDS);
}

// Función helper para obtener campos requeridos
export function getRequiredFields(): FieldDefinition[] {
  return getAllFields().filter(field => field.required);
}