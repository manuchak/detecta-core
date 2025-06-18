export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activos_monitoreo: {
        Row: {
          año: number | null
          color: string | null
          created_at: string
          descripcion: string
          edad: number | null
          fecha_instalacion_gps: string | null
          fecha_integracion: string | null
          gps_instalado: boolean | null
          horarios_operacion: Json | null
          id: string
          integrado_sistema: boolean | null
          marca: string | null
          modelo: string | null
          nombre_persona: string | null
          numero_dispositivo: string | null
          numero_motor: string | null
          numero_serie: string | null
          ocupacion: string | null
          placas: string | null
          requiere_gps: boolean | null
          rutas_frecuentes: string[] | null
          servicio_id: string
          telefono_persona: string | null
          tipo_activo: string
          ubicacion_habitual: string | null
          updated_at: string
        }
        Insert: {
          año?: number | null
          color?: string | null
          created_at?: string
          descripcion: string
          edad?: number | null
          fecha_instalacion_gps?: string | null
          fecha_integracion?: string | null
          gps_instalado?: boolean | null
          horarios_operacion?: Json | null
          id?: string
          integrado_sistema?: boolean | null
          marca?: string | null
          modelo?: string | null
          nombre_persona?: string | null
          numero_dispositivo?: string | null
          numero_motor?: string | null
          numero_serie?: string | null
          ocupacion?: string | null
          placas?: string | null
          requiere_gps?: boolean | null
          rutas_frecuentes?: string[] | null
          servicio_id: string
          telefono_persona?: string | null
          tipo_activo: string
          ubicacion_habitual?: string | null
          updated_at?: string
        }
        Update: {
          año?: number | null
          color?: string | null
          created_at?: string
          descripcion?: string
          edad?: number | null
          fecha_instalacion_gps?: string | null
          fecha_integracion?: string | null
          gps_instalado?: boolean | null
          horarios_operacion?: Json | null
          id?: string
          integrado_sistema?: boolean | null
          marca?: string | null
          modelo?: string | null
          nombre_persona?: string | null
          numero_dispositivo?: string | null
          numero_motor?: string | null
          numero_serie?: string | null
          ocupacion?: string | null
          placas?: string | null
          requiere_gps?: boolean | null
          rutas_frecuentes?: string[] | null
          servicio_id?: string
          telefono_persona?: string | null
          tipo_activo?: string
          ubicacion_habitual?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activos_monitoreo_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_riesgo: {
        Row: {
          antecedentes_verificados: boolean | null
          comprobantes_ingresos: boolean | null
          condiciones_especiales: string[] | null
          created_at: string
          detalles_riesgo: Json | null
          documentos_revisados: string[] | null
          evaluado_por: string | null
          fecha_evaluacion: string | null
          fecha_revision: string | null
          historial_crediticio: string | null
          id: string
          incidencia_delictiva: Json | null
          ingresos_declarados: number | null
          metodo_evaluacion: string | null
          nivel_riesgo_cliente: string | null
          nivel_riesgo_zona: string | null
          recomendacion: string | null
          referencias_comerciales: boolean | null
          referencias_verificadas: Json | null
          revisado_por: string | null
          score_riesgo: number | null
          servicio_id: string
          situacion_financiera: string | null
          tiempo_en_actividad: number | null
          tipo_cliente: string | null
          updated_at: string
          zona_operacion: string
        }
        Insert: {
          antecedentes_verificados?: boolean | null
          comprobantes_ingresos?: boolean | null
          condiciones_especiales?: string[] | null
          created_at?: string
          detalles_riesgo?: Json | null
          documentos_revisados?: string[] | null
          evaluado_por?: string | null
          fecha_evaluacion?: string | null
          fecha_revision?: string | null
          historial_crediticio?: string | null
          id?: string
          incidencia_delictiva?: Json | null
          ingresos_declarados?: number | null
          metodo_evaluacion?: string | null
          nivel_riesgo_cliente?: string | null
          nivel_riesgo_zona?: string | null
          recomendacion?: string | null
          referencias_comerciales?: boolean | null
          referencias_verificadas?: Json | null
          revisado_por?: string | null
          score_riesgo?: number | null
          servicio_id: string
          situacion_financiera?: string | null
          tiempo_en_actividad?: number | null
          tipo_cliente?: string | null
          updated_at?: string
          zona_operacion: string
        }
        Update: {
          antecedentes_verificados?: boolean | null
          comprobantes_ingresos?: boolean | null
          condiciones_especiales?: string[] | null
          created_at?: string
          detalles_riesgo?: Json | null
          documentos_revisados?: string[] | null
          evaluado_por?: string | null
          fecha_evaluacion?: string | null
          fecha_revision?: string | null
          historial_crediticio?: string | null
          id?: string
          incidencia_delictiva?: Json | null
          ingresos_declarados?: number | null
          metodo_evaluacion?: string | null
          nivel_riesgo_cliente?: string | null
          nivel_riesgo_zona?: string | null
          recomendacion?: string | null
          referencias_comerciales?: boolean | null
          referencias_verificadas?: Json | null
          revisado_por?: string | null
          score_riesgo?: number | null
          servicio_id?: string
          situacion_financiera?: string | null
          tiempo_en_actividad?: number | null
          tipo_cliente?: string | null
          updated_at?: string
          zona_operacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_riesgo_evaluado_por_fkey"
            columns: ["evaluado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_riesgo_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_riesgo_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_riesgo_seguridad: {
        Row: {
          analista_id: string
          apoyo_externo_autoridades: string | null
          aprobado_seguridad: boolean | null
          calificacion_riesgo: string | null
          controles_actuales_existentes: string[] | null
          created_at: string | null
          dispositivos_seguridad_requeridos: string[] | null
          equipamiento_recomendado: Json | null
          estado_analisis: string
          fecha_analisis: string | null
          frecuencia_uso_rutas: string | null
          historial_incidentes: string | null
          id: string
          medios_comunicacion_cliente: string[] | null
          nivel_exposicion: string | null
          observaciones: string | null
          perfil_usuario: string | null
          puntos_criticos_identificados: string | null
          recomendaciones: string | null
          servicio_id: string
          tipo_activo_proteger: string | null
          tipo_monitoreo_requerido: string | null
          tipo_riesgo_principal: string[] | null
          updated_at: string | null
          zonas_operacion: string[] | null
        }
        Insert: {
          analista_id: string
          apoyo_externo_autoridades?: string | null
          aprobado_seguridad?: boolean | null
          calificacion_riesgo?: string | null
          controles_actuales_existentes?: string[] | null
          created_at?: string | null
          dispositivos_seguridad_requeridos?: string[] | null
          equipamiento_recomendado?: Json | null
          estado_analisis: string
          fecha_analisis?: string | null
          frecuencia_uso_rutas?: string | null
          historial_incidentes?: string | null
          id?: string
          medios_comunicacion_cliente?: string[] | null
          nivel_exposicion?: string | null
          observaciones?: string | null
          perfil_usuario?: string | null
          puntos_criticos_identificados?: string | null
          recomendaciones?: string | null
          servicio_id: string
          tipo_activo_proteger?: string | null
          tipo_monitoreo_requerido?: string | null
          tipo_riesgo_principal?: string[] | null
          updated_at?: string | null
          zonas_operacion?: string[] | null
        }
        Update: {
          analista_id?: string
          apoyo_externo_autoridades?: string | null
          aprobado_seguridad?: boolean | null
          calificacion_riesgo?: string | null
          controles_actuales_existentes?: string[] | null
          created_at?: string | null
          dispositivos_seguridad_requeridos?: string[] | null
          equipamiento_recomendado?: Json | null
          estado_analisis?: string
          fecha_analisis?: string | null
          frecuencia_uso_rutas?: string | null
          historial_incidentes?: string | null
          id?: string
          medios_comunicacion_cliente?: string[] | null
          nivel_exposicion?: string | null
          observaciones?: string | null
          perfil_usuario?: string | null
          puntos_criticos_identificados?: string | null
          recomendaciones?: string | null
          servicio_id?: string
          tipo_activo_proteger?: string | null
          tipo_monitoreo_requerido?: string | null
          tipo_riesgo_principal?: string[] | null
          updated_at?: string | null
          zonas_operacion?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_riesgo_seguridad_analista_id_fkey"
            columns: ["analista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_riesgo_seguridad_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      aprobacion_coordinador: {
        Row: {
          acceso_instalacion_disponible: boolean | null
          cobertura_celular_verificada: boolean | null
          contactos_emergencia_validados: boolean | null
          coordinador_id: string
          created_at: string | null
          elementos_aclarar_cliente: string | null
          estado_aprobacion: string
          fecha_respuesta: string | null
          fecha_revision: string | null
          id: string
          modelo_vehiculo_compatible: boolean | null
          observaciones: string | null
          requiere_instalacion_fisica: boolean | null
          restricciones_tecnicas_sla: boolean | null
          servicio_id: string
          updated_at: string | null
        }
        Insert: {
          acceso_instalacion_disponible?: boolean | null
          cobertura_celular_verificada?: boolean | null
          contactos_emergencia_validados?: boolean | null
          coordinador_id: string
          created_at?: string | null
          elementos_aclarar_cliente?: string | null
          estado_aprobacion: string
          fecha_respuesta?: string | null
          fecha_revision?: string | null
          id?: string
          modelo_vehiculo_compatible?: boolean | null
          observaciones?: string | null
          requiere_instalacion_fisica?: boolean | null
          restricciones_tecnicas_sla?: boolean | null
          servicio_id: string
          updated_at?: string | null
        }
        Update: {
          acceso_instalacion_disponible?: boolean | null
          cobertura_celular_verificada?: boolean | null
          contactos_emergencia_validados?: boolean | null
          coordinador_id?: string
          created_at?: string | null
          elementos_aclarar_cliente?: string | null
          estado_aprobacion?: string
          fecha_respuesta?: string | null
          fecha_revision?: string | null
          id?: string
          modelo_vehiculo_compatible?: boolean | null
          observaciones?: string | null
          requiere_instalacion_fisica?: boolean | null
          restricciones_tecnicas_sla?: boolean | null
          servicio_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aprobacion_coordinador_coordinador_id_fkey"
            columns: ["coordinador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobacion_coordinador_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      aprobaciones_servicio: {
        Row: {
          aprobado_por: string
          condiciones: string[] | null
          created_at: string
          estado: string
          fecha_aprobacion: string
          id: string
          observaciones: string | null
          servicio_id: string
          tipo_aprobacion: string
          vigencia_desde: string | null
          vigencia_hasta: string | null
        }
        Insert: {
          aprobado_por: string
          condiciones?: string[] | null
          created_at?: string
          estado?: string
          fecha_aprobacion?: string
          id?: string
          observaciones?: string | null
          servicio_id: string
          tipo_aprobacion: string
          vigencia_desde?: string | null
          vigencia_hasta?: string | null
        }
        Update: {
          aprobado_por?: string
          condiciones?: string[] | null
          created_at?: string
          estado?: string
          fecha_aprobacion?: string
          id?: string
          observaciones?: string | null
          servicio_id?: string
          tipo_aprobacion?: string
          vigencia_desde?: string | null
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aprobaciones_servicio_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprobaciones_servicio_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          order: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ciudades: {
        Row: {
          activo: boolean
          created_at: string
          estado_id: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          estado_id: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          estado_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciudades_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_bonos_referidos: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          dias_minimos_permanencia: number
          id: string
          monto_bono: number
          nombre: string
          servicios_minimos_requeridos: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          dias_minimos_permanencia?: number
          id?: string
          monto_bono: number
          nombre: string
          servicios_minimos_requeridos?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          dias_minimos_permanencia?: number
          id?: string
          monto_bono?: number
          nombre?: string
          servicios_minimos_requeridos?: number
          updated_at?: string
        }
        Relationships: []
      }
      configuracion_monitoreo: {
        Row: {
          alertas_activadas: boolean | null
          contactos_emergencia: Json
          created_at: string
          escalamiento_config: Json | null
          frecuencia_reporte: number
          geocercas: Json | null
          horario_atencion: Json
          id: string
          servicio_24h: boolean | null
          servicio_id: string
          updated_at: string
        }
        Insert: {
          alertas_activadas?: boolean | null
          contactos_emergencia: Json
          created_at?: string
          escalamiento_config?: Json | null
          frecuencia_reporte?: number
          geocercas?: Json | null
          horario_atencion: Json
          id?: string
          servicio_24h?: boolean | null
          servicio_id: string
          updated_at?: string
        }
        Update: {
          alertas_activadas?: boolean | null
          contactos_emergencia?: Json
          created_at?: string
          escalamiento_config?: Json | null
          frecuencia_reporte?: number
          geocercas?: Json | null
          horario_atencion?: Json
          id?: string
          servicio_24h?: boolean | null
          servicio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_monitoreo_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_reportes: {
        Row: {
          created_at: string | null
          frecuencia_reportes: string
          id: string
          limitantes_protocolos: string | null
          medio_contacto_preferido: string
          observaciones_adicionales: string | null
          servicio_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          frecuencia_reportes: string
          id?: string
          limitantes_protocolos?: string | null
          medio_contacto_preferido: string
          observaciones_adicionales?: string | null
          servicio_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          frecuencia_reportes?: string
          id?: string
          limitantes_protocolos?: string | null
          medio_contacto_preferido?: string
          observaciones_adicionales?: string | null
          servicio_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_reportes_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_sensores: {
        Row: {
          alerta_desconexion_electrica: boolean | null
          bateria_interna_respaldo: boolean | null
          bluetooth_wifi: boolean | null
          boton_panico: boolean | null
          compatibilidad_sensores_rs232: boolean | null
          corte_ignicion_paro_motor: boolean | null
          created_at: string | null
          deteccion_jamming: boolean | null
          geocercas_dinamicas: boolean | null
          id: string
          lectura_obdii_can_bus: boolean | null
          monitoreo_voltaje: boolean | null
          sensor_carga_peso: boolean | null
          sensor_combustible: boolean | null
          sensor_ignicion: boolean | null
          sensor_presencia_vibracion: boolean | null
          sensor_puerta: boolean | null
          sensor_temperatura: boolean | null
          servicio_id: string | null
          updated_at: string | null
        }
        Insert: {
          alerta_desconexion_electrica?: boolean | null
          bateria_interna_respaldo?: boolean | null
          bluetooth_wifi?: boolean | null
          boton_panico?: boolean | null
          compatibilidad_sensores_rs232?: boolean | null
          corte_ignicion_paro_motor?: boolean | null
          created_at?: string | null
          deteccion_jamming?: boolean | null
          geocercas_dinamicas?: boolean | null
          id?: string
          lectura_obdii_can_bus?: boolean | null
          monitoreo_voltaje?: boolean | null
          sensor_carga_peso?: boolean | null
          sensor_combustible?: boolean | null
          sensor_ignicion?: boolean | null
          sensor_presencia_vibracion?: boolean | null
          sensor_puerta?: boolean | null
          sensor_temperatura?: boolean | null
          servicio_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alerta_desconexion_electrica?: boolean | null
          bateria_interna_respaldo?: boolean | null
          bluetooth_wifi?: boolean | null
          boton_panico?: boolean | null
          compatibilidad_sensores_rs232?: boolean | null
          corte_ignicion_paro_motor?: boolean | null
          created_at?: string | null
          deteccion_jamming?: boolean | null
          geocercas_dinamicas?: boolean | null
          id?: string
          lectura_obdii_can_bus?: boolean | null
          monitoreo_voltaje?: boolean | null
          sensor_carga_peso?: boolean | null
          sensor_combustible?: boolean | null
          sensor_ignicion?: boolean | null
          sensor_presencia_vibracion?: boolean | null
          sensor_puerta?: boolean | null
          sensor_temperatura?: boolean | null
          servicio_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_sensores_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_emergencia_servicio: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          orden_prioridad: number | null
          servicio_id: string | null
          telefono: string
          tipo_contacto: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
          orden_prioridad?: number | null
          servicio_id?: string | null
          telefono: string
          tipo_contacto: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          orden_prioridad?: number | null
          servicio_id?: string | null
          telefono?: string
          tipo_contacto?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_emergencia_servicio_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      criterios_evaluacion_financiera: {
        Row: {
          activo: boolean | null
          categoria: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          peso_score: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          peso_score?: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          peso_score?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      custodio_points: {
        Row: {
          created_at: string
          id: string
          level: number
          on_time_rate: number
          points: number
          safety_score: number
          total_trips: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          on_time_rate?: number
          points?: number
          safety_score?: number
          total_trips?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          on_time_rate?: number
          points?: number
          safety_score?: number
          total_trips?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documentacion_requerida: {
        Row: {
          acta_constitutiva: boolean | null
          cedula_fiscal: boolean | null
          comprobante_domicilio: boolean | null
          created_at: string
          curp: string | null
          documentacion_completa: boolean | null
          documentos_adicionales: Json | null
          factura_vehiculo: boolean | null
          fecha_validacion: string | null
          id: string
          identificacion_oficial: boolean | null
          observaciones_documentacion: string | null
          poder_notarial: boolean | null
          poliza_seguro: boolean | null
          rfc: string | null
          servicio_id: string
          tarjeta_circulacion: boolean | null
          updated_at: string
          validado_por: string | null
        }
        Insert: {
          acta_constitutiva?: boolean | null
          cedula_fiscal?: boolean | null
          comprobante_domicilio?: boolean | null
          created_at?: string
          curp?: string | null
          documentacion_completa?: boolean | null
          documentos_adicionales?: Json | null
          factura_vehiculo?: boolean | null
          fecha_validacion?: string | null
          id?: string
          identificacion_oficial?: boolean | null
          observaciones_documentacion?: string | null
          poder_notarial?: boolean | null
          poliza_seguro?: boolean | null
          rfc?: string | null
          servicio_id: string
          tarjeta_circulacion?: boolean | null
          updated_at?: string
          validado_por?: string | null
        }
        Update: {
          acta_constitutiva?: boolean | null
          cedula_fiscal?: boolean | null
          comprobante_domicilio?: boolean | null
          created_at?: string
          curp?: string | null
          documentacion_completa?: boolean | null
          documentos_adicionales?: Json | null
          factura_vehiculo?: boolean | null
          fecha_validacion?: string | null
          id?: string
          identificacion_oficial?: boolean | null
          observaciones_documentacion?: string | null
          poder_notarial?: boolean | null
          poliza_seguro?: boolean | null
          rfc?: string | null
          servicio_id?: string
          tarjeta_circulacion?: boolean | null
          updated_at?: string
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentacion_requerida_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentacion_requerida_validado_por_fkey"
            columns: ["validado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estados: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      evaluaciones_instaladores: {
        Row: {
          calificacion_comunicacion: number
          calificacion_general: number
          calificacion_puntualidad: number
          calificacion_tecnica: number
          comentarios: string | null
          created_at: string | null
          evaluado_por: string
          fortalezas_destacadas: string[] | null
          id: string
          instalacion_id: string
          instalador_id: string
          problemas_reportados: string[] | null
          recomendado: boolean | null
        }
        Insert: {
          calificacion_comunicacion: number
          calificacion_general: number
          calificacion_puntualidad: number
          calificacion_tecnica: number
          comentarios?: string | null
          created_at?: string | null
          evaluado_por: string
          fortalezas_destacadas?: string[] | null
          id?: string
          instalacion_id: string
          instalador_id: string
          problemas_reportados?: string[] | null
          recomendado?: boolean | null
        }
        Update: {
          calificacion_comunicacion?: number
          calificacion_general?: number
          calificacion_puntualidad?: number
          calificacion_tecnica?: number
          comentarios?: string | null
          created_at?: string | null
          evaluado_por?: string
          fortalezas_destacadas?: string[] | null
          id?: string
          instalacion_id?: string
          instalador_id?: string
          problemas_reportados?: string[] | null
          recomendado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_instaladores_instalacion_id_fkey"
            columns: ["instalacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_instaladores_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_services: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          flag_reason: string
          id: string
          original_km: number | null
          original_points: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: string
          status: string | null
          suggested_km: number | null
          suggested_points: number | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          flag_reason: string
          id?: string
          original_km?: number | null
          original_points?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id: string
          status?: string | null
          suggested_km?: number | null
          suggested_points?: number | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          flag_reason?: string
          id?: string
          original_km?: number | null
          original_points?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: string
          status?: string | null
          suggested_km?: number | null
          suggested_points?: number | null
        }
        Relationships: []
      }
      instalaciones_gps: {
        Row: {
          activo_id: string
          created_at: string
          dispositivo_instalado: string | null
          estado: string
          fecha_programada: string
          fecha_realizacion: string | null
          id: string
          numero_serie_dispositivo: string | null
          observaciones_instalacion: string | null
          pruebas_realizadas: boolean | null
          resultado_pruebas: string | null
          servicio_id: string
          tecnico_asignado: string | null
          ubicacion_instalacion: string
          updated_at: string
        }
        Insert: {
          activo_id: string
          created_at?: string
          dispositivo_instalado?: string | null
          estado?: string
          fecha_programada: string
          fecha_realizacion?: string | null
          id?: string
          numero_serie_dispositivo?: string | null
          observaciones_instalacion?: string | null
          pruebas_realizadas?: boolean | null
          resultado_pruebas?: string | null
          servicio_id: string
          tecnico_asignado?: string | null
          ubicacion_instalacion: string
          updated_at?: string
        }
        Update: {
          activo_id?: string
          created_at?: string
          dispositivo_instalado?: string | null
          estado?: string
          fecha_programada?: string
          fecha_realizacion?: string | null
          id?: string
          numero_serie_dispositivo?: string | null
          observaciones_instalacion?: string | null
          pruebas_realizadas?: boolean | null
          resultado_pruebas?: string | null
          servicio_id?: string
          tecnico_asignado?: string | null
          ubicacion_instalacion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instalaciones_gps_activo_id_fkey"
            columns: ["activo_id"]
            isOneToOne: false
            referencedRelation: "activos_monitoreo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instalaciones_gps_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instalaciones_gps_tecnico_asignado_fkey"
            columns: ["tecnico_asignado"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instaladores: {
        Row: {
          banco_datos: Json | null
          calificacion_promedio: number | null
          cedula_profesional: string | null
          certificaciones: string[] | null
          created_at: string | null
          datos_vehiculo: Json | null
          disponibilidad_horaria: Json | null
          documentacion_completa: boolean | null
          email: string
          especialidades: string[] | null
          estado_afiliacion: string | null
          fecha_afiliacion: string | null
          id: string
          nombre_completo: string
          servicios_completados: number | null
          telefono: string
          updated_at: string | null
          user_id: string | null
          vehiculo_propio: boolean | null
          zona_cobertura: Json | null
        }
        Insert: {
          banco_datos?: Json | null
          calificacion_promedio?: number | null
          cedula_profesional?: string | null
          certificaciones?: string[] | null
          created_at?: string | null
          datos_vehiculo?: Json | null
          disponibilidad_horaria?: Json | null
          documentacion_completa?: boolean | null
          email: string
          especialidades?: string[] | null
          estado_afiliacion?: string | null
          fecha_afiliacion?: string | null
          id?: string
          nombre_completo: string
          servicios_completados?: number | null
          telefono: string
          updated_at?: string | null
          user_id?: string | null
          vehiculo_propio?: boolean | null
          zona_cobertura?: Json | null
        }
        Update: {
          banco_datos?: Json | null
          calificacion_promedio?: number | null
          cedula_profesional?: string | null
          certificaciones?: string[] | null
          created_at?: string | null
          datos_vehiculo?: Json | null
          disponibilidad_horaria?: Json | null
          documentacion_completa?: boolean | null
          email?: string
          especialidades?: string[] | null
          estado_afiliacion?: string | null
          fecha_afiliacion?: string | null
          id?: string
          nombre_completo?: string
          servicios_completados?: number | null
          telefono?: string
          updated_at?: string | null
          user_id?: string | null
          vehiculo_propio?: boolean | null
          zona_cobertura?: Json | null
        }
        Relationships: []
      }
      inventario_gps: {
        Row: {
          bateria_estado: number | null
          created_at: string | null
          estado: string | null
          fecha_asignacion: string | null
          fecha_instalacion: string | null
          firmware_version: string | null
          id: string
          instalador_asignado: string | null
          marca: string
          modelo: string
          numero_serie: string
          observaciones: string | null
          servicio_asignado: string | null
          signal_quality: number | null
          tipo_dispositivo: string
          ubicacion_actual: string | null
          ultimo_reporte: string | null
          updated_at: string | null
        }
        Insert: {
          bateria_estado?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_asignacion?: string | null
          fecha_instalacion?: string | null
          firmware_version?: string | null
          id?: string
          instalador_asignado?: string | null
          marca: string
          modelo: string
          numero_serie: string
          observaciones?: string | null
          servicio_asignado?: string | null
          signal_quality?: number | null
          tipo_dispositivo: string
          ubicacion_actual?: string | null
          ultimo_reporte?: string | null
          updated_at?: string | null
        }
        Update: {
          bateria_estado?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_asignacion?: string | null
          fecha_instalacion?: string | null
          firmware_version?: string | null
          id?: string
          instalador_asignado?: string | null
          marca?: string
          modelo?: string
          numero_serie?: string
          observaciones?: string | null
          servicio_asignado?: string | null
          signal_quality?: number | null
          tipo_dispositivo?: string
          ubicacion_actual?: string | null
          ultimo_reporte?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_gps_instalador_asignado_fkey"
            columns: ["instalador_asignado"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_gps_servicio_asignado_fkey"
            columns: ["servicio_asignado"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_approval_process: {
        Row: {
          analyst_id: string
          created_at: string
          current_stage: string
          decision_reason: string | null
          final_decision: string | null
          id: string
          interview_method: string | null
          lead_id: string
          phone_interview_completed: boolean | null
          phone_interview_date: string | null
          phone_interview_notes: string | null
          second_interview_completed: boolean | null
          second_interview_date: string | null
          second_interview_notes: string | null
          second_interview_required: boolean | null
          updated_at: string
        }
        Insert: {
          analyst_id: string
          created_at?: string
          current_stage?: string
          decision_reason?: string | null
          final_decision?: string | null
          id?: string
          interview_method?: string | null
          lead_id: string
          phone_interview_completed?: boolean | null
          phone_interview_date?: string | null
          phone_interview_notes?: string | null
          second_interview_completed?: boolean | null
          second_interview_date?: string | null
          second_interview_notes?: string | null
          second_interview_required?: boolean | null
          updated_at?: string
        }
        Update: {
          analyst_id?: string
          created_at?: string
          current_stage?: string
          decision_reason?: string | null
          final_decision?: string | null
          id?: string
          interview_method?: string | null
          lead_id?: string
          phone_interview_completed?: boolean | null
          phone_interview_date?: string | null
          phone_interview_notes?: string | null
          second_interview_completed?: boolean | null
          second_interview_date?: string | null
          second_interview_notes?: string | null
          second_interview_required?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_approval_process_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_approval_process_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          asignado_a: string | null
          created_at: string
          email: string
          empresa: string | null
          estado: string | null
          fecha_contacto: string | null
          fecha_creacion: string
          fuente: string | null
          id: string
          mensaje: string | null
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          asignado_a?: string | null
          created_at?: string
          email: string
          empresa?: string | null
          estado?: string | null
          fecha_contacto?: string | null
          fecha_creacion?: string
          fuente?: string | null
          id?: string
          mensaje?: string | null
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          asignado_a?: string | null
          created_at?: string
          email?: string
          empresa?: string | null
          estado?: string | null
          fecha_contacto?: string | null
          fecha_creacion?: string
          fuente?: string | null
          id?: string
          mensaje?: string | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marcas_gps: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      marcas_vehiculos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          pais_origen: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          pais_origen?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          pais_origen?: string | null
        }
        Relationships: []
      }
      modelos_gps: {
        Row: {
          activo: boolean | null
          caracteristicas: Json | null
          created_at: string | null
          id: string
          marca_id: string | null
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          caracteristicas?: Json | null
          created_at?: string | null
          id?: string
          marca_id?: string | null
          nombre: string
        }
        Update: {
          activo?: boolean | null
          caracteristicas?: Json | null
          created_at?: string | null
          id?: string
          marca_id?: string | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_gps_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas_gps"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_vehiculos: {
        Row: {
          activo: boolean
          año_fin: number | null
          año_inicio: number | null
          created_at: string
          id: string
          marca_id: string
          nombre: string
          tipo_vehiculo: string | null
        }
        Insert: {
          activo?: boolean
          año_fin?: number | null
          año_inicio?: number | null
          created_at?: string
          id?: string
          marca_id: string
          nombre: string
          tipo_vehiculo?: string | null
        }
        Update: {
          activo?: boolean
          año_fin?: number | null
          año_inicio?: number | null
          created_at?: string
          id?: string
          marca_id?: string
          nombre?: string
          tipo_vehiculo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modelos_vehiculos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas_vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      point_rules: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          point_value: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          point_value: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          point_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      points_history: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points_earned: number
          points_type: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points_earned: number
          points_type: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points_earned?: number
          points_type?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      points_system_config: {
        Row: {
          id: string
          level_names: Json
          level_thresholds: Json
          min_points_for_rewards: number
          points_multiplier: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          level_names?: Json
          level_thresholds?: Json
          min_points_for_rewards?: number
          points_multiplier?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          level_names?: Json
          level_thresholds?: Json
          min_points_for_rewards?: number
          points_multiplier?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_verified: boolean | null
          last_login: string | null
          phone: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id: string
          is_verified?: boolean | null
          last_login?: string | null
          phone?: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          phone?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programacion_instalaciones: {
        Row: {
          acceso_restringido: boolean | null
          activo_id: string | null
          contacto_cliente: string
          coordenadas_instalacion: Json | null
          created_at: string | null
          direccion_instalacion: string
          equipos_requeridos: Json | null
          estado: string | null
          fecha_estimada_fin: string | null
          fecha_programada: string
          herramientas_especiales: string[] | null
          id: string
          instalador_id: string | null
          instrucciones_especiales: string | null
          observaciones_cliente: string | null
          prioridad: string | null
          requiere_vehiculo_elevado: boolean | null
          servicio_id: string
          telefono_contacto: string
          tiempo_estimado: number | null
          tipo_instalacion: string
          updated_at: string | null
        }
        Insert: {
          acceso_restringido?: boolean | null
          activo_id?: string | null
          contacto_cliente: string
          coordenadas_instalacion?: Json | null
          created_at?: string | null
          direccion_instalacion: string
          equipos_requeridos?: Json | null
          estado?: string | null
          fecha_estimada_fin?: string | null
          fecha_programada: string
          herramientas_especiales?: string[] | null
          id?: string
          instalador_id?: string | null
          instrucciones_especiales?: string | null
          observaciones_cliente?: string | null
          prioridad?: string | null
          requiere_vehiculo_elevado?: boolean | null
          servicio_id: string
          telefono_contacto: string
          tiempo_estimado?: number | null
          tipo_instalacion: string
          updated_at?: string | null
        }
        Update: {
          acceso_restringido?: boolean | null
          activo_id?: string | null
          contacto_cliente?: string
          coordenadas_instalacion?: Json | null
          created_at?: string | null
          direccion_instalacion?: string
          equipos_requeridos?: Json | null
          estado?: string | null
          fecha_estimada_fin?: string | null
          fecha_programada?: string
          herramientas_especiales?: string[] | null
          id?: string
          instalador_id?: string | null
          instrucciones_especiales?: string | null
          observaciones_cliente?: string | null
          prioridad?: string | null
          requiere_vehiculo_elevado?: boolean | null
          servicio_id?: string
          telefono_contacto?: string
          tiempo_estimado?: number | null
          tipo_instalacion?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programacion_instalaciones_activo_id_fkey"
            columns: ["activo_id"]
            isOneToOne: false
            referencedRelation: "activos_monitoreo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacion_instalaciones_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacion_instalaciones_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: string
          tracking_code: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          tracking_code?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      referidos: {
        Row: {
          bono_otorgado: boolean
          candidato_referido_id: string
          created_at: string
          custodio_referente_id: string
          estado_referido: string
          fecha_activacion: string | null
          fecha_cumplimiento_requisitos: string | null
          fecha_pago_bono: string | null
          fecha_referencia: string
          id: string
          monto_bono: number | null
          notas: string | null
          updated_at: string
        }
        Insert: {
          bono_otorgado?: boolean
          candidato_referido_id: string
          created_at?: string
          custodio_referente_id: string
          estado_referido?: string
          fecha_activacion?: string | null
          fecha_cumplimiento_requisitos?: string | null
          fecha_pago_bono?: string | null
          fecha_referencia?: string
          id?: string
          monto_bono?: number | null
          notas?: string | null
          updated_at?: string
        }
        Update: {
          bono_otorgado?: boolean
          candidato_referido_id?: string
          created_at?: string
          custodio_referente_id?: string
          estado_referido?: string
          fecha_activacion?: string | null
          fecha_cumplimiento_requisitos?: string | null
          fecha_pago_bono?: string | null
          fecha_referencia?: string
          id?: string
          monto_bono?: number | null
          notas?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referidos_candidato_referido_id_fkey"
            columns: ["candidato_referido_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas_analisis_riesgo: {
        Row: {
          analisis_id: string | null
          created_at: string | null
          criterio_id: string | null
          id: string
          observaciones: string | null
          respuesta: string
          valor_numerico: number | null
        }
        Insert: {
          analisis_id?: string | null
          created_at?: string | null
          criterio_id?: string | null
          id?: string
          observaciones?: string | null
          respuesta: string
          valor_numerico?: number | null
        }
        Update: {
          analisis_id?: string | null
          created_at?: string | null
          criterio_id?: string | null
          id?: string
          observaciones?: string | null
          respuesta?: string
          valor_numerico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_analisis_riesgo_analisis_id_fkey"
            columns: ["analisis_id"]
            isOneToOne: false
            referencedRelation: "analisis_riesgo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_analisis_riesgo_criterio_id_fkey"
            columns: ["criterio_id"]
            isOneToOne: false
            referencedRelation: "criterios_evaluacion_financiera"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          availability: number | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          point_cost: number
          updated_at: string | null
        }
        Insert: {
          availability?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          point_cost: number
          updated_at?: string | null
        }
        Update: {
          availability?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          point_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reward_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission_id: string
          permission_type: string
          role: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission_id: string
          permission_type: string
          role: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission_id?: string
          permission_type?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      seguimiento_instalaciones: {
        Row: {
          calificacion_cliente: number | null
          comentarios_cliente: string | null
          created_at: string | null
          equipos_utilizados: Json | null
          estado_anterior: string | null
          estado_nuevo: string
          evidencia_fotografica: string[] | null
          fecha_fin: string | null
          fecha_inicio: string | null
          firma_cliente: string | null
          id: string
          instalacion_id: string
          instalador_id: string
          observaciones: string | null
          problemas_encontrados: string[] | null
          solucion_aplicada: string | null
          ubicacion_gps: Json | null
        }
        Insert: {
          calificacion_cliente?: number | null
          comentarios_cliente?: string | null
          created_at?: string | null
          equipos_utilizados?: Json | null
          estado_anterior?: string | null
          estado_nuevo: string
          evidencia_fotografica?: string[] | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          firma_cliente?: string | null
          id?: string
          instalacion_id: string
          instalador_id: string
          observaciones?: string | null
          problemas_encontrados?: string[] | null
          solucion_aplicada?: string | null
          ubicacion_gps?: Json | null
        }
        Update: {
          calificacion_cliente?: number | null
          comentarios_cliente?: string | null
          created_at?: string | null
          equipos_utilizados?: Json | null
          estado_anterior?: string | null
          estado_nuevo?: string
          evidencia_fotografica?: string[] | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          firma_cliente?: string | null
          id?: string
          instalacion_id?: string
          instalador_id?: string
          observaciones?: string | null
          problemas_encontrados?: string[] | null
          solucion_aplicada?: string | null
          ubicacion_gps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_instalaciones_instalacion_id_fkey"
            columns: ["instalacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimiento_instalaciones_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_servicio: {
        Row: {
          datos_adicionales: Json | null
          descripcion: string
          estado_anterior: string | null
          estado_nuevo: string | null
          fecha_evento: string
          id: string
          servicio_id: string
          tipo_evento: string
          usuario_id: string
        }
        Insert: {
          datos_adicionales?: Json | null
          descripcion: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha_evento?: string
          id?: string
          servicio_id: string
          tipo_evento: string
          usuario_id: string
        }
        Update: {
          datos_adicionales?: Json | null
          descripcion?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha_evento?: string
          id?: string
          servicio_id?: string
          tipo_evento?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_servicio_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimiento_servicio_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_custodia: {
        Row: {
          armado: string | null
          auto: string | null
          cantidad_transportes: string | null
          casetas: string | null
          cobro_cliente: number | null
          comentarios_adicionales: string | null
          contacto_emergencia: string | null
          costo_custodio: string | null
          creado_por: string | null
          creado_via: string | null
          created_at: string | null
          destino: string | null
          duracion_servicio: unknown | null
          estado: string | null
          fecha_contratacion: string | null
          fecha_hora_asignacion: string | null
          fecha_hora_cita: string | null
          fecha_primer_servicio: string | null
          folio_cliente: string | null
          gadget: string | null
          gadget_solicitado: string | null
          gm_transport_id: string | null
          hora_arribo: string | null
          hora_finalizacion: string | null
          hora_inicio_custodia: string | null
          hora_presentacion: string | null
          id: number | null
          id_cotizacion: string | null
          id_custodio: string | null
          id_servicio: string | null
          km_extras: string | null
          km_recorridos: number | null
          km_teorico: number | null
          local_foraneo: string | null
          nombre_armado: string | null
          nombre_cliente: string | null
          nombre_custodio: string | null
          nombre_operador_adicional: string | null
          nombre_operador_transporte: string | null
          origen: string | null
          placa: string | null
          placa_carga: string | null
          placa_carga_adicional: string | null
          presentacion: string | null
          proveedor: string | null
          ruta: string | null
          telefono: string | null
          telefono_armado: string | null
          telefono_emergencia: string | null
          telefono_operador: string | null
          telefono_operador_adicional: string | null
          tiempo_estimado: string | null
          tiempo_punto_origen: string | null
          tiempo_retraso: unknown | null
          tipo_carga: string | null
          tipo_carga_adicional: string | null
          tipo_gadget: string | null
          tipo_servicio: string | null
          tipo_unidad: string | null
          tipo_unidad_adicional: string | null
          updated_time: string | null
        }
        Insert: {
          armado?: string | null
          auto?: string | null
          cantidad_transportes?: string | null
          casetas?: string | null
          cobro_cliente?: number | null
          comentarios_adicionales?: string | null
          contacto_emergencia?: string | null
          costo_custodio?: string | null
          creado_por?: string | null
          creado_via?: string | null
          created_at?: string | null
          destino?: string | null
          duracion_servicio?: unknown | null
          estado?: string | null
          fecha_contratacion?: string | null
          fecha_hora_asignacion?: string | null
          fecha_hora_cita?: string | null
          fecha_primer_servicio?: string | null
          folio_cliente?: string | null
          gadget?: string | null
          gadget_solicitado?: string | null
          gm_transport_id?: string | null
          hora_arribo?: string | null
          hora_finalizacion?: string | null
          hora_inicio_custodia?: string | null
          hora_presentacion?: string | null
          id?: number | null
          id_cotizacion?: string | null
          id_custodio?: string | null
          id_servicio?: string | null
          km_extras?: string | null
          km_recorridos?: number | null
          km_teorico?: number | null
          local_foraneo?: string | null
          nombre_armado?: string | null
          nombre_cliente?: string | null
          nombre_custodio?: string | null
          nombre_operador_adicional?: string | null
          nombre_operador_transporte?: string | null
          origen?: string | null
          placa?: string | null
          placa_carga?: string | null
          placa_carga_adicional?: string | null
          presentacion?: string | null
          proveedor?: string | null
          ruta?: string | null
          telefono?: string | null
          telefono_armado?: string | null
          telefono_emergencia?: string | null
          telefono_operador?: string | null
          telefono_operador_adicional?: string | null
          tiempo_estimado?: string | null
          tiempo_punto_origen?: string | null
          tiempo_retraso?: unknown | null
          tipo_carga?: string | null
          tipo_carga_adicional?: string | null
          tipo_gadget?: string | null
          tipo_servicio?: string | null
          tipo_unidad?: string | null
          tipo_unidad_adicional?: string | null
          updated_time?: string | null
        }
        Update: {
          armado?: string | null
          auto?: string | null
          cantidad_transportes?: string | null
          casetas?: string | null
          cobro_cliente?: number | null
          comentarios_adicionales?: string | null
          contacto_emergencia?: string | null
          costo_custodio?: string | null
          creado_por?: string | null
          creado_via?: string | null
          created_at?: string | null
          destino?: string | null
          duracion_servicio?: unknown | null
          estado?: string | null
          fecha_contratacion?: string | null
          fecha_hora_asignacion?: string | null
          fecha_hora_cita?: string | null
          fecha_primer_servicio?: string | null
          folio_cliente?: string | null
          gadget?: string | null
          gadget_solicitado?: string | null
          gm_transport_id?: string | null
          hora_arribo?: string | null
          hora_finalizacion?: string | null
          hora_inicio_custodia?: string | null
          hora_presentacion?: string | null
          id?: number | null
          id_cotizacion?: string | null
          id_custodio?: string | null
          id_servicio?: string | null
          km_extras?: string | null
          km_recorridos?: number | null
          km_teorico?: number | null
          local_foraneo?: string | null
          nombre_armado?: string | null
          nombre_cliente?: string | null
          nombre_custodio?: string | null
          nombre_operador_adicional?: string | null
          nombre_operador_transporte?: string | null
          origen?: string | null
          placa?: string | null
          placa_carga?: string | null
          placa_carga_adicional?: string | null
          presentacion?: string | null
          proveedor?: string | null
          ruta?: string | null
          telefono?: string | null
          telefono_armado?: string | null
          telefono_emergencia?: string | null
          telefono_operador?: string | null
          telefono_operador_adicional?: string | null
          tiempo_estimado?: string | null
          tiempo_punto_origen?: string | null
          tiempo_retraso?: unknown | null
          tipo_carga?: string | null
          tipo_carga_adicional?: string | null
          tipo_gadget?: string | null
          tipo_servicio?: string | null
          tipo_unidad?: string | null
          tipo_unidad_adicional?: string | null
          updated_time?: string | null
        }
        Relationships: []
      }
      servicios_monitoreo: {
        Row: {
          cantidad_vehiculos: number | null
          cliente_id: string | null
          condiciones_paro_motor: string | null
          coordinador_operaciones_id: string | null
          created_at: string
          cuenta_boton_panico: boolean | null
          cuenta_gps_instalado: boolean | null
          detalles_gps_actual: string | null
          detalles_zonas_riesgo: string | null
          direccion_cliente: string
          ejecutivo_ventas_id: string | null
          email_contacto: string
          empresa: string | null
          estado_general: string
          fecha_inicio_servicio: string | null
          fecha_limite_respuesta: string | null
          fecha_solicitud: string
          horarios_operacion: Json | null
          id: string
          marca_gps_preferida: string | null
          modelo_gps_preferido: string | null
          modelo_vehiculo: string | null
          nombre_cliente: string
          numero_servicio: string
          observaciones: string | null
          prioridad: string
          requiere_paro_motor: boolean | null
          rutas_habituales: string[] | null
          telefono_contacto: string
          tipo_gps_preferido: string | null
          tipo_servicio: string
          tipo_vehiculo: string | null
          updated_at: string
          zonas_riesgo_identificadas: boolean | null
        }
        Insert: {
          cantidad_vehiculos?: number | null
          cliente_id?: string | null
          condiciones_paro_motor?: string | null
          coordinador_operaciones_id?: string | null
          created_at?: string
          cuenta_boton_panico?: boolean | null
          cuenta_gps_instalado?: boolean | null
          detalles_gps_actual?: string | null
          detalles_zonas_riesgo?: string | null
          direccion_cliente: string
          ejecutivo_ventas_id?: string | null
          email_contacto: string
          empresa?: string | null
          estado_general?: string
          fecha_inicio_servicio?: string | null
          fecha_limite_respuesta?: string | null
          fecha_solicitud?: string
          horarios_operacion?: Json | null
          id?: string
          marca_gps_preferida?: string | null
          modelo_gps_preferido?: string | null
          modelo_vehiculo?: string | null
          nombre_cliente: string
          numero_servicio?: string
          observaciones?: string | null
          prioridad?: string
          requiere_paro_motor?: boolean | null
          rutas_habituales?: string[] | null
          telefono_contacto: string
          tipo_gps_preferido?: string | null
          tipo_servicio: string
          tipo_vehiculo?: string | null
          updated_at?: string
          zonas_riesgo_identificadas?: boolean | null
        }
        Update: {
          cantidad_vehiculos?: number | null
          cliente_id?: string | null
          condiciones_paro_motor?: string | null
          coordinador_operaciones_id?: string | null
          created_at?: string
          cuenta_boton_panico?: boolean | null
          cuenta_gps_instalado?: boolean | null
          detalles_gps_actual?: string | null
          detalles_zonas_riesgo?: string | null
          direccion_cliente?: string
          ejecutivo_ventas_id?: string | null
          email_contacto?: string
          empresa?: string | null
          estado_general?: string
          fecha_inicio_servicio?: string | null
          fecha_limite_respuesta?: string | null
          fecha_solicitud?: string
          horarios_operacion?: Json | null
          id?: string
          marca_gps_preferida?: string | null
          modelo_gps_preferido?: string | null
          modelo_vehiculo?: string | null
          nombre_cliente?: string
          numero_servicio?: string
          observaciones?: string | null
          prioridad?: string
          requiere_paro_motor?: boolean | null
          rutas_habituales?: string[] | null
          telefono_contacto?: string
          tipo_gps_preferido?: string | null
          tipo_servicio?: string
          tipo_vehiculo?: string | null
          updated_at?: string
          zonas_riesgo_identificadas?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "servicios_monitoreo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_monitoreo_coordinador_operaciones_id_fkey"
            columns: ["coordinador_operaciones_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_monitoreo_ejecutivo_ventas_id_fkey"
            columns: ["ejecutivo_ventas_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_limits: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      tipos_monitoreo: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vapi_call_logs: {
        Row: {
          analysis: Json | null
          analyst_id: string
          artifacts: Json | null
          call_status: string | null
          call_type: string | null
          cost_usd: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          lead_id: string
          phone_number: string | null
          recording_url: string | null
          started_at: string | null
          summary: string | null
          transcript: string | null
          updated_at: string
          vapi_assistant_id: string
          vapi_call_id: string | null
        }
        Insert: {
          analysis?: Json | null
          analyst_id: string
          artifacts?: Json | null
          call_status?: string | null
          call_type?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_id: string
          phone_number?: string | null
          recording_url?: string | null
          started_at?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          vapi_assistant_id?: string
          vapi_call_id?: string | null
        }
        Update: {
          analysis?: Json | null
          analyst_id?: string
          artifacts?: Json | null
          call_status?: string | null
          call_type?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_id?: string
          phone_number?: string | null
          recording_url?: string | null
          started_at?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          vapi_assistant_id?: string
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vapi_call_logs_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vapi_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_trabajo: {
        Row: {
          activo: boolean
          ciudad_id: string
          coordenadas: Json | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          ciudad_id: string
          coordenadas?: Json | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          ciudad_id?: string
          coordenadas?: Json | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "zonas_trabajo_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "ciudades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_role: {
        Args: { user_id: string }
        Returns: undefined
      }
      assign_initial_owner: {
        Args: { target_email: string }
        Returns: boolean
      }
      assign_user_role: {
        Args: { target_user_id: string; new_role: string }
        Returns: boolean
      }
      award_points: {
        Args: {
          p_user_id: string
          p_trip_id: string
          p_points: number
          p_type: string
          p_description?: string
        }
        Returns: number
      }
      bypass_rls_get_servicios: {
        Args: { max_records?: number }
        Returns: {
          armado: string | null
          auto: string | null
          cantidad_transportes: string | null
          casetas: string | null
          cobro_cliente: number | null
          comentarios_adicionales: string | null
          contacto_emergencia: string | null
          costo_custodio: string | null
          creado_por: string | null
          creado_via: string | null
          created_at: string | null
          destino: string | null
          duracion_servicio: unknown | null
          estado: string | null
          fecha_contratacion: string | null
          fecha_hora_asignacion: string | null
          fecha_hora_cita: string | null
          fecha_primer_servicio: string | null
          folio_cliente: string | null
          gadget: string | null
          gadget_solicitado: string | null
          gm_transport_id: string | null
          hora_arribo: string | null
          hora_finalizacion: string | null
          hora_inicio_custodia: string | null
          hora_presentacion: string | null
          id: number | null
          id_cotizacion: string | null
          id_custodio: string | null
          id_servicio: string | null
          km_extras: string | null
          km_recorridos: number | null
          km_teorico: number | null
          local_foraneo: string | null
          nombre_armado: string | null
          nombre_cliente: string | null
          nombre_custodio: string | null
          nombre_operador_adicional: string | null
          nombre_operador_transporte: string | null
          origen: string | null
          placa: string | null
          placa_carga: string | null
          placa_carga_adicional: string | null
          presentacion: string | null
          proveedor: string | null
          ruta: string | null
          telefono: string | null
          telefono_armado: string | null
          telefono_emergencia: string | null
          telefono_operador: string | null
          telefono_operador_adicional: string | null
          tiempo_estimado: string | null
          tiempo_punto_origen: string | null
          tiempo_retraso: unknown | null
          tipo_carga: string | null
          tipo_carga_adicional: string | null
          tipo_gadget: string | null
          tipo_servicio: string | null
          tipo_unidad: string | null
          tipo_unidad_adicional: string | null
          updated_time: string | null
        }[]
      }
      bypass_rls_get_servicios_safe: {
        Args: { max_records?: number }
        Returns: {
          armado: string | null
          auto: string | null
          cantidad_transportes: string | null
          casetas: string | null
          cobro_cliente: number | null
          comentarios_adicionales: string | null
          contacto_emergencia: string | null
          costo_custodio: string | null
          creado_por: string | null
          creado_via: string | null
          created_at: string | null
          destino: string | null
          duracion_servicio: unknown | null
          estado: string | null
          fecha_contratacion: string | null
          fecha_hora_asignacion: string | null
          fecha_hora_cita: string | null
          fecha_primer_servicio: string | null
          folio_cliente: string | null
          gadget: string | null
          gadget_solicitado: string | null
          gm_transport_id: string | null
          hora_arribo: string | null
          hora_finalizacion: string | null
          hora_inicio_custodia: string | null
          hora_presentacion: string | null
          id: number | null
          id_cotizacion: string | null
          id_custodio: string | null
          id_servicio: string | null
          km_extras: string | null
          km_recorridos: number | null
          km_teorico: number | null
          local_foraneo: string | null
          nombre_armado: string | null
          nombre_cliente: string | null
          nombre_custodio: string | null
          nombre_operador_adicional: string | null
          nombre_operador_transporte: string | null
          origen: string | null
          placa: string | null
          placa_carga: string | null
          placa_carga_adicional: string | null
          presentacion: string | null
          proveedor: string | null
          ruta: string | null
          telefono: string | null
          telefono_armado: string | null
          telefono_emergencia: string | null
          telefono_operador: string | null
          telefono_operador_adicional: string | null
          tiempo_estimado: string | null
          tiempo_punto_origen: string | null
          tiempo_retraso: unknown | null
          tipo_carga: string | null
          tipo_carga_adicional: string | null
          tipo_gadget: string | null
          tipo_servicio: string | null
          tipo_unidad: string | null
          tipo_unidad_adicional: string | null
          updated_time: string | null
        }[]
      }
      calcular_puntos_viaje: {
        Args: { km_viaje: number; estado_viaje: string }
        Returns: number
      }
      calculate_custodian_level: {
        Args: { total_points: number }
        Returns: number
      }
      calculate_custodian_level_dynamic: {
        Args: { total_points: number }
        Returns: number
      }
      calculate_points_with_validation: {
        Args: {
          p_km_recorridos: number
          p_estado: string
          p_service_id?: string
        }
        Returns: {
          calculated_points: number
          is_flagged: boolean
          flag_reason: string
        }[]
      }
      calculate_punctuality_rate: {
        Args: { p_custodian_name: string }
        Returns: number
      }
      calculate_unified_points: {
        Args: { p_km_recorridos: number; p_estado: string }
        Returns: number
      }
      calculate_user_punctuality_rate: {
        Args: { p_user_id: string }
        Returns: number
      }
      check_admin_for_rewards: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_user_role: {
        Args: { user_id: string; role_name: string }
        Returns: boolean
      }
      check_user_role_no_recursion: {
        Args: { check_user_id: string; role_name: string }
        Returns: boolean
      }
      check_user_role_safe: {
        Args: { check_user_id: string; role_name: string }
        Returns: boolean
      }
      check_user_role_secure: {
        Args: { user_id: string; role_name: string }
        Returns: boolean
      }
      clear_redemptions_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      compare_dashboard_vs_forensic: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          dashboard_value: number
          forensic_value: number
          discrepancy: number
          discrepancy_percent: number
          status: string
        }[]
      }
      create_redemptions_bypass_rls: {
        Args: { redemptions_data: Json }
        Returns: {
          id: string
        }[]
      }
      create_reward_bypass_rls: {
        Args: {
          reward_name: string
          reward_description: string
          reward_point_cost: number
          reward_image_url: string
          reward_category_id: string
          reward_availability: number
          reward_featured: boolean
        }
        Returns: string
      }
      create_test_trips_for_user: {
        Args: { p_user_id: string; p_user_phone: string; p_user_name: string }
        Returns: number
      }
      create_vapi_call_log: {
        Args: {
          p_lead_id: string
          p_vapi_call_id: string
          p_phone_number: string
        }
        Returns: string
      }
      current_user_is_coordinator_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      delete_reward_bypass_rls: {
        Args: { reward_id: string }
        Returns: boolean
      }
      detect_suspicious_patterns: {
        Args: Record<PropertyKey, never>
        Returns: {
          pattern_type: string
          pattern_description: string
          count_found: number
          severity: string
          sample_data: string
        }[]
      }
      diagnose_phone_services: {
        Args: { p_phone: string }
        Returns: {
          found_services: number
          sample_service_id: string
          sample_custodian: string
          sample_phone: string
          sample_estado: string
          distinct_phones: string[]
          phone_variations: string[]
        }[]
      }
      ensure_admin_privileges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_default_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      es_usuario_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      flag_service_for_review: {
        Args: {
          p_service_id: string
          p_flag_reason: string
          p_original_km: number
          p_suggested_km: number
          p_original_points: number
          p_suggested_points: number
        }
        Returns: string
      }
      forensic_audit_servicios_enero_actual: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_registros_raw: number
          registros_con_fecha_valida: number
          registros_enero_actual: number
          servicios_unicos_id: number
          registros_duplicados_id: number
          registros_sin_id: number
          estados_distintos: number
          servicios_finalizado_exact: number
          servicios_completado: number
          servicios_pendientes: number
          servicios_cancelados: number
          servicios_estado_null: number
          servicios_estado_vacio: number
          registros_con_cobro_valido: number
          registros_con_cobro_zero: number
          registros_con_cobro_null: number
          gmv_total_sin_filtros: number
          gmv_solo_finalizados: number
          gmv_solo_completados: number
          custodios_distintos: number
          registros_sin_custodio: number
          custodios_con_hash_na: number
          clientes_distintos: number
          registros_sin_cliente: number
          registros_con_origen: number
          registros_con_destino: number
          registros_con_ruta_completa: number
          fecha_mas_antigua: string
          fecha_mas_reciente: string
          registros_fuera_rango: number
        }[]
      }
      get_active_custodians_count: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          custodians: string[]
        }[]
      }
      get_all_recent_trips: {
        Args: { days_back?: number }
        Returns: {
          armado: string | null
          auto: string | null
          cantidad_transportes: string | null
          casetas: string | null
          cobro_cliente: number | null
          comentarios_adicionales: string | null
          contacto_emergencia: string | null
          costo_custodio: string | null
          creado_por: string | null
          creado_via: string | null
          created_at: string | null
          destino: string | null
          duracion_servicio: unknown | null
          estado: string | null
          fecha_contratacion: string | null
          fecha_hora_asignacion: string | null
          fecha_hora_cita: string | null
          fecha_primer_servicio: string | null
          folio_cliente: string | null
          gadget: string | null
          gadget_solicitado: string | null
          gm_transport_id: string | null
          hora_arribo: string | null
          hora_finalizacion: string | null
          hora_inicio_custodia: string | null
          hora_presentacion: string | null
          id: number | null
          id_cotizacion: string | null
          id_custodio: string | null
          id_servicio: string | null
          km_extras: string | null
          km_recorridos: number | null
          km_teorico: number | null
          local_foraneo: string | null
          nombre_armado: string | null
          nombre_cliente: string | null
          nombre_custodio: string | null
          nombre_operador_adicional: string | null
          nombre_operador_transporte: string | null
          origen: string | null
          placa: string | null
          placa_carga: string | null
          placa_carga_adicional: string | null
          presentacion: string | null
          proveedor: string | null
          ruta: string | null
          telefono: string | null
          telefono_armado: string | null
          telefono_emergencia: string | null
          telefono_operador: string | null
          telefono_operador_adicional: string | null
          tiempo_estimado: string | null
          tiempo_punto_origen: string | null
          tiempo_retraso: unknown | null
          tipo_carga: string | null
          tipo_carga_adicional: string | null
          tipo_gadget: string | null
          tipo_servicio: string | null
          tipo_unidad: string | null
          tipo_unidad_adicional: string | null
          updated_time: string | null
        }[]
      }
      get_all_redemptions_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          reward_id: string
          points_spent: number
          status: string
          admin_notes: string
          created_at: string
          reward: Json
          custodian_name: string
          custodian_phone: string
        }[]
      }
      get_all_rewards: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          point_cost: number
          image_url: string
          category: string
          availability: number
          featured: boolean
          created_at: string
          updated_at: string
          category_id: string
        }[]
      }
      get_all_user_roles_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          role: string
        }[]
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          display_name: string
          phone: string
          photo_url: string
          is_verified: boolean
          last_sign_in_at: string
          created_at: string
          user_roles: string[]
        }[]
      }
      get_analyst_assigned_leads: {
        Args: Record<PropertyKey, never>
        Returns: {
          lead_id: string
          lead_nombre: string
          lead_email: string
          lead_telefono: string
          lead_estado: string
          lead_fecha_creacion: string
          approval_stage: string
          phone_interview_completed: boolean
          second_interview_required: boolean
          final_decision: string
        }[]
      }
      get_available_roles_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
        }[]
      }
      get_ciudades_safe: {
        Args: { estado_uuid: string }
        Returns: {
          id: string
          nombre: string
          estado_id: string
        }[]
      }
      get_current_user_ranking_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          posicion: number
          total_custodios: number
          puntos_totales: number
          total_viajes: number
          km_totales: number
          nombre_custodio: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_roles_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
        }[]
      }
      get_custodian_full_stats: {
        Args: { p_custodio_id: string }
        Returns: {
          total_viajes: number
          viajes_completados: number
          viajes_pendientes: number
          km_totales: number
          puntos_totales: number
          nivel: number
          viajes_mes_actual: number
          puntos_mes_actual: number
        }[]
      }
      get_custodian_performance_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          nombre_custodio: string
          total_viajes: number
          puntos_totales: number
          km_totales: number
          posicion: number
        }[]
      }
      get_custodian_performance_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          nombre_custodio: string
          total_viajes: number
          puntos_totales: number
          km_totales: number
          posicion: number
        }[]
      }
      get_custodian_performance_unified: {
        Args: Record<PropertyKey, never>
        Returns: {
          nombre_custodio: string
          total_viajes: number
          puntos_totales: number
          km_totales: number
          posicion: number
        }[]
      }
      get_custodian_services: {
        Args: { custodian_name: string }
        Returns: {
          id_servicio: string
          origen: string
          destino: string
          fecha_hora_cita: string
          estado: string
          km_recorridos: number
          nombre_cliente: string
          tipo_servicio: string
        }[]
      }
      get_custodian_services_with_points: {
        Args: { p_custodian_name: string }
        Returns: {
          id_servicio: string
          origen: string
          destino: string
          fecha_hora_cita: string
          estado: string
          km_recorridos: number
          puntos_ganados: number
          nombre_cliente: string
          tipo_servicio: string
          is_flagged: boolean
          flag_reason: string
        }[]
      }
      get_custodians_levels_and_average: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_custodians: number
          average_level: number
          level_1_count: number
          level_2_count: number
          level_3_count: number
          level_4_count: number
          level_5_count: number
        }[]
      }
      get_custodios_activos_safe: {
        Args: { search_term?: string }
        Returns: {
          nombre_custodio: string
          telefono: string
          total_servicios: number
        }[]
      }
      get_estados_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nombre: string
          codigo: string
        }[]
      }
      get_finalized_services_data_secure: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_services: number
          total_gmv: number
          service_count: number
        }[]
      }
      get_gmv_chart_data_secure: {
        Args: { max_records?: number }
        Returns: {
          armado: string | null
          auto: string | null
          cantidad_transportes: string | null
          casetas: string | null
          cobro_cliente: number | null
          comentarios_adicionales: string | null
          contacto_emergencia: string | null
          costo_custodio: string | null
          creado_por: string | null
          creado_via: string | null
          created_at: string | null
          destino: string | null
          duracion_servicio: unknown | null
          estado: string | null
          fecha_contratacion: string | null
          fecha_hora_asignacion: string | null
          fecha_hora_cita: string | null
          fecha_primer_servicio: string | null
          folio_cliente: string | null
          gadget: string | null
          gadget_solicitado: string | null
          gm_transport_id: string | null
          hora_arribo: string | null
          hora_finalizacion: string | null
          hora_inicio_custodia: string | null
          hora_presentacion: string | null
          id: number | null
          id_cotizacion: string | null
          id_custodio: string | null
          id_servicio: string | null
          km_extras: string | null
          km_recorridos: number | null
          km_teorico: number | null
          local_foraneo: string | null
          nombre_armado: string | null
          nombre_cliente: string | null
          nombre_custodio: string | null
          nombre_operador_adicional: string | null
          nombre_operador_transporte: string | null
          origen: string | null
          placa: string | null
          placa_carga: string | null
          placa_carga_adicional: string | null
          presentacion: string | null
          proveedor: string | null
          ruta: string | null
          telefono: string | null
          telefono_armado: string | null
          telefono_emergencia: string | null
          telefono_operador: string | null
          telefono_operador_adicional: string | null
          tiempo_estimado: string | null
          tiempo_punto_origen: string | null
          tiempo_retraso: unknown | null
          tipo_carga: string | null
          tipo_carga_adicional: string | null
          tipo_gadget: string | null
          tipo_servicio: string | null
          tipo_unidad: string | null
          tipo_unidad_adicional: string | null
          updated_time: string | null
        }[]
      }
      get_instaladores_disponibles: {
        Args: { p_fecha: string; p_zona?: Json; p_tipo_instalacion?: string }
        Returns: {
          id: string
          nombre_completo: string
          telefono: string
          calificacion_promedio: number
          servicios_completados: number
          especialidades: string[]
          disponible: boolean
        }[]
      }
      get_marcas_vehiculos_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nombre: string
          pais_origen: string
        }[]
      }
      get_modelos_por_marca: {
        Args: { p_marca_nombre: string }
        Returns: {
          id: string
          nombre: string
          tipo_vehiculo: string
        }[]
      }
      get_modelos_por_marca_safe: {
        Args: { p_marca_nombre: string }
        Returns: {
          id: string
          nombre: string
          tipo_vehiculo: string
        }[]
      }
      get_points_system_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          points_multiplier: number
          min_points_for_rewards: number
          level_thresholds: Json
          level_names: Json
          updated_at: string
        }[]
      }
      get_profiles_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_verified: boolean | null
          last_login: string | null
          phone: string
          photo_url: string | null
          updated_at: string
        }[]
      }
      get_redemptions_with_custodian_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          redemption_id: string
          user_id: string
          reward_id: string
          points_spent: number
          status: string
          admin_notes: string
          created_at: string
          reward_name: string
          reward_description: string
          reward_point_cost: number
          custodian_name: string
          custodian_phone: string
          custodian_total_points: number
          custodian_level: number
        }[]
      }
      get_reward_categories_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          icon: string
          color: string
          is_active: boolean
          display_order: number
          total_rewards: number
          active_rewards: number
          total_redemptions: number
        }[]
      }
      get_reward_image_url: {
        Args: { image_path: string }
        Returns: string
      }
      get_rewards_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability: number | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          point_cost: number
          updated_at: string | null
        }[]
      }
      get_rewards_with_category: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          point_cost: number
          image_url: string
          availability: number
          featured: boolean
          created_at: string
          category_name: string
          category_color: string
          category_icon: string
        }[]
      }
      get_services_by_exact_phone: {
        Args: { p_phone: string }
        Returns: {
          armado: string | null
          auto: string | null
          cantidad_transportes: string | null
          casetas: string | null
          cobro_cliente: number | null
          comentarios_adicionales: string | null
          contacto_emergencia: string | null
          costo_custodio: string | null
          creado_por: string | null
          creado_via: string | null
          created_at: string | null
          destino: string | null
          duracion_servicio: unknown | null
          estado: string | null
          fecha_contratacion: string | null
          fecha_hora_asignacion: string | null
          fecha_hora_cita: string | null
          fecha_primer_servicio: string | null
          folio_cliente: string | null
          gadget: string | null
          gadget_solicitado: string | null
          gm_transport_id: string | null
          hora_arribo: string | null
          hora_finalizacion: string | null
          hora_inicio_custodia: string | null
          hora_presentacion: string | null
          id: number | null
          id_cotizacion: string | null
          id_custodio: string | null
          id_servicio: string | null
          km_extras: string | null
          km_recorridos: number | null
          km_teorico: number | null
          local_foraneo: string | null
          nombre_armado: string | null
          nombre_cliente: string | null
          nombre_custodio: string | null
          nombre_operador_adicional: string | null
          nombre_operador_transporte: string | null
          origen: string | null
          placa: string | null
          placa_carga: string | null
          placa_carga_adicional: string | null
          presentacion: string | null
          proveedor: string | null
          ruta: string | null
          telefono: string | null
          telefono_armado: string | null
          telefono_emergencia: string | null
          telefono_operador: string | null
          telefono_operador_adicional: string | null
          tiempo_estimado: string | null
          tiempo_punto_origen: string | null
          tiempo_retraso: unknown | null
          tipo_carga: string | null
          tipo_carga_adicional: string | null
          tipo_gadget: string | null
          tipo_servicio: string | null
          tipo_unidad: string | null
          tipo_unidad_adicional: string | null
          updated_time: string | null
        }[]
      }
      get_services_by_phone: {
        Args: { p_phone: string }
        Returns: {
          total_servicios: number
          servicios_completados: number
          servicios_pendientes: number
          km_totales: number
          puntos_totales: number
          servicios_data: Json
        }[]
      }
      get_services_by_user_phone: {
        Args: Record<PropertyKey, never>
        Returns: {
          service_id: string
          origin: string
          destination: string
          status: string
          date: string
          client_name: string
          km_travelled: number
        }[]
      }
      get_servicio_completo_secure: {
        Args: { servicio_uuid: string }
        Returns: Json
      }
      get_user_confirmation_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          email_confirmed_at: string
          is_confirmed: boolean
          profile_verified: boolean
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_direct: {
        Args: { user_uid: string }
        Returns: string
      }
      get_user_role_safe: {
        Args: { user_uid: string }
        Returns: string
      }
      get_user_role_secure: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
        }[]
      }
      get_user_roles_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
        }[]
      }
      get_user_services_by_phone: {
        Args: Record<PropertyKey, never>
        Returns: {
          id_servicio: string
          origen: string
          destino: string
          estado: string
          fecha_hora_cita: string
          km_recorridos: number
          nombre_cliente: string
          user_id: string
          user_name: string
          user_phone: string
        }[]
      }
      get_user_services_by_phone_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          id_servicio: string
          origen: string
          destino: string
          fecha_hora_cita: string
          estado: string
          nombre_cliente: string
          nombre_custodio: string
          km_recorridos: number
          telefono: string
          puntos_ganados: number
        }[]
      }
      get_user_services_comprehensive: {
        Args: {
          p_user_id?: string
          p_user_phone?: string
          p_user_email?: string
          p_user_name?: string
        }
        Returns: {
          total_servicios: number
          servicios_completados: number
          servicios_pendientes: number
          km_totales: number
          puntos_totales: number
          servicios_data: Json
        }[]
      }
      get_user_services_list: {
        Args: { p_phone: string }
        Returns: {
          id_servicio: string
          origen: string
          destino: string
          estado: string
          km_recorridos: number
          fecha_hora_cita: string
          nombre_cliente: string
          nombre_custodio: string
          tipo_servicio: string
          telefono: string
          id_custodio: string
          tiempo_retraso: number
          puntos_ganados: number
        }[]
      }
      get_user_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          verified_users: number
          unverified_users: number
          admin_users: number
          manager_users: number
          custodio_users: number
          users_last_30_days: number
        }[]
      }
      get_users_with_roles_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          display_name: string
          role: string
          created_at: string
          last_login: string
        }[]
      }
      get_weekly_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          custodio_id: string
          nombre_custodio: string
          total_viajes: number
          km_totales: number
          puntos: number
          posicion: number
        }[]
      }
      get_zonas_trabajo_safe: {
        Args: { ciudad_uuid: string }
        Returns: {
          id: string
          nombre: string
          ciudad_id: string
          descripcion: string
        }[]
      }
      has_role: {
        Args: { user_uid: string; required_role: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_admin_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_no_recursion: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_admin_or_owner: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin_safe: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_admin_secure: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_coordinator_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_security_analyst_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_owner: {
        Args: { user_id: string; service_custodio_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_user_to_custodio_services: {
        Args: { p_user_id: string; p_phone: string }
        Returns: {
          linked_services: number
        }[]
      }
      manually_verify_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      migrate_existing_categories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      obtener_estadisticas_custodio: {
        Args: { custodio_id: string }
        Returns: {
          total_viajes: number
          puntos_totales: number
          km_totales: number
          viajes_completados: number
          viajes_pendientes: number
        }[]
      }
      parse_tiempo_retraso: {
        Args: { tiempo_str: string }
        Returns: unknown
      }
      procesar_bono_referido: {
        Args: { p_referido_id: string }
        Returns: boolean
      }
      redeem_points: {
        Args: { p_user_id: string; p_reward_id: string; p_quantity?: number }
        Returns: string
      }
      review_flagged_service: {
        Args: {
          p_flag_id: string
          p_status: string
          p_admin_notes?: string
          p_override_km?: number
          p_override_points?: number
        }
        Returns: boolean
      }
      self_verify_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_all_custodian_levels: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_approval_process: {
        Args:
          | {
              p_lead_id: string
              p_stage: string
              p_interview_method?: string
              p_notes?: string
              p_decision?: string
              p_decision_reason?: string
            }
          | {
              p_lead_id: string
              p_stage: string
              p_interview_method?: string
              p_notes?: string
              p_decision?: string
              p_decision_reason?: string
            }
        Returns: undefined
      }
      update_last_login: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_points_system_config: {
        Args: {
          p_points_multiplier: number
          p_min_points_for_rewards: number
          p_level_thresholds: Json
          p_level_names: Json
        }
        Returns: string
      }
      update_redemption_status_bypass_rls: {
        Args: {
          p_redemption_id: string
          p_status: string
          p_admin_notes?: string
        }
        Returns: boolean
      }
      update_reward_bypass_rls: {
        Args: {
          reward_id: string
          reward_name: string
          reward_description: string
          reward_point_cost: number
          reward_image_url: string
          reward_category_id: string
          reward_availability: number
          reward_featured: boolean
        }
        Returns: string
      }
      upsert_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_display_name: string
          user_phone?: string
          user_photo_url?: string
          user_role?: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: {
          user_uid: string
          permission_type: string
          permission_id: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
      user_has_role_secure: {
        Args: { user_uuid: string; required_role: string }
        Returns: boolean
      }
      validar_horario_instalacion: {
        Args: { fecha_programada: string }
        Returns: boolean
      }
      validate_image_url: {
        Args: { url: string }
        Returns: boolean
      }
      validate_service_distance: {
        Args: {
          p_km_recorridos: number
          p_origen: string
          p_destino: string
          p_service_id?: string
        }
        Returns: {
          is_valid: boolean
          suggested_km: number
          flag_reason: string
          should_flag: boolean
        }[]
      }
      verificar_admin_seguro: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      verificar_cumplimiento_referido: {
        Args: { referido_id: string }
        Returns: boolean
      }
      verify_admin_email: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_user_account: {
        Args: { target_user_id: string; verify_status: boolean }
        Returns: boolean
      }
      verify_user_role: {
        Args: { role_to_check: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "supply_admin"
        | "bi"
        | "monitoring_supervisor"
        | "monitoring"
        | "supply"
        | "soporte"
        | "pending"
        | "unverified"
        | "custodio"
        | "ejecutivo_ventas"
        | "coordinador_operaciones"
        | "tecnico_instalador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "owner",
        "admin",
        "supply_admin",
        "bi",
        "monitoring_supervisor",
        "monitoring",
        "supply",
        "soporte",
        "pending",
        "unverified",
        "custodio",
        "ejecutivo_ventas",
        "coordinador_operaciones",
        "tecnico_instalador",
      ],
    },
  },
} as const
