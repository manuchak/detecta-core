export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      alertas_sistema_nacional: {
        Row: {
          acciones_sugeridas: string[] | null
          asignado_a: string | null
          categoria: string
          created_at: string | null
          datos_contexto: Json | null
          descripcion: string
          estado: string | null
          fecha_resolucion: string | null
          id: string
          prioridad: number | null
          tipo_alerta: string
          titulo: string
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          acciones_sugeridas?: string[] | null
          asignado_a?: string | null
          categoria: string
          created_at?: string | null
          datos_contexto?: Json | null
          descripcion: string
          estado?: string | null
          fecha_resolucion?: string | null
          id?: string
          prioridad?: number | null
          tipo_alerta: string
          titulo: string
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          acciones_sugeridas?: string[] | null
          asignado_a?: string | null
          categoria?: string
          created_at?: string | null
          datos_contexto?: Json | null
          descripcion?: string
          estado?: string | null
          fecha_resolucion?: string | null
          id?: string
          prioridad?: number | null
          tipo_alerta?: string
          titulo?: string
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_sistema_nacional_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
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
      armados: {
        Row: {
          created_at: string
          disponibilidad: string
          email: string | null
          equipamiento_disponible: string[] | null
          estado: string
          experiencia_anos: number | null
          fecha_ultimo_servicio: string | null
          fecha_vencimiento_licencia: string | null
          id: string
          licencia_portacion: string | null
          nombre: string
          numero_servicios: number | null
          observaciones: string | null
          rating_promedio: number | null
          tasa_confirmacion: number | null
          tasa_respuesta: number | null
          telefono: string | null
          updated_at: string
          zona_base: string | null
        }
        Insert: {
          created_at?: string
          disponibilidad?: string
          email?: string | null
          equipamiento_disponible?: string[] | null
          estado?: string
          experiencia_anos?: number | null
          fecha_ultimo_servicio?: string | null
          fecha_vencimiento_licencia?: string | null
          id?: string
          licencia_portacion?: string | null
          nombre: string
          numero_servicios?: number | null
          observaciones?: string | null
          rating_promedio?: number | null
          tasa_confirmacion?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          updated_at?: string
          zona_base?: string | null
        }
        Update: {
          created_at?: string
          disponibilidad?: string
          email?: string | null
          equipamiento_disponible?: string[] | null
          estado?: string
          experiencia_anos?: number | null
          fecha_ultimo_servicio?: string | null
          fecha_vencimiento_licencia?: string | null
          id?: string
          licencia_portacion?: string | null
          nombre?: string
          numero_servicios?: number | null
          observaciones?: string | null
          rating_promedio?: number | null
          tasa_confirmacion?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          updated_at?: string
          zona_base?: string | null
        }
        Relationships: []
      }
      armados_indisponibilidades: {
        Row: {
          activo: boolean | null
          armado_id: string
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          motivo: string | null
          tipo: string
        }
        Insert: {
          activo?: boolean | null
          armado_id: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          motivo?: string | null
          tipo: string
        }
        Update: {
          activo?: boolean | null
          armado_id?: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          motivo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "armados_indisponibilidades_armado_id_fkey"
            columns: ["armado_id"]
            isOneToOne: false
            referencedRelation: "armados_operativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armados_indisponibilidades_armado_id_fkey"
            columns: ["armado_id"]
            isOneToOne: false
            referencedRelation: "armados_operativos_disponibles"
            referencedColumns: ["id"]
          },
        ]
      }
      armados_operativos: {
        Row: {
          created_at: string
          disponibilidad: string
          email: string | null
          equipamiento_disponible: string[] | null
          estado: string
          experiencia_anos: number | null
          fecha_ultimo_servicio: string | null
          fecha_vencimiento_licencia: string | null
          fuente: string | null
          id: string
          licencia_portacion: string | null
          nombre: string
          numero_servicios: number | null
          proveedor_id: string | null
          rating_promedio: number | null
          restricciones_horario: Json | null
          score_comunicacion: number | null
          score_confiabilidad: number | null
          score_disponibilidad: number | null
          score_total: number | null
          servicios_permitidos: string[] | null
          tasa_confiabilidad: number | null
          tasa_confirmacion: number | null
          tasa_respuesta: number | null
          telefono: string | null
          tipo_armado: string
          updated_at: string
          zona_base: string | null
          zonas_permitidas: string[] | null
        }
        Insert: {
          created_at?: string
          disponibilidad?: string
          email?: string | null
          equipamiento_disponible?: string[] | null
          estado?: string
          experiencia_anos?: number | null
          fecha_ultimo_servicio?: string | null
          fecha_vencimiento_licencia?: string | null
          fuente?: string | null
          id?: string
          licencia_portacion?: string | null
          nombre: string
          numero_servicios?: number | null
          proveedor_id?: string | null
          rating_promedio?: number | null
          restricciones_horario?: Json | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_disponibilidad?: number | null
          score_total?: number | null
          servicios_permitidos?: string[] | null
          tasa_confiabilidad?: number | null
          tasa_confirmacion?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          tipo_armado?: string
          updated_at?: string
          zona_base?: string | null
          zonas_permitidas?: string[] | null
        }
        Update: {
          created_at?: string
          disponibilidad?: string
          email?: string | null
          equipamiento_disponible?: string[] | null
          estado?: string
          experiencia_anos?: number | null
          fecha_ultimo_servicio?: string | null
          fecha_vencimiento_licencia?: string | null
          fuente?: string | null
          id?: string
          licencia_portacion?: string | null
          nombre?: string
          numero_servicios?: number | null
          proveedor_id?: string | null
          rating_promedio?: number | null
          restricciones_horario?: Json | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_disponibilidad?: number | null
          score_total?: number | null
          servicios_permitidos?: string[] | null
          tasa_confiabilidad?: number | null
          tasa_confirmacion?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          tipo_armado?: string
          updated_at?: string
          zona_base?: string | null
          zonas_permitidas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_armados_proveedor"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_armados"
            referencedColumns: ["id"]
          },
        ]
      }
      armados_performance_metrics: {
        Row: {
          armado_id: string
          id: string
          no_shows: number | null
          score_comunicacion: number | null
          score_profesionalismo: number | null
          score_puntualidad: number | null
          score_total: number | null
          tasa_confiabilidad: number | null
          tasa_confirmacion: number | null
          tiempo_respuesta_promedio: number | null
          total_asignaciones: number | null
          total_cancelaciones: number | null
          total_confirmaciones: number | null
          total_servicios_completados: number | null
          updated_at: string
        }
        Insert: {
          armado_id: string
          id?: string
          no_shows?: number | null
          score_comunicacion?: number | null
          score_profesionalismo?: number | null
          score_puntualidad?: number | null
          score_total?: number | null
          tasa_confiabilidad?: number | null
          tasa_confirmacion?: number | null
          tiempo_respuesta_promedio?: number | null
          total_asignaciones?: number | null
          total_cancelaciones?: number | null
          total_confirmaciones?: number | null
          total_servicios_completados?: number | null
          updated_at?: string
        }
        Update: {
          armado_id?: string
          id?: string
          no_shows?: number | null
          score_comunicacion?: number | null
          score_profesionalismo?: number | null
          score_puntualidad?: number | null
          score_total?: number | null
          tasa_confiabilidad?: number | null
          tasa_confirmacion?: number | null
          tiempo_respuesta_promedio?: number | null
          total_asignaciones?: number | null
          total_cancelaciones?: number | null
          total_confirmaciones?: number | null
          total_servicios_completados?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "armados_performance_metrics_armado_id_fkey"
            columns: ["armado_id"]
            isOneToOne: true
            referencedRelation: "armados_operativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armados_performance_metrics_armado_id_fkey"
            columns: ["armado_id"]
            isOneToOne: true
            referencedRelation: "armados_operativos_disponibles"
            referencedColumns: ["id"]
          },
        ]
      }
      asignacion_armados: {
        Row: {
          armado_id: string | null
          asignado_por: string | null
          calificacion_servicio: number | null
          confirmado_por_armado: boolean | null
          confirmado_por_custodio: boolean | null
          coordenadas_encuentro: unknown | null
          created_at: string
          custodio_id: string | null
          estado_asignacion: string
          hora_encuentro: string | null
          id: string
          moneda: string | null
          observaciones: string | null
          proveedor_armado_id: string | null
          punto_encuentro: string | null
          servicio_custodia_id: string | null
          tarifa_acordada: number | null
          tiempo_respuesta_minutos: number | null
          tipo_asignacion: string
          updated_at: string
        }
        Insert: {
          armado_id?: string | null
          asignado_por?: string | null
          calificacion_servicio?: number | null
          confirmado_por_armado?: boolean | null
          confirmado_por_custodio?: boolean | null
          coordenadas_encuentro?: unknown | null
          created_at?: string
          custodio_id?: string | null
          estado_asignacion?: string
          hora_encuentro?: string | null
          id?: string
          moneda?: string | null
          observaciones?: string | null
          proveedor_armado_id?: string | null
          punto_encuentro?: string | null
          servicio_custodia_id?: string | null
          tarifa_acordada?: number | null
          tiempo_respuesta_minutos?: number | null
          tipo_asignacion?: string
          updated_at?: string
        }
        Update: {
          armado_id?: string | null
          asignado_por?: string | null
          calificacion_servicio?: number | null
          confirmado_por_armado?: boolean | null
          confirmado_por_custodio?: boolean | null
          coordenadas_encuentro?: unknown | null
          created_at?: string
          custodio_id?: string | null
          estado_asignacion?: string
          hora_encuentro?: string | null
          id?: string
          moneda?: string | null
          observaciones?: string | null
          proveedor_armado_id?: string | null
          punto_encuentro?: string | null
          servicio_custodia_id?: string | null
          tarifa_acordada?: number | null
          tiempo_respuesta_minutos?: number | null
          tipo_asignacion?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_api_credentials: {
        Row: {
          action: string
          created_at: string
          id: string
          ip: unknown | null
          service_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          ip?: unknown | null
          service_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip?: unknown | null
          service_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log_productos: {
        Row: {
          accion: string
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          direccion_ip: unknown | null
          fecha_accion: string
          id: string
          motivo: string | null
          producto_id: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          accion: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          direccion_ip?: unknown | null
          fecha_accion?: string
          id?: string
          motivo?: string | null
          producto_id: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          direccion_ip?: unknown | null
          fecha_accion?: string
          id?: string
          motivo?: string | null
          producto_id?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      auditoria_instalaciones: {
        Row: {
          aspectos_mejora: string[] | null
          aspectos_positivos: string[] | null
          auditor_id: string
          created_at: string | null
          estado_auditoria: string
          fecha_auditoria: string | null
          fecha_resolucion: string | null
          id: string
          instalador_id: string
          observaciones: string | null
          programacion_id: string
          puntuacion_documentacion: number | null
          puntuacion_evidencias: number | null
          puntuacion_general: number | null
          puntuacion_tecnica: number | null
          requiere_seguimiento: boolean | null
          updated_at: string | null
        }
        Insert: {
          aspectos_mejora?: string[] | null
          aspectos_positivos?: string[] | null
          auditor_id: string
          created_at?: string | null
          estado_auditoria?: string
          fecha_auditoria?: string | null
          fecha_resolucion?: string | null
          id?: string
          instalador_id: string
          observaciones?: string | null
          programacion_id: string
          puntuacion_documentacion?: number | null
          puntuacion_evidencias?: number | null
          puntuacion_general?: number | null
          puntuacion_tecnica?: number | null
          requiere_seguimiento?: boolean | null
          updated_at?: string | null
        }
        Update: {
          aspectos_mejora?: string[] | null
          aspectos_positivos?: string[] | null
          auditor_id?: string
          created_at?: string | null
          estado_auditoria?: string
          fecha_auditoria?: string | null
          fecha_resolucion?: string | null
          id?: string
          instalador_id?: string
          observaciones?: string | null
          programacion_id?: string
          puntuacion_documentacion?: number | null
          puntuacion_evidencias?: number | null
          puntuacion_general?: number | null
          puntuacion_tecnica?: number | null
          requiere_seguimiento?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_instalaciones_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
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
      canales_reclutamiento: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          orden: number | null
          tipo: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number | null
          tipo?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      candidatos_custodios: {
        Row: {
          calificacion_inicial: number | null
          created_at: string | null
          disponibilidad_horarios: Json | null
          email: string | null
          estado_proceso: string | null
          expectativa_ingresos: number | null
          experiencia_seguridad: boolean | null
          fecha_contacto: string | null
          fuente_reclutamiento: string | null
          id: string
          inversion_inicial_disponible: number | null
          nombre: string
          notas_recruiter: string | null
          telefono: string | null
          ubicacion_residencia: unknown | null
          updated_at: string | null
          vehiculo_propio: boolean | null
          zona_preferida_id: string | null
        }
        Insert: {
          calificacion_inicial?: number | null
          created_at?: string | null
          disponibilidad_horarios?: Json | null
          email?: string | null
          estado_proceso?: string | null
          expectativa_ingresos?: number | null
          experiencia_seguridad?: boolean | null
          fecha_contacto?: string | null
          fuente_reclutamiento?: string | null
          id?: string
          inversion_inicial_disponible?: number | null
          nombre: string
          notas_recruiter?: string | null
          telefono?: string | null
          ubicacion_residencia?: unknown | null
          updated_at?: string | null
          vehiculo_propio?: boolean | null
          zona_preferida_id?: string | null
        }
        Update: {
          calificacion_inicial?: number | null
          created_at?: string | null
          disponibilidad_horarios?: Json | null
          email?: string | null
          estado_proceso?: string | null
          expectativa_ingresos?: number | null
          experiencia_seguridad?: boolean | null
          fecha_contacto?: string | null
          fuente_reclutamiento?: string | null
          id?: string
          inversion_inicial_disponible?: number | null
          nombre?: string
          notas_recruiter?: string | null
          telefono?: string | null
          ubicacion_residencia?: unknown | null
          updated_at?: string | null
          vehiculo_propio?: boolean | null
          zona_preferida_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_custodios_zona_preferida_id_fkey"
            columns: ["zona_preferida_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_gastos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_principales: {
        Row: {
          activo: boolean | null
          color: string | null
          created_at: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          orden: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          orden?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_productos: {
        Row: {
          activo: boolean | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          parent_id: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          parent_id?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_productos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias_productos"
            referencedColumns: ["id"]
          },
        ]
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
      comodatos_gps: {
        Row: {
          asignado_por: string
          condiciones_asignacion: string | null
          condiciones_devolucion: string | null
          created_at: string
          custodio_operativo_nombre: string | null
          custodio_operativo_telefono: string | null
          devuelto_por: string | null
          estado: string
          fecha_asignacion: string
          fecha_devolucion_programada: string
          fecha_devolucion_real: string | null
          id: string
          numero_serie_gps: string
          observaciones: string | null
          pc_custodio_id: string | null
          producto_gps_id: string
          updated_at: string
        }
        Insert: {
          asignado_por: string
          condiciones_asignacion?: string | null
          condiciones_devolucion?: string | null
          created_at?: string
          custodio_operativo_nombre?: string | null
          custodio_operativo_telefono?: string | null
          devuelto_por?: string | null
          estado?: string
          fecha_asignacion?: string
          fecha_devolucion_programada: string
          fecha_devolucion_real?: string | null
          id?: string
          numero_serie_gps: string
          observaciones?: string | null
          pc_custodio_id?: string | null
          producto_gps_id: string
          updated_at?: string
        }
        Update: {
          asignado_por?: string
          condiciones_asignacion?: string | null
          condiciones_devolucion?: string | null
          created_at?: string
          custodio_operativo_nombre?: string | null
          custodio_operativo_telefono?: string | null
          devuelto_por?: string | null
          estado?: string
          fecha_asignacion?: string
          fecha_devolucion_programada?: string
          fecha_devolucion_real?: string | null
          id?: string
          numero_serie_gps?: string
          observaciones?: string | null
          pc_custodio_id?: string | null
          producto_gps_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comodatos_gps_asignado_por"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comodatos_gps_devuelto_por"
            columns: ["devuelto_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comodatos_gps_pc_custodio"
            columns: ["pc_custodio_id"]
            isOneToOne: false
            referencedRelation: "pc_custodios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comodatos_gps_producto"
            columns: ["producto_gps_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
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
      configuracion_moneda: {
        Row: {
          activo: boolean
          actualizado_por: string | null
          created_at: string
          fecha_actualizacion: string
          id: string
          moneda_base: string
          moneda_destino: string
          tipo_cambio: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          actualizado_por?: string | null
          created_at?: string
          fecha_actualizacion?: string
          id?: string
          moneda_base?: string
          moneda_destino?: string
          tipo_cambio?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          actualizado_por?: string | null
          created_at?: string
          fecha_actualizacion?: string
          id?: string
          moneda_base?: string
          moneda_destino?: string
          tipo_cambio?: number
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
      configuracion_wms: {
        Row: {
          created_at: string
          id: string
          moneda_default: string
          stock_maximo_default: number
          stock_minimo_default: number
          ubicacion_almacen_default: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          moneda_default?: string
          stock_maximo_default?: number
          stock_minimo_default?: number
          ubicacion_almacen_default?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          moneda_default?: string
          stock_maximo_default?: number
          stock_minimo_default?: number
          ubicacion_almacen_default?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      configuraciones_producto: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          parametro: string
          producto_id: string
          requerido: boolean | null
          valor: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          parametro: string
          producto_id: string
          requerido?: boolean | null
          valor: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          parametro?: string
          producto_id?: string
          requerido?: boolean | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuraciones_producto_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
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
      contactos_empresa: {
        Row: {
          activo: boolean | null
          cargo: string
          created_at: string
          email: string
          empresa_id: string
          es_contacto_principal: boolean | null
          id: string
          nombre_completo: string
          permisos_acceso: string[] | null
          rol_contacto: string
          telefono: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          cargo: string
          created_at?: string
          email: string
          empresa_id: string
          es_contacto_principal?: boolean | null
          id?: string
          nombre_completo: string
          permisos_acceso?: string[] | null
          rol_contacto?: string
          telefono: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          cargo?: string
          created_at?: string
          email?: string
          empresa_id?: string
          es_contacto_principal?: boolean | null
          id?: string
          nombre_completo?: string
          permisos_acceso?: string[] | null
          rol_contacto?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_instaladoras"
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
      criterios_recomendacion_gps: {
        Row: {
          activo: boolean | null
          capacidad_microsd_minima_gb: number | null
          created_at: string | null
          id: string
          marca_gps_recomendada: string | null
          modelo_gps_recomendado: string | null
          observaciones: string | null
          prioridad: number | null
          requiere_microsd: boolean | null
          sensores_requeridos: string[]
          tipo_sim_recomendado: string | null
          tipo_vehiculo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          capacidad_microsd_minima_gb?: number | null
          created_at?: string | null
          id?: string
          marca_gps_recomendada?: string | null
          modelo_gps_recomendado?: string | null
          observaciones?: string | null
          prioridad?: number | null
          requiere_microsd?: boolean | null
          sensores_requeridos?: string[]
          tipo_sim_recomendado?: string | null
          tipo_vehiculo: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          capacidad_microsd_minima_gb?: number | null
          created_at?: string | null
          id?: string
          marca_gps_recomendada?: string | null
          modelo_gps_recomendado?: string | null
          observaciones?: string | null
          prioridad?: number | null
          requiere_microsd?: boolean | null
          sensores_requeridos?: string[]
          tipo_sim_recomendado?: string | null
          tipo_vehiculo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      custodio_communications: {
        Row: {
          contenido: string | null
          created_at: string
          custodio_id: string
          custodio_nombre: string
          custodio_telefono: string
          direccion: string
          estado: string
          id: string
          metadata: Json | null
          servicio_id: string | null
          timestamp_comunicacion: string
          tipo_comunicacion: string
        }
        Insert: {
          contenido?: string | null
          created_at?: string
          custodio_id: string
          custodio_nombre: string
          custodio_telefono: string
          direccion: string
          estado?: string
          id?: string
          metadata?: Json | null
          servicio_id?: string | null
          timestamp_comunicacion?: string
          tipo_comunicacion: string
        }
        Update: {
          contenido?: string | null
          created_at?: string
          custodio_id?: string
          custodio_nombre?: string
          custodio_telefono?: string
          direccion?: string
          estado?: string
          id?: string
          metadata?: Json | null
          servicio_id?: string | null
          timestamp_comunicacion?: string
          tipo_comunicacion?: string
        }
        Relationships: []
      }
      custodio_indisponibilidades: {
        Row: {
          created_at: string | null
          custodio_id: string
          estado: string
          fecha_fin_estimada: string | null
          fecha_fin_real: string | null
          fecha_inicio: string
          id: string
          metadata: Json | null
          motivo: string
          notas: string | null
          reportado_por: string | null
          requiere_seguimiento: boolean | null
          severidad: string | null
          tipo_indisponibilidad: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custodio_id: string
          estado?: string
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string
          id?: string
          metadata?: Json | null
          motivo: string
          notas?: string | null
          reportado_por?: string | null
          requiere_seguimiento?: boolean | null
          severidad?: string | null
          tipo_indisponibilidad: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custodio_id?: string
          estado?: string
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string
          id?: string
          metadata?: Json | null
          motivo?: string
          notas?: string | null
          reportado_por?: string | null
          requiere_seguimiento?: boolean | null
          severidad?: string | null
          tipo_indisponibilidad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custodio_indisponibilidades_custodio_id_fkey"
            columns: ["custodio_id"]
            isOneToOne: false
            referencedRelation: "custodios_operativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodio_indisponibilidades_custodio_id_fkey"
            columns: ["custodio_id"]
            isOneToOne: false
            referencedRelation: "custodios_operativos_disponibles"
            referencedColumns: ["id"]
          },
        ]
      }
      custodio_performance_metrics: {
        Row: {
          created_at: string
          custodio_id: string
          custodio_nombre: string
          custodio_telefono: string
          id: string
          no_shows: number | null
          notas_performance: string | null
          score_aceptacion: number | null
          score_comunicacion: number | null
          score_confiabilidad: number | null
          score_total: number | null
          servicios_cancelados: number | null
          servicios_completados: number | null
          tasa_aceptacion: number | null
          tasa_confiabilidad: number | null
          tasa_respuesta: number | null
          tiempo_promedio_respuesta_minutos: number | null
          total_aceptaciones: number | null
          total_comunicaciones: number | null
          total_ofertas: number | null
          total_rechazos: number | null
          total_respuestas: number | null
          ultima_comunicacion: string | null
          ultimo_servicio: string | null
          updated_at: string
          zona_operacion: string | null
        }
        Insert: {
          created_at?: string
          custodio_id: string
          custodio_nombre: string
          custodio_telefono: string
          id?: string
          no_shows?: number | null
          notas_performance?: string | null
          score_aceptacion?: number | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_total?: number | null
          servicios_cancelados?: number | null
          servicios_completados?: number | null
          tasa_aceptacion?: number | null
          tasa_confiabilidad?: number | null
          tasa_respuesta?: number | null
          tiempo_promedio_respuesta_minutos?: number | null
          total_aceptaciones?: number | null
          total_comunicaciones?: number | null
          total_ofertas?: number | null
          total_rechazos?: number | null
          total_respuestas?: number | null
          ultima_comunicacion?: string | null
          ultimo_servicio?: string | null
          updated_at?: string
          zona_operacion?: string | null
        }
        Update: {
          created_at?: string
          custodio_id?: string
          custodio_nombre?: string
          custodio_telefono?: string
          id?: string
          no_shows?: number | null
          notas_performance?: string | null
          score_aceptacion?: number | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_total?: number | null
          servicios_cancelados?: number | null
          servicios_completados?: number | null
          tasa_aceptacion?: number | null
          tasa_confiabilidad?: number | null
          tasa_respuesta?: number | null
          tiempo_promedio_respuesta_minutos?: number | null
          total_aceptaciones?: number | null
          total_comunicaciones?: number | null
          total_ofertas?: number | null
          total_rechazos?: number | null
          total_respuestas?: number | null
          ultima_comunicacion?: string | null
          ultimo_servicio?: string | null
          updated_at?: string
          zona_operacion?: string | null
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
      custodio_responses: {
        Row: {
          communication_id: string
          created_at: string
          custodio_id: string
          disponibilidad_propuesta: string | null
          id: string
          metadata: Json | null
          precio_propuesto: number | null
          processed: boolean | null
          razon_rechazo: string | null
          respuesta_texto: string | null
          servicio_id: string | null
          tiempo_respuesta_minutos: number | null
          tipo_respuesta: string
        }
        Insert: {
          communication_id: string
          created_at?: string
          custodio_id: string
          disponibilidad_propuesta?: string | null
          id?: string
          metadata?: Json | null
          precio_propuesto?: number | null
          processed?: boolean | null
          razon_rechazo?: string | null
          respuesta_texto?: string | null
          servicio_id?: string | null
          tiempo_respuesta_minutos?: number | null
          tipo_respuesta: string
        }
        Update: {
          communication_id?: string
          created_at?: string
          custodio_id?: string
          disponibilidad_propuesta?: string | null
          id?: string
          metadata?: Json | null
          precio_propuesto?: number | null
          processed?: boolean | null
          razon_rechazo?: string | null
          respuesta_texto?: string | null
          servicio_id?: string | null
          tiempo_respuesta_minutos?: number | null
          tipo_respuesta?: string
        }
        Relationships: [
          {
            foreignKeyName: "custodio_responses_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "custodio_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      custodios_operativos: {
        Row: {
          certificaciones: string[] | null
          created_at: string | null
          disponibilidad: string | null
          email: string | null
          estado: string | null
          experiencia_seguridad: boolean | null
          fecha_ultimo_servicio: string | null
          fuente: string | null
          id: string
          lat: number | null
          lng: number | null
          nombre: string
          numero_servicios: number | null
          rating_promedio: number | null
          score_aceptacion: number | null
          score_comunicacion: number | null
          score_confiabilidad: number | null
          score_total: number | null
          tasa_aceptacion: number | null
          tasa_confiabilidad: number | null
          tasa_respuesta: number | null
          telefono: string | null
          updated_at: string | null
          vehiculo_propio: boolean | null
          zona_base: string | null
        }
        Insert: {
          certificaciones?: string[] | null
          created_at?: string | null
          disponibilidad?: string | null
          email?: string | null
          estado?: string | null
          experiencia_seguridad?: boolean | null
          fecha_ultimo_servicio?: string | null
          fuente?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre: string
          numero_servicios?: number | null
          rating_promedio?: number | null
          score_aceptacion?: number | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_total?: number | null
          tasa_aceptacion?: number | null
          tasa_confiabilidad?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          updated_at?: string | null
          vehiculo_propio?: boolean | null
          zona_base?: string | null
        }
        Update: {
          certificaciones?: string[] | null
          created_at?: string | null
          disponibilidad?: string | null
          email?: string | null
          estado?: string | null
          experiencia_seguridad?: boolean | null
          fecha_ultimo_servicio?: string | null
          fuente?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre?: string
          numero_servicios?: number | null
          rating_promedio?: number | null
          score_aceptacion?: number | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_total?: number | null
          tasa_aceptacion?: number | null
          tasa_confiabilidad?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          updated_at?: string | null
          vehiculo_propio?: boolean | null
          zona_base?: string | null
        }
        Relationships: []
      }
      custodios_primer_servicio_zona: {
        Row: {
          created_at: string
          custodio_id: string
          destino: string | null
          fecha_primer_servicio: string
          id: string
          km_recorridos: number | null
          nombre_custodio: string
          origen: string | null
          servicio_id: string
          tipo_servicio: string | null
          updated_at: string
          zona_operacion: string
        }
        Insert: {
          created_at?: string
          custodio_id: string
          destino?: string | null
          fecha_primer_servicio: string
          id?: string
          km_recorridos?: number | null
          nombre_custodio: string
          origen?: string | null
          servicio_id: string
          tipo_servicio?: string | null
          updated_at?: string
          zona_operacion: string
        }
        Update: {
          created_at?: string
          custodio_id?: string
          destino?: string | null
          fecha_primer_servicio?: string
          id?: string
          km_recorridos?: number | null
          nombre_custodio?: string
          origen?: string | null
          servicio_id?: string
          tipo_servicio?: string | null
          updated_at?: string
          zona_operacion?: string
        }
        Relationships: []
      }
      custodios_roi_tracking: {
        Row: {
          activo: boolean | null
          canal_adquisicion: string | null
          created_at: string | null
          custodio_id: string
          fecha_contratacion: string
          id: string
          ingresos_generados: number | null
          inversion_asociada: number | null
          nombre_custodio: string
          servicios_completados: number | null
          ultima_actualizacion: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          canal_adquisicion?: string | null
          created_at?: string | null
          custodio_id: string
          fecha_contratacion: string
          id?: string
          ingresos_generados?: number | null
          inversion_asociada?: number | null
          nombre_custodio: string
          servicios_completados?: number | null
          ultima_actualizacion?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          canal_adquisicion?: string | null
          created_at?: string | null
          custodio_id?: string
          fecha_contratacion?: string
          id?: string
          ingresos_generados?: number | null
          inversion_asociada?: number | null
          nombre_custodio?: string
          servicios_completados?: number | null
          ultima_actualizacion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custodios_rotacion_tracking: {
        Row: {
          created_at: string
          custodio_id: string
          dias_sin_servicio: number | null
          estado_actividad: string | null
          fecha_primera_inactividad: string | null
          fecha_ultimo_servicio: string | null
          id: string
          nombre_custodio: string
          promedio_servicios_mes: number | null
          servicios_ultimos_30_dias: number | null
          total_servicios_historicos: number | null
          updated_at: string
          zona_operacion: string
        }
        Insert: {
          created_at?: string
          custodio_id: string
          dias_sin_servicio?: number | null
          estado_actividad?: string | null
          fecha_primera_inactividad?: string | null
          fecha_ultimo_servicio?: string | null
          id?: string
          nombre_custodio: string
          promedio_servicios_mes?: number | null
          servicios_ultimos_30_dias?: number | null
          total_servicios_historicos?: number | null
          updated_at?: string
          zona_operacion: string
        }
        Update: {
          created_at?: string
          custodio_id?: string
          dias_sin_servicio?: number | null
          estado_actividad?: string | null
          fecha_primera_inactividad?: string | null
          fecha_ultimo_servicio?: string | null
          id?: string
          nombre_custodio?: string
          promedio_servicios_mes?: number | null
          servicios_ultimos_30_dias?: number | null
          total_servicios_historicos?: number | null
          updated_at?: string
          zona_operacion?: string
        }
        Relationships: []
      }
      desechos_inventario: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string
          created_by: string | null
          estado: string
          evidencia_urls: string[] | null
          id: string
          motivo: string | null
          producto_id: string
          seriales: string[] | null
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          cantidad: number
          costo_unitario?: number | null
          created_at?: string
          created_by?: string | null
          estado?: string
          evidencia_urls?: string[] | null
          id?: string
          motivo?: string | null
          producto_id: string
          seriales?: string[] | null
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          created_by?: string | null
          estado?: string
          evidencia_urls?: string[] | null
          id?: string
          motivo?: string | null
          producto_id?: string
          seriales?: string[] | null
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      detalles_orden_compra: {
        Row: {
          cantidad_recibida: number | null
          cantidad_solicitada: number
          created_at: string | null
          descuento_porcentaje: number | null
          id: string
          notas: string | null
          orden_id: string | null
          precio_unitario: number
          producto_id: string
          subtotal: number | null
        }
        Insert: {
          cantidad_recibida?: number | null
          cantidad_solicitada: number
          created_at?: string | null
          descuento_porcentaje?: number | null
          id?: string
          notas?: string | null
          orden_id?: string | null
          precio_unitario: number
          producto_id: string
          subtotal?: number | null
        }
        Update: {
          cantidad_recibida?: number | null
          cantidad_solicitada?: number
          created_at?: string | null
          descuento_porcentaje?: number | null
          id?: string
          notas?: string | null
          orden_id?: string | null
          precio_unitario?: number
          producto_id?: string
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalles_orden_compra_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_orden_compra_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      detalles_recepcion: {
        Row: {
          cantidad_esperada: number
          cantidad_recibida: number
          created_at: string
          diferencia: number | null
          estado_producto: string | null
          id: string
          notas: string | null
          precio_unitario: number | null
          producto_id: string | null
          recepcion_id: string | null
          subtotal_esperado: number | null
          subtotal_recibido: number | null
        }
        Insert: {
          cantidad_esperada: number
          cantidad_recibida: number
          created_at?: string
          diferencia?: number | null
          estado_producto?: string | null
          id?: string
          notas?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          recepcion_id?: string | null
          subtotal_esperado?: number | null
          subtotal_recibido?: number | null
        }
        Update: {
          cantidad_esperada?: number
          cantidad_recibida?: number
          created_at?: string
          diferencia?: number | null
          estado_producto?: string | null
          id?: string
          notas?: string | null
          precio_unitario?: number | null
          producto_id?: string | null
          recepcion_id?: string | null
          subtotal_esperado?: number | null
          subtotal_recibido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalles_recepcion_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_recepcion_recepcion_id_fkey"
            columns: ["recepcion_id"]
            isOneToOne: false
            referencedRelation: "recepciones_mercancia"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones_proveedor: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          evidencia_urls: string[] | null
          id: string
          notas: string | null
          numero_rma: string | null
          proveedor_id: string | null
          total_items: number
          total_valor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          evidencia_urls?: string[] | null
          id?: string
          notas?: string | null
          numero_rma?: string | null
          proveedor_id?: string | null
          total_items?: number
          total_valor?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          evidencia_urls?: string[] | null
          id?: string
          notas?: string | null
          numero_rma?: string | null
          proveedor_id?: string | null
          total_items?: number
          total_valor?: number
          updated_at?: string
        }
        Relationships: []
      }
      devoluciones_proveedor_detalle: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string
          devolucion_id: string
          estado_item: string
          evidencia_urls: string[] | null
          id: string
          motivo: string | null
          producto_id: string
          seriales: string[] | null
          subtotal: number | null
        }
        Insert: {
          cantidad: number
          costo_unitario?: number | null
          created_at?: string
          devolucion_id: string
          estado_item?: string
          evidencia_urls?: string[] | null
          id?: string
          motivo?: string | null
          producto_id: string
          seriales?: string[] | null
          subtotal?: number | null
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          devolucion_id?: string
          estado_item?: string
          evidencia_urls?: string[] | null
          id?: string
          motivo?: string | null
          producto_id?: string
          seriales?: string[] | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_proveedor_detalle_devolucion_id_fkey"
            columns: ["devolucion_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_proveedor"
            referencedColumns: ["id"]
          },
        ]
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
      empresas_instaladoras: {
        Row: {
          años_experiencia: number | null
          capacidad_instaladores: number | null
          certificaciones: string[] | null
          cobertura_geografica: string[] | null
          created_at: string
          direccion_fiscal: string | null
          documentacion_completa: boolean | null
          email_principal: string
          especialidades: string[] | null
          estado_contrato: string
          id: string
          nombre_comercial: string | null
          observaciones: string | null
          razon_social: string
          rfc: string
          tarifas_negociadas: Json | null
          telefono_principal: string
          updated_at: string
        }
        Insert: {
          años_experiencia?: number | null
          capacidad_instaladores?: number | null
          certificaciones?: string[] | null
          cobertura_geografica?: string[] | null
          created_at?: string
          direccion_fiscal?: string | null
          documentacion_completa?: boolean | null
          email_principal: string
          especialidades?: string[] | null
          estado_contrato?: string
          id?: string
          nombre_comercial?: string | null
          observaciones?: string | null
          razon_social: string
          rfc: string
          tarifas_negociadas?: Json | null
          telefono_principal: string
          updated_at?: string
        }
        Update: {
          años_experiencia?: number | null
          capacidad_instaladores?: number | null
          certificaciones?: string[] | null
          cobertura_geografica?: string[] | null
          created_at?: string
          direccion_fiscal?: string | null
          documentacion_completa?: boolean | null
          email_principal?: string
          especialidades?: string[] | null
          estado_contrato?: string
          id?: string
          nombre_comercial?: string | null
          observaciones?: string | null
          razon_social?: string
          rfc?: string
          tarifas_negociadas?: Json | null
          telefono_principal?: string
          updated_at?: string
        }
        Relationships: []
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
      evaluaciones_normas: {
        Row: {
          created_at: string
          evaluador_id: string
          fecha_evaluacion: string
          fotos_evidencia: string[] | null
          id: string
          instalacion_id: string | null
          instalador_id: string
          norma_id: string
          observaciones: string | null
          pasos_evaluados: Json
          puntuacion_maxima: number
          puntuacion_obtenida: number
          requiere_reevaluacion: boolean
        }
        Insert: {
          created_at?: string
          evaluador_id: string
          fecha_evaluacion?: string
          fotos_evidencia?: string[] | null
          id?: string
          instalacion_id?: string | null
          instalador_id: string
          norma_id: string
          observaciones?: string | null
          pasos_evaluados: Json
          puntuacion_maxima: number
          puntuacion_obtenida: number
          requiere_reevaluacion?: boolean
        }
        Update: {
          created_at?: string
          evaluador_id?: string
          fecha_evaluacion?: string
          fotos_evidencia?: string[] | null
          id?: string
          instalacion_id?: string | null
          instalador_id?: string
          norma_id?: string
          observaciones?: string | null
          pasos_evaluados?: Json
          puntuacion_maxima?: number
          puntuacion_obtenida?: number
          requiere_reevaluacion?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_normas_instalacion_id_fkey"
            columns: ["instalacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_normas_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_normas_norma_id_fkey"
            columns: ["norma_id"]
            isOneToOne: false
            referencedRelation: "normas_instalacion"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias_instalacion: {
        Row: {
          archivo_url: string
          created_at: string | null
          descripcion: string | null
          fecha_verificacion: string | null
          id: string
          instalador_id: string
          observaciones_verificacion: string | null
          programacion_id: string
          timestamp_captura: string | null
          tipo_evidencia: string
          ubicacion_gps: unknown | null
          verificado: boolean | null
          verificado_por: string | null
        }
        Insert: {
          archivo_url: string
          created_at?: string | null
          descripcion?: string | null
          fecha_verificacion?: string | null
          id?: string
          instalador_id: string
          observaciones_verificacion?: string | null
          programacion_id: string
          timestamp_captura?: string | null
          tipo_evidencia: string
          ubicacion_gps?: unknown | null
          verificado?: boolean | null
          verificado_por?: string | null
        }
        Update: {
          archivo_url?: string
          created_at?: string | null
          descripcion?: string | null
          fecha_verificacion?: string | null
          id?: string
          instalador_id?: string
          observaciones_verificacion?: string | null
          programacion_id?: string
          timestamp_captura?: string | null
          tipo_evidencia?: string
          ubicacion_gps?: unknown | null
          verificado?: boolean | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_instalacion_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_releases: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completion_date: string | null
          completion_status: string
          created_at: string | null
          dependencies: string[] | null
          due_date: string | null
          estimated_hours: number | null
          feature_description: string | null
          feature_name: string
          id: string
          priority: string
          updated_at: string | null
          version_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completion_date?: string | null
          completion_status?: string
          created_at?: string | null
          dependencies?: string[] | null
          due_date?: string | null
          estimated_hours?: number | null
          feature_description?: string | null
          feature_name: string
          id?: string
          priority?: string
          updated_at?: string | null
          version_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completion_date?: string | null
          completion_status?: string
          created_at?: string | null
          dependencies?: string[] | null
          due_date?: string | null
          estimated_hours?: number | null
          feature_description?: string | null
          feature_name?: string
          id?: string
          priority?: string
          updated_at?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_releases_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
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
      forecast_config: {
        Row: {
          alpha: number
          beta: number
          config_type: string
          created_at: string | null
          gamma: number
          id: string
          show_advanced: boolean
          updated_at: string | null
          updated_by: string | null
          use_manual: boolean
        }
        Insert: {
          alpha?: number
          beta?: number
          config_type?: string
          created_at?: string | null
          gamma?: number
          id?: string
          show_advanced?: boolean
          updated_at?: string | null
          updated_by?: string | null
          use_manual?: boolean
        }
        Update: {
          alpha?: number
          beta?: number
          config_type?: string
          created_at?: string | null
          gamma?: number
          id?: string
          show_advanced?: boolean
          updated_at?: string | null
          updated_by?: string | null
          use_manual?: boolean
        }
        Relationships: []
      }
      gastos_externos: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          canal_reclutamiento: string | null
          canal_reclutamiento_id: string | null
          categoria_id: string | null
          categoria_principal_id: string | null
          comprobante_url: string | null
          concepto: string
          created_at: string | null
          custodios_objetivo: number | null
          custodios_reales: number | null
          descripcion: string | null
          estado: string | null
          fecha_gasto: string
          fecha_vencimiento: string | null
          id: string
          metodo_pago: string | null
          moneda: string | null
          monto: number
          notas: string | null
          notas_aprobacion: string | null
          numero_factura: string | null
          proveedor: string | null
          rechazado_en: string | null
          registrado_por: string
          subcategoria_id: string | null
          tags: string[] | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          canal_reclutamiento?: string | null
          canal_reclutamiento_id?: string | null
          categoria_id?: string | null
          categoria_principal_id?: string | null
          comprobante_url?: string | null
          concepto: string
          created_at?: string | null
          custodios_objetivo?: number | null
          custodios_reales?: number | null
          descripcion?: string | null
          estado?: string | null
          fecha_gasto: string
          fecha_vencimiento?: string | null
          id?: string
          metodo_pago?: string | null
          moneda?: string | null
          monto: number
          notas?: string | null
          notas_aprobacion?: string | null
          numero_factura?: string | null
          proveedor?: string | null
          rechazado_en?: string | null
          registrado_por: string
          subcategoria_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          canal_reclutamiento?: string | null
          canal_reclutamiento_id?: string | null
          categoria_id?: string | null
          categoria_principal_id?: string | null
          comprobante_url?: string | null
          concepto?: string
          created_at?: string | null
          custodios_objetivo?: number | null
          custodios_reales?: number | null
          descripcion?: string | null
          estado?: string | null
          fecha_gasto?: string
          fecha_vencimiento?: string | null
          id?: string
          metodo_pago?: string | null
          moneda?: string | null
          monto?: number
          notas?: string | null
          notas_aprobacion?: string | null
          numero_factura?: string | null
          proveedor?: string | null
          rechazado_en?: string | null
          registrado_por?: string
          subcategoria_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_externos_canal_reclutamiento_id_fkey"
            columns: ["canal_reclutamiento_id"]
            isOneToOne: false
            referencedRelation: "canales_reclutamiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_externos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_externos_categoria_principal_id_fkey"
            columns: ["categoria_principal_id"]
            isOneToOne: false
            referencedRelation: "categorias_principales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_externos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "subcategorias_gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_externos_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      instalacion_documentacion: {
        Row: {
          completado: boolean | null
          coordenadas_latitud: number | null
          coordenadas_longitud: number | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          foto_url: string | null
          id: string
          orden: number
          paso_instalacion: string
          programacion_id: string | null
        }
        Insert: {
          completado?: boolean | null
          coordenadas_latitud?: number | null
          coordenadas_longitud?: number | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          foto_url?: string | null
          id?: string
          orden: number
          paso_instalacion: string
          programacion_id?: string | null
        }
        Update: {
          completado?: boolean | null
          coordenadas_latitud?: number | null
          coordenadas_longitud?: number | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          foto_url?: string | null
          id?: string
          orden?: number
          paso_instalacion?: string
          programacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instalacion_documentacion_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      instalacion_reporte_final: {
        Row: {
          calificacion_servicio: number | null
          comentarios_cliente: string | null
          comentarios_instalador: string | null
          created_at: string | null
          created_by: string | null
          dificultades_encontradas: string[] | null
          firma_cliente_url: string | null
          id: string
          materiales_adicionales_usados: string[] | null
          programacion_id: string | null
          recomendaciones: string | null
          tiempo_total_minutos: number | null
        }
        Insert: {
          calificacion_servicio?: number | null
          comentarios_cliente?: string | null
          comentarios_instalador?: string | null
          created_at?: string | null
          created_by?: string | null
          dificultades_encontradas?: string[] | null
          firma_cliente_url?: string | null
          id?: string
          materiales_adicionales_usados?: string[] | null
          programacion_id?: string | null
          recomendaciones?: string | null
          tiempo_total_minutos?: number | null
        }
        Update: {
          calificacion_servicio?: number | null
          comentarios_cliente?: string | null
          comentarios_instalador?: string | null
          created_at?: string | null
          created_by?: string | null
          dificultades_encontradas?: string[] | null
          firma_cliente_url?: string | null
          id?: string
          materiales_adicionales_usados?: string[] | null
          programacion_id?: string | null
          recomendaciones?: string | null
          tiempo_total_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instalacion_reporte_final_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      instalacion_validaciones: {
        Row: {
          comentarios: string | null
          created_at: string | null
          created_by: string | null
          id: string
          programacion_id: string | null
          puntuacion: number | null
          tipo_validacion: string
          validado: boolean
        }
        Insert: {
          comentarios?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          programacion_id?: string | null
          puntuacion?: number | null
          tipo_validacion: string
          validado?: boolean
        }
        Update: {
          comentarios?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          programacion_id?: string | null
          puntuacion?: number | null
          tipo_validacion?: string
          validado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "instalacion_validaciones_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
        ]
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
      instalador_metricas: {
        Row: {
          calificacion_promedio: number | null
          created_at: string
          horas_trabajadas: number
          id: string
          ingresos_periodo: number
          instalador_id: string
          kilometros_recorridos: number | null
          observaciones: string | null
          periodo_fin: string
          periodo_inicio: string
          porcentaje_calidad: number | null
          porcentaje_puntualidad: number | null
          servicios_cancelados: number
          servicios_completados: number
          tiempo_promedio_instalacion: number | null
          updated_at: string
        }
        Insert: {
          calificacion_promedio?: number | null
          created_at?: string
          horas_trabajadas?: number
          id?: string
          ingresos_periodo?: number
          instalador_id: string
          kilometros_recorridos?: number | null
          observaciones?: string | null
          periodo_fin: string
          periodo_inicio: string
          porcentaje_calidad?: number | null
          porcentaje_puntualidad?: number | null
          servicios_cancelados?: number
          servicios_completados?: number
          tiempo_promedio_instalacion?: number | null
          updated_at?: string
        }
        Update: {
          calificacion_promedio?: number | null
          created_at?: string
          horas_trabajadas?: number
          id?: string
          ingresos_periodo?: number
          instalador_id?: string
          kilometros_recorridos?: number | null
          observaciones?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          porcentaje_calidad?: number | null
          porcentaje_puntualidad?: number | null
          servicios_cancelados?: number
          servicios_completados?: number
          tiempo_promedio_instalacion?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instalador_metricas_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      instalador_ubicaciones: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          instalador_id: string
          latitud: number
          longitud: number
          precision_metros: number | null
          timestamp: string
          tipo_ubicacion: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id?: string
          instalador_id: string
          latitud: number
          longitud: number
          precision_metros?: number | null
          timestamp?: string
          tipo_ubicacion?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          instalador_id?: string
          latitud?: number
          longitud?: number
          precision_metros?: number | null
          timestamp?: string
          tipo_ubicacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "instalador_ubicaciones_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      instaladores: {
        Row: {
          acepta_pagos_cheque: boolean | null
          acepta_pagos_efectivo: boolean | null
          acepta_pagos_transferencia: boolean | null
          activo_empresa: boolean | null
          banco_datos: Json | null
          calificacion_promedio: number | null
          capacidad_vehiculos: string[] | null
          cedula_profesional: string | null
          certificaciones: string[] | null
          ciudad_trabajo: string | null
          created_at: string | null
          datos_vehiculo: Json | null
          direccion_taller: string | null
          disponibilidad_horaria: Json | null
          documentacion_completa: boolean | null
          email: string
          empresa_id: string | null
          especialidades: string[] | null
          estado_afiliacion: string | null
          estado_trabajo: string | null
          experiencia_especifica: Json | null
          fecha_afiliacion: string | null
          herramientas_disponibles: string[] | null
          horario_atencion: Json | null
          id: string
          nombre_completo: string
          observaciones_adicionales: string | null
          porcentaje_anticipo: number | null
          requiere_anticipo: boolean | null
          servicios_completados: number | null
          tarifa_boton_panico: number | null
          tarifa_camara_seguridad: number | null
          tarifa_gps_personal: number | null
          tarifa_gps_vehicular: number | null
          tarifa_instalacion_basica: number | null
          tarifa_instalacion_compleja: number | null
          tarifa_kilometraje: number | null
          tarifa_mantenimiento: number | null
          tarifa_sensor_combustible: number | null
          tarifa_sensor_temperatura: number | null
          telefono: string
          tiene_taller: boolean | null
          tipo_instalador: string
          tipo_servicios_preferidos: string[] | null
          updated_at: string | null
          user_id: string | null
          vehiculo_propio: boolean | null
          zona_cobertura: Json | null
          zonas_trabajo: string[] | null
        }
        Insert: {
          acepta_pagos_cheque?: boolean | null
          acepta_pagos_efectivo?: boolean | null
          acepta_pagos_transferencia?: boolean | null
          activo_empresa?: boolean | null
          banco_datos?: Json | null
          calificacion_promedio?: number | null
          capacidad_vehiculos?: string[] | null
          cedula_profesional?: string | null
          certificaciones?: string[] | null
          ciudad_trabajo?: string | null
          created_at?: string | null
          datos_vehiculo?: Json | null
          direccion_taller?: string | null
          disponibilidad_horaria?: Json | null
          documentacion_completa?: boolean | null
          email: string
          empresa_id?: string | null
          especialidades?: string[] | null
          estado_afiliacion?: string | null
          estado_trabajo?: string | null
          experiencia_especifica?: Json | null
          fecha_afiliacion?: string | null
          herramientas_disponibles?: string[] | null
          horario_atencion?: Json | null
          id?: string
          nombre_completo: string
          observaciones_adicionales?: string | null
          porcentaje_anticipo?: number | null
          requiere_anticipo?: boolean | null
          servicios_completados?: number | null
          tarifa_boton_panico?: number | null
          tarifa_camara_seguridad?: number | null
          tarifa_gps_personal?: number | null
          tarifa_gps_vehicular?: number | null
          tarifa_instalacion_basica?: number | null
          tarifa_instalacion_compleja?: number | null
          tarifa_kilometraje?: number | null
          tarifa_mantenimiento?: number | null
          tarifa_sensor_combustible?: number | null
          tarifa_sensor_temperatura?: number | null
          telefono: string
          tiene_taller?: boolean | null
          tipo_instalador?: string
          tipo_servicios_preferidos?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          vehiculo_propio?: boolean | null
          zona_cobertura?: Json | null
          zonas_trabajo?: string[] | null
        }
        Update: {
          acepta_pagos_cheque?: boolean | null
          acepta_pagos_efectivo?: boolean | null
          acepta_pagos_transferencia?: boolean | null
          activo_empresa?: boolean | null
          banco_datos?: Json | null
          calificacion_promedio?: number | null
          capacidad_vehiculos?: string[] | null
          cedula_profesional?: string | null
          certificaciones?: string[] | null
          ciudad_trabajo?: string | null
          created_at?: string | null
          datos_vehiculo?: Json | null
          direccion_taller?: string | null
          disponibilidad_horaria?: Json | null
          documentacion_completa?: boolean | null
          email?: string
          empresa_id?: string | null
          especialidades?: string[] | null
          estado_afiliacion?: string | null
          estado_trabajo?: string | null
          experiencia_especifica?: Json | null
          fecha_afiliacion?: string | null
          herramientas_disponibles?: string[] | null
          horario_atencion?: Json | null
          id?: string
          nombre_completo?: string
          observaciones_adicionales?: string | null
          porcentaje_anticipo?: number | null
          requiere_anticipo?: boolean | null
          servicios_completados?: number | null
          tarifa_boton_panico?: number | null
          tarifa_camara_seguridad?: number | null
          tarifa_gps_personal?: number | null
          tarifa_gps_vehicular?: number | null
          tarifa_instalacion_basica?: number | null
          tarifa_instalacion_compleja?: number | null
          tarifa_kilometraje?: number | null
          tarifa_mantenimiento?: number | null
          tarifa_sensor_combustible?: number | null
          tarifa_sensor_temperatura?: number | null
          telefono?: string
          tiene_taller?: boolean | null
          tipo_instalador?: string
          tipo_servicios_preferidos?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          vehiculo_propio?: boolean | null
          zona_cobertura?: Json | null
          zonas_trabajo?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "instaladores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas_instaladoras"
            referencedColumns: ["id"]
          },
        ]
      }
      instaladores_datos_fiscales: {
        Row: {
          banco: string | null
          ciudad_fiscal: string
          clabe_interbancaria: string | null
          codigo_postal_fiscal: string
          created_at: string | null
          cuenta_bancaria: string | null
          direccion_fiscal: string
          documentos_fiscales: Json | null
          email_facturacion: string
          estado_fiscal: string
          fecha_verificacion: string | null
          id: string
          instalador_id: string
          observaciones_verificacion: string | null
          razon_social: string
          regimen_fiscal: string
          rfc: string
          telefono_facturacion: string | null
          titular_cuenta: string | null
          updated_at: string | null
          verificado: boolean | null
          verificado_por: string | null
        }
        Insert: {
          banco?: string | null
          ciudad_fiscal: string
          clabe_interbancaria?: string | null
          codigo_postal_fiscal: string
          created_at?: string | null
          cuenta_bancaria?: string | null
          direccion_fiscal: string
          documentos_fiscales?: Json | null
          email_facturacion: string
          estado_fiscal: string
          fecha_verificacion?: string | null
          id?: string
          instalador_id: string
          observaciones_verificacion?: string | null
          razon_social: string
          regimen_fiscal: string
          rfc: string
          telefono_facturacion?: string | null
          titular_cuenta?: string | null
          updated_at?: string | null
          verificado?: boolean | null
          verificado_por?: string | null
        }
        Update: {
          banco?: string | null
          ciudad_fiscal?: string
          clabe_interbancaria?: string | null
          codigo_postal_fiscal?: string
          created_at?: string | null
          cuenta_bancaria?: string | null
          direccion_fiscal?: string
          documentos_fiscales?: Json | null
          email_facturacion?: string
          estado_fiscal?: string
          fecha_verificacion?: string | null
          id?: string
          instalador_id?: string
          observaciones_verificacion?: string | null
          razon_social?: string
          regimen_fiscal?: string
          rfc?: string
          telefono_facturacion?: string | null
          titular_cuenta?: string | null
          updated_at?: string | null
          verificado?: boolean | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instaladores_datos_fiscales_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_progress: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lead_id: string
          progress_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id: string
          progress_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id?: string
          progress_data?: Json
          updated_at?: string
          user_id?: string
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
      inventario_instalador: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string
          equipo_nombre: string
          equipo_tipo: string
          estado: string
          fecha_asignacion: string
          fecha_devolucion: string | null
          id: string
          instalador_id: string
          numero_serie: string | null
          observaciones: string | null
          responsable_asignacion: string | null
          updated_at: string
        }
        Insert: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          equipo_nombre: string
          equipo_tipo: string
          estado?: string
          fecha_asignacion?: string
          fecha_devolucion?: string | null
          id?: string
          instalador_id: string
          numero_serie?: string | null
          observaciones?: string | null
          responsable_asignacion?: string | null
          updated_at?: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          equipo_nombre?: string
          equipo_tipo?: string
          estado?: string
          fecha_asignacion?: string
          fecha_devolucion?: string | null
          id?: string
          instalador_id?: string
          numero_serie?: string | null
          observaciones?: string | null
          responsable_asignacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_instalador_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_microsd: {
        Row: {
          capacidad_gb: number
          clase_velocidad: string | null
          created_at: string | null
          estado: string
          fecha_compra: string | null
          gps_asignado: string | null
          id: string
          instalacion_asignada: string | null
          marca: string
          modelo: string
          numero_serie: string
          observaciones: string | null
          precio_compra: number | null
          proveedor_id: string | null
          updated_at: string | null
        }
        Insert: {
          capacidad_gb: number
          clase_velocidad?: string | null
          created_at?: string | null
          estado?: string
          fecha_compra?: string | null
          gps_asignado?: string | null
          id?: string
          instalacion_asignada?: string | null
          marca: string
          modelo: string
          numero_serie: string
          observaciones?: string | null
          precio_compra?: number | null
          proveedor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidad_gb?: number
          clase_velocidad?: string | null
          created_at?: string | null
          estado?: string
          fecha_compra?: string | null
          gps_asignado?: string | null
          id?: string
          instalacion_asignada?: string | null
          marca?: string
          modelo?: string
          numero_serie?: string
          observaciones?: string | null
          precio_compra?: number | null
          proveedor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_microsd_gps_asignado_fkey"
            columns: ["gps_asignado"]
            isOneToOne: false
            referencedRelation: "inventario_gps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_microsd_instalacion_asignada_fkey"
            columns: ["instalacion_asignada"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_microsd_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_sim: {
        Row: {
          costo_mensual: number | null
          created_at: string | null
          datos_incluidos_mb: number | null
          estado: string
          fecha_activacion: string | null
          fecha_vencimiento: string | null
          gps_asignado: string | null
          id: string
          instalacion_asignada: string | null
          numero_iccid: string
          numero_sim: string
          observaciones: string | null
          operador: string
          pin_puk: string | null
          tipo_plan: string
          updated_at: string | null
        }
        Insert: {
          costo_mensual?: number | null
          created_at?: string | null
          datos_incluidos_mb?: number | null
          estado?: string
          fecha_activacion?: string | null
          fecha_vencimiento?: string | null
          gps_asignado?: string | null
          id?: string
          instalacion_asignada?: string | null
          numero_iccid: string
          numero_sim: string
          observaciones?: string | null
          operador: string
          pin_puk?: string | null
          tipo_plan: string
          updated_at?: string | null
        }
        Update: {
          costo_mensual?: number | null
          created_at?: string | null
          datos_incluidos_mb?: number | null
          estado?: string
          fecha_activacion?: string | null
          fecha_vencimiento?: string | null
          gps_asignado?: string | null
          id?: string
          instalacion_asignada?: string | null
          numero_iccid?: string
          numero_sim?: string
          observaciones?: string | null
          operador?: string
          pin_puk?: string | null
          tipo_plan?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_sim_gps_asignado_fkey"
            columns: ["gps_asignado"]
            isOneToOne: false
            referencedRelation: "inventario_gps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_sim_instalacion_asignada_fkey"
            columns: ["instalacion_asignada"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      kits_instalacion: {
        Row: {
          created_at: string | null
          estado_kit: string
          fecha_envio: string | null
          fecha_instalacion: string | null
          fecha_preparacion: string | null
          fecha_validacion: string | null
          gps_id: string
          id: string
          instalado_por: string | null
          microsd_id: string | null
          numero_tracking: string | null
          observaciones_instalacion: string | null
          observaciones_preparacion: string | null
          observaciones_validacion: string | null
          preparado_por: string | null
          programacion_id: string
          sim_id: string | null
          updated_at: string | null
          validado_por: string | null
        }
        Insert: {
          created_at?: string | null
          estado_kit?: string
          fecha_envio?: string | null
          fecha_instalacion?: string | null
          fecha_preparacion?: string | null
          fecha_validacion?: string | null
          gps_id: string
          id?: string
          instalado_por?: string | null
          microsd_id?: string | null
          numero_tracking?: string | null
          observaciones_instalacion?: string | null
          observaciones_preparacion?: string | null
          observaciones_validacion?: string | null
          preparado_por?: string | null
          programacion_id: string
          sim_id?: string | null
          updated_at?: string | null
          validado_por?: string | null
        }
        Update: {
          created_at?: string | null
          estado_kit?: string
          fecha_envio?: string | null
          fecha_instalacion?: string | null
          fecha_preparacion?: string | null
          fecha_validacion?: string | null
          gps_id?: string
          id?: string
          instalado_por?: string | null
          microsd_id?: string | null
          numero_tracking?: string | null
          observaciones_instalacion?: string | null
          observaciones_preparacion?: string | null
          observaciones_validacion?: string | null
          preparado_por?: string | null
          programacion_id?: string
          sim_id?: string | null
          updated_at?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kits_instalacion_gps_id_fkey"
            columns: ["gps_id"]
            isOneToOne: true
            referencedRelation: "inventario_gps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_instalado_por_fkey"
            columns: ["instalado_por"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_microsd_id_fkey"
            columns: ["microsd_id"]
            isOneToOne: true
            referencedRelation: "inventario_microsd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: true
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_sim_id_fkey"
            columns: ["sim_id"]
            isOneToOne: true
            referencedRelation: "inventario_sim"
            referencedColumns: ["id"]
          },
        ]
      }
      kits_instalacion_asignados: {
        Row: {
          created_at: string | null
          estado_kit: string | null
          fecha_asignacion: string | null
          fecha_instalacion: string | null
          gps_producto_id: string | null
          id: string
          justificacion_seleccion: Json | null
          microsd_producto_id: string | null
          numero_serie_kit: string | null
          programacion_id: string
          score_recomendacion: number | null
          sim_producto_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado_kit?: string | null
          fecha_asignacion?: string | null
          fecha_instalacion?: string | null
          gps_producto_id?: string | null
          id?: string
          justificacion_seleccion?: Json | null
          microsd_producto_id?: string | null
          numero_serie_kit?: string | null
          programacion_id: string
          score_recomendacion?: number | null
          sim_producto_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado_kit?: string | null
          fecha_asignacion?: string | null
          fecha_instalacion?: string | null
          gps_producto_id?: string | null
          id?: string
          justificacion_seleccion?: Json | null
          microsd_producto_id?: string | null
          numero_serie_kit?: string | null
          programacion_id?: string
          score_recomendacion?: number | null
          sim_producto_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kits_instalacion_asignados_gps_producto_id_fkey"
            columns: ["gps_producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_asignados_microsd_producto_id_fkey"
            columns: ["microsd_producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_asignados_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kits_instalacion_asignados_sim_producto_id_fkey"
            columns: ["sim_producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
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
          interview_interrupted: boolean | null
          interview_method: string | null
          last_session_id: string | null
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
          interview_interrupted?: boolean | null
          interview_method?: string | null
          last_session_id?: string | null
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
          interview_interrupted?: boolean | null
          interview_method?: string | null
          last_session_id?: string | null
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
          contact_attempts_count: number | null
          created_at: string
          credenciales_enviadas: boolean | null
          email: string
          empresa: string | null
          estado: string | null
          fecha_activacion_custodio: string | null
          fecha_aprobacion: string | null
          fecha_contacto: string | null
          fecha_creacion: string
          fecha_entrada_pool: string | null
          fecha_instalacion_gps: string | null
          fecha_psicometricos: string | null
          fecha_toxicologicos: string | null
          fuente: string | null
          id: string
          interruption_reason: string | null
          interview_in_progress: boolean | null
          interview_session_id: string | null
          interview_started_at: string | null
          last_autosave_at: string | null
          last_contact_attempt_at: string | null
          last_contact_outcome: string | null
          last_interview_data: Json | null
          mensaje: string | null
          motivo_pool: string | null
          motivo_rechazo: string | null
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
          zona_preferida_id: string | null
        }
        Insert: {
          asignado_a?: string | null
          contact_attempts_count?: number | null
          created_at?: string
          credenciales_enviadas?: boolean | null
          email: string
          empresa?: string | null
          estado?: string | null
          fecha_activacion_custodio?: string | null
          fecha_aprobacion?: string | null
          fecha_contacto?: string | null
          fecha_creacion?: string
          fecha_entrada_pool?: string | null
          fecha_instalacion_gps?: string | null
          fecha_psicometricos?: string | null
          fecha_toxicologicos?: string | null
          fuente?: string | null
          id?: string
          interruption_reason?: string | null
          interview_in_progress?: boolean | null
          interview_session_id?: string | null
          interview_started_at?: string | null
          last_autosave_at?: string | null
          last_contact_attempt_at?: string | null
          last_contact_outcome?: string | null
          last_interview_data?: Json | null
          mensaje?: string | null
          motivo_pool?: string | null
          motivo_rechazo?: string | null
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
          zona_preferida_id?: string | null
        }
        Update: {
          asignado_a?: string | null
          contact_attempts_count?: number | null
          created_at?: string
          credenciales_enviadas?: boolean | null
          email?: string
          empresa?: string | null
          estado?: string | null
          fecha_activacion_custodio?: string | null
          fecha_aprobacion?: string | null
          fecha_contacto?: string | null
          fecha_creacion?: string
          fecha_entrada_pool?: string | null
          fecha_instalacion_gps?: string | null
          fecha_psicometricos?: string | null
          fecha_toxicologicos?: string | null
          fuente?: string | null
          id?: string
          interruption_reason?: string | null
          interview_in_progress?: boolean | null
          interview_session_id?: string | null
          interview_started_at?: string | null
          last_autosave_at?: string | null
          last_contact_attempt_at?: string | null
          last_contact_outcome?: string | null
          last_interview_data?: Json | null
          mensaje?: string | null
          motivo_pool?: string | null
          motivo_rechazo?: string | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
          zona_preferida_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_zona_preferida_id_fkey"
            columns: ["zona_preferida_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_inventario: {
        Row: {
          activo: boolean
          cantidad_disponible: number
          cantidad_inicial: number
          costo_unitario: number
          created_at: string
          fecha_compra: string
          fecha_vencimiento: string | null
          id: string
          notas: string | null
          numero_lote: string
          orden_compra_id: string | null
          producto_id: string
          proveedor_id: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cantidad_disponible?: number
          cantidad_inicial: number
          costo_unitario: number
          created_at?: string
          fecha_compra?: string
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          numero_lote: string
          orden_compra_id?: string | null
          producto_id: string
          proveedor_id?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cantidad_disponible?: number
          cantidad_inicial?: number
          costo_unitario?: number
          created_at?: string
          fecha_compra?: string
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          numero_lote?: string
          orden_compra_id?: string | null
          producto_id?: string
          proveedor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_inventario_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_inventario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_log: {
        Row: {
          created_at: string
          executed_at: string
          id: string
          operation_details: string | null
          operation_type: string
          records_affected: number | null
          table_name: string
        }
        Insert: {
          created_at?: string
          executed_at?: string
          id?: string
          operation_details?: string | null
          operation_type: string
          records_affected?: number | null
          table_name: string
        }
        Update: {
          created_at?: string
          executed_at?: string
          id?: string
          operation_details?: string | null
          operation_type?: string
          records_affected?: number | null
          table_name?: string
        }
        Relationships: []
      }
      manual_call_logs: {
        Row: {
          call_datetime: string | null
          call_duration_minutes: number | null
          call_notes: string | null
          call_outcome: string
          caller_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          requires_reschedule: boolean | null
          rescheduled_from_call_id: string | null
          scheduled_datetime: string | null
          updated_at: string | null
        }
        Insert: {
          call_datetime?: string | null
          call_duration_minutes?: number | null
          call_notes?: string | null
          call_outcome: string
          caller_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          requires_reschedule?: boolean | null
          rescheduled_from_call_id?: string | null
          scheduled_datetime?: string | null
          updated_at?: string | null
        }
        Update: {
          call_datetime?: string | null
          call_duration_minutes?: number | null
          call_notes?: string | null
          call_outcome?: string
          caller_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          requires_reschedule?: boolean | null
          rescheduled_from_call_id?: string | null
          scheduled_datetime?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_call_logs_rescheduled_from_call_id_fkey"
            columns: ["rescheduled_from_call_id"]
            isOneToOne: false
            referencedRelation: "manual_call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas_gps: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          nombre: string
          pais_origen: string | null
          sitio_web: string | null
          soporte_wialon: boolean | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre: string
          pais_origen?: string | null
          sitio_web?: string | null
          soporte_wialon?: boolean | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre?: string
          pais_origen?: string | null
          sitio_web?: string | null
          soporte_wialon?: boolean | null
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
      matriz_precios_rutas: {
        Row: {
          activo: boolean
          clave: string | null
          cliente_nombre: string
          costo_custodio: number | null
          costo_maximo_casetas: number | null
          costo_operativo: number | null
          created_at: string
          created_by: string | null
          destino_texto: string
          dias_operacion: string | null
          distancia_km: number | null
          fecha_vigencia: string
          id: string
          margen_neto_calculado: number | null
          origen_texto: string | null
          pago_custodio_sin_arma: number | null
          porcentaje_utilidad: number | null
          precio_custodio: number
          precio_desde_casa: number | null
          precio_historico_2022: number | null
          precio_operativo_logistico: number | null
          tipo_servicio: string | null
          tipo_viaje: string | null
          updated_at: string
          valor_bruto: number
        }
        Insert: {
          activo?: boolean
          clave?: string | null
          cliente_nombre: string
          costo_custodio?: number | null
          costo_maximo_casetas?: number | null
          costo_operativo?: number | null
          created_at?: string
          created_by?: string | null
          destino_texto: string
          dias_operacion?: string | null
          distancia_km?: number | null
          fecha_vigencia?: string
          id?: string
          margen_neto_calculado?: number | null
          origen_texto?: string | null
          pago_custodio_sin_arma?: number | null
          porcentaje_utilidad?: number | null
          precio_custodio: number
          precio_desde_casa?: number | null
          precio_historico_2022?: number | null
          precio_operativo_logistico?: number | null
          tipo_servicio?: string | null
          tipo_viaje?: string | null
          updated_at?: string
          valor_bruto: number
        }
        Update: {
          activo?: boolean
          clave?: string | null
          cliente_nombre?: string
          costo_custodio?: number | null
          costo_maximo_casetas?: number | null
          costo_operativo?: number | null
          created_at?: string
          created_by?: string | null
          destino_texto?: string
          dias_operacion?: string | null
          distancia_km?: number | null
          fecha_vigencia?: string
          id?: string
          margen_neto_calculado?: number | null
          origen_texto?: string | null
          pago_custodio_sin_arma?: number | null
          porcentaje_utilidad?: number | null
          precio_custodio?: number
          precio_desde_casa?: number | null
          precio_historico_2022?: number | null
          precio_operativo_logistico?: number | null
          tipo_servicio?: string | null
          tipo_viaje?: string | null
          updated_at?: string
          valor_bruto?: number
        }
        Relationships: []
      }
      metricas_canales: {
        Row: {
          calidad_promedio: number | null
          canal: string
          candidatos_calificados: number | null
          costo_por_contratacion: number | null
          costo_por_lead: number | null
          created_at: string | null
          custodios_activos: number | null
          custodios_contratados: number | null
          id: string
          inversion: number | null
          leads_generados: number | null
          periodo_fin: string
          periodo_inicio: string
          roi_canal: number | null
          tasa_conversion_candidato_custodio: number | null
          tasa_conversion_lead_candidato: number | null
          tasa_retencion: number | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          calidad_promedio?: number | null
          canal: string
          candidatos_calificados?: number | null
          costo_por_contratacion?: number | null
          costo_por_lead?: number | null
          created_at?: string | null
          custodios_activos?: number | null
          custodios_contratados?: number | null
          id?: string
          inversion?: number | null
          leads_generados?: number | null
          periodo_fin: string
          periodo_inicio: string
          roi_canal?: number | null
          tasa_conversion_candidato_custodio?: number | null
          tasa_conversion_lead_candidato?: number | null
          tasa_retencion?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          calidad_promedio?: number | null
          canal?: string
          candidatos_calificados?: number | null
          costo_por_contratacion?: number | null
          costo_por_lead?: number | null
          created_at?: string | null
          custodios_activos?: number | null
          custodios_contratados?: number | null
          id?: string
          inversion?: number | null
          leads_generados?: number | null
          periodo_fin?: string
          periodo_inicio?: string
          roi_canal?: number | null
          tasa_conversion_candidato_custodio?: number | null
          tasa_conversion_lead_candidato?: number | null
          tasa_retencion?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_canales_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_demanda_zona: {
        Row: {
          created_at: string | null
          custodios_activos: number | null
          custodios_requeridos: number | null
          deficit_custodios: number | null
          gmv_promedio: number | null
          id: string
          ingresos_esperados_custodio: number | null
          periodo_fin: string
          periodo_inicio: string
          score_urgencia: number | null
          servicios_promedio_dia: number | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          created_at?: string | null
          custodios_activos?: number | null
          custodios_requeridos?: number | null
          deficit_custodios?: number | null
          gmv_promedio?: number | null
          id?: string
          ingresos_esperados_custodio?: number | null
          periodo_fin: string
          periodo_inicio: string
          score_urgencia?: number | null
          servicios_promedio_dia?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          created_at?: string | null
          custodios_activos?: number | null
          custodios_requeridos?: number | null
          deficit_custodios?: number | null
          gmv_promedio?: number | null
          id?: string
          ingresos_esperados_custodio?: number | null
          periodo_fin?: string
          periodo_inicio?: string
          score_urgencia?: number | null
          servicios_promedio_dia?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_demanda_zona_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_operacionales_zona: {
        Row: {
          created_at: string | null
          custodios_activos: number | null
          disponibilidad_custodios_horas: number
          eficiencia_operacional: number
          horas_trabajo_dia: number
          id: string
          periodo: string
          ratio_rechazo_promedio: number
          tiempo_respuesta_promedio_minutos: number | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          created_at?: string | null
          custodios_activos?: number | null
          disponibilidad_custodios_horas?: number
          eficiencia_operacional?: number
          horas_trabajo_dia?: number
          id?: string
          periodo?: string
          ratio_rechazo_promedio?: number
          tiempo_respuesta_promedio_minutos?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          created_at?: string | null
          custodios_activos?: number | null
          disponibilidad_custodios_horas?: number
          eficiencia_operacional?: number
          horas_trabajo_dia?: number
          id?: string
          periodo?: string
          ratio_rechazo_promedio?: number
          tiempo_respuesta_promedio_minutos?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_operacionales_zona_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_reclutamiento: {
        Row: {
          canal: string
          candidatos_calificados: number | null
          costo_por_contratacion: number | null
          costo_por_lead: number | null
          created_at: string | null
          custodios_contratados: number | null
          id: string
          inversion_marketing: number | null
          leads_generados: number | null
          periodo_fin: string
          periodo_inicio: string
          tasa_conversion: number | null
          zona_id: string | null
        }
        Insert: {
          canal: string
          candidatos_calificados?: number | null
          costo_por_contratacion?: number | null
          costo_por_lead?: number | null
          created_at?: string | null
          custodios_contratados?: number | null
          id?: string
          inversion_marketing?: number | null
          leads_generados?: number | null
          periodo_fin: string
          periodo_inicio: string
          tasa_conversion?: number | null
          zona_id?: string | null
        }
        Update: {
          canal?: string
          candidatos_calificados?: number | null
          costo_por_contratacion?: number | null
          costo_por_lead?: number | null
          created_at?: string | null
          custodios_contratados?: number | null
          id?: string
          inversion_marketing?: number | null
          leads_generados?: number | null
          periodo_fin?: string
          periodo_inicio?: string
          tasa_conversion?: number | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_reclutamiento_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_retencion_mensual: {
        Row: {
          created_at: string
          custodios_mes_actual: number
          custodios_mes_anterior: number
          custodios_nuevos: number
          custodios_perdidos: number
          custodios_retenidos: number
          id: string
          mes: string
          tasa_retencion: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          custodios_mes_actual?: number
          custodios_mes_anterior?: number
          custodios_nuevos?: number
          custodios_perdidos?: number
          custodios_retenidos?: number
          id?: string
          mes: string
          tasa_retencion?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          custodios_mes_actual?: number
          custodios_mes_anterior?: number
          custodios_nuevos?: number
          custodios_perdidos?: number
          custodios_retenidos?: number
          id?: string
          mes?: string
          tasa_retencion?: number
          updated_at?: string
        }
        Relationships: []
      }
      ml_model_configurations: {
        Row: {
          created_at: string
          hyperparameters: Json
          id: string
          is_active: boolean
          model_id: string
          model_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          hyperparameters?: Json
          id?: string
          is_active?: boolean
          model_id: string
          model_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          hyperparameters?: Json
          id?: string
          is_active?: boolean
          model_id?: string
          model_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      modelos_gps: {
        Row: {
          activo: boolean | null
          alimentacion_externa: string | null
          bateria_interna: boolean | null
          certificaciones: string[] | null
          conectividad: string[] | null
          created_at: string | null
          dimensiones: string | null
          disponible_mexico: boolean | null
          entradas_analogicas: number | null
          entradas_digitales: number | null
          especificaciones_json: Json | null
          gps_precision: string | null
          id: string
          marca_id: string | null
          nombre: string
          observaciones: string | null
          peso_gramos: number | null
          precio_referencia_usd: number | null
          protocolo_comunicacion: string[] | null
          resistencia_agua: string | null
          salidas_digitales: number | null
          sensores_soportados: string[] | null
          temperatura_operacion: string | null
          tipo_dispositivo: string | null
        }
        Insert: {
          activo?: boolean | null
          alimentacion_externa?: string | null
          bateria_interna?: boolean | null
          certificaciones?: string[] | null
          conectividad?: string[] | null
          created_at?: string | null
          dimensiones?: string | null
          disponible_mexico?: boolean | null
          entradas_analogicas?: number | null
          entradas_digitales?: number | null
          especificaciones_json?: Json | null
          gps_precision?: string | null
          id?: string
          marca_id?: string | null
          nombre: string
          observaciones?: string | null
          peso_gramos?: number | null
          precio_referencia_usd?: number | null
          protocolo_comunicacion?: string[] | null
          resistencia_agua?: string | null
          salidas_digitales?: number | null
          sensores_soportados?: string[] | null
          temperatura_operacion?: string | null
          tipo_dispositivo?: string | null
        }
        Update: {
          activo?: boolean | null
          alimentacion_externa?: string | null
          bateria_interna?: boolean | null
          certificaciones?: string[] | null
          conectividad?: string[] | null
          created_at?: string | null
          dimensiones?: string | null
          disponible_mexico?: boolean | null
          entradas_analogicas?: number | null
          entradas_digitales?: number | null
          especificaciones_json?: Json | null
          gps_precision?: string | null
          id?: string
          marca_id?: string | null
          nombre?: string
          observaciones?: string | null
          peso_gramos?: number | null
          precio_referencia_usd?: number | null
          protocolo_comunicacion?: string[] | null
          resistencia_agua?: string | null
          salidas_digitales?: number | null
          sensores_soportados?: string[] | null
          temperatura_operacion?: string | null
          tipo_dispositivo?: string | null
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
      movimientos_comodato: {
        Row: {
          comodato_id: string
          created_at: string
          datos_adicionales: Json | null
          evidencias: Json | null
          fecha_movimiento: string
          id: string
          observaciones: string | null
          tipo_movimiento: string
          usuario_id: string
        }
        Insert: {
          comodato_id: string
          created_at?: string
          datos_adicionales?: Json | null
          evidencias?: Json | null
          fecha_movimiento?: string
          id?: string
          observaciones?: string | null
          tipo_movimiento: string
          usuario_id: string
        }
        Update: {
          comodato_id?: string
          created_at?: string
          datos_adicionales?: Json | null
          evidencias?: Json | null
          fecha_movimiento?: string
          id?: string
          observaciones?: string | null
          tipo_movimiento?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_movimientos_comodato_usuario"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_comodato_comodato_id_fkey"
            columns: ["comodato_id"]
            isOneToOne: false
            referencedRelation: "comodatos_gps"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          cantidad_anterior: number
          cantidad_nueva: number
          costo_unitario: number | null
          fecha_movimiento: string | null
          id: string
          motivo: string | null
          notas: string | null
          producto_id: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo_movimiento: string
          usuario_id: string | null
          valor_total: number | null
        }
        Insert: {
          cantidad: number
          cantidad_anterior: number
          cantidad_nueva: number
          costo_unitario?: number | null
          fecha_movimiento?: string | null
          id?: string
          motivo?: string | null
          notas?: string | null
          producto_id: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimiento: string
          usuario_id?: string | null
          valor_total?: number | null
        }
        Update: {
          cantidad?: number
          cantidad_anterior?: number
          cantidad_nueva?: number
          costo_unitario?: number | null
          fecha_movimiento?: string | null
          id?: string
          motivo?: string | null
          notas?: string | null
          producto_id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimiento?: string
          usuario_id?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_stock: {
        Row: {
          cantidad: number
          cantidad_anterior: number
          cantidad_nueva: number
          created_at: string | null
          fecha_movimiento: string | null
          id: string
          motivo: string | null
          producto_id: string
          referencia: string | null
          tipo_movimiento: string
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          cantidad_anterior: number
          cantidad_nueva: number
          created_at?: string | null
          fecha_movimiento?: string | null
          id?: string
          motivo?: string | null
          producto_id: string
          referencia?: string | null
          tipo_movimiento: string
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          cantidad_anterior?: number
          cantidad_nueva?: number
          created_at?: string | null
          fecha_movimiento?: string | null
          id?: string
          motivo?: string | null
          producto_id?: string
          referencia?: string | null
          tipo_movimiento?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      normas_instalacion: {
        Row: {
          activa: boolean
          categoria: string
          created_at: string
          created_by: string | null
          descripcion: string
          id: string
          nombre_norma: string
          pasos_requeridos: Json
          puntuacion_maxima: number
          tipo_equipo: string
          updated_at: string
          version: string
        }
        Insert: {
          activa?: boolean
          categoria: string
          created_at?: string
          created_by?: string | null
          descripcion: string
          id?: string
          nombre_norma: string
          pasos_requeridos: Json
          puntuacion_maxima?: number
          tipo_equipo: string
          updated_at?: string
          version?: string
        }
        Update: {
          activa?: boolean
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string
          id?: string
          nombre_norma?: string
          pasos_requeridos?: Json
          puntuacion_maxima?: number
          tipo_equipo?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ordenes_compra: {
        Row: {
          aprobado_por: string | null
          creado_por: string | null
          created_at: string | null
          estado: string | null
          fecha_aprobacion: string | null
          fecha_entrega_esperada: string | null
          fecha_entrega_real: string | null
          fecha_orden: string | null
          id: string
          impuestos: number | null
          moneda: string | null
          notas: string | null
          numero_orden: string
          proveedor_id: string
          subtotal: number | null
          terminos_pago: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          aprobado_por?: string | null
          creado_por?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_entrega_esperada?: string | null
          fecha_entrega_real?: string | null
          fecha_orden?: string | null
          id?: string
          impuestos?: number | null
          moneda?: string | null
          notas?: string | null
          numero_orden: string
          proveedor_id: string
          subtotal?: number | null
          terminos_pago?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          aprobado_por?: string | null
          creado_por?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_entrega_esperada?: string | null
          fecha_entrega_real?: string | null
          fecha_orden?: string | null
          id?: string
          impuestos?: number | null
          moneda?: string | null
          notas?: string | null
          numero_orden?: string
          proveedor_id?: string
          subtotal?: number | null
          terminos_pago?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_compra_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_instaladores: {
        Row: {
          comprobante_url: string | null
          concepto: string
          created_at: string
          created_by: string | null
          estado_pago: string
          fecha_pago: string | null
          fecha_trabajo: string
          id: string
          instalador_id: string
          metodo_pago: string | null
          monto: number
          observaciones: string | null
          referencia_pago: string | null
          servicio_id: string | null
          updated_at: string
        }
        Insert: {
          comprobante_url?: string | null
          concepto: string
          created_at?: string
          created_by?: string | null
          estado_pago?: string
          fecha_pago?: string | null
          fecha_trabajo: string
          id?: string
          instalador_id: string
          metodo_pago?: string | null
          monto: number
          observaciones?: string | null
          referencia_pago?: string | null
          servicio_id?: string | null
          updated_at?: string
        }
        Update: {
          comprobante_url?: string | null
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado_pago?: string
          fecha_pago?: string | null
          fecha_trabajo?: string
          id?: string
          instalador_id?: string
          metodo_pago?: string | null
          monto?: number
          observaciones?: string | null
          referencia_pago?: string | null
          servicio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_instaladores_instalador_id_fkey"
            columns: ["instalador_id"]
            isOneToOne: false
            referencedRelation: "instaladores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_instaladores_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
      }
      patrones_demanda_temporal: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          dia_semana: number | null
          factor_multiplicador: number
          hora_inicio: number | null
          id: string
          mes: number | null
          tipo_patron: string
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dia_semana?: number | null
          factor_multiplicador?: number
          hora_inicio?: number | null
          id?: string
          mes?: number | null
          tipo_patron: string
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dia_semana?: number | null
          factor_multiplicador?: number
          hora_inicio?: number | null
          id?: string
          mes?: number | null
          tipo_patron?: string
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patrones_demanda_temporal_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_asignaciones: {
        Row: {
          aceptada_en: string | null
          confirmada_en: string | null
          confirmada_por: string | null
          confirmada_por_planificador: boolean | null
          created_at: string | null
          custodio_id: string
          id: string
          notas: string | null
          oferta_id: string | null
          servicio_id: string
        }
        Insert: {
          aceptada_en?: string | null
          confirmada_en?: string | null
          confirmada_por?: string | null
          confirmada_por_planificador?: boolean | null
          created_at?: string | null
          custodio_id: string
          id?: string
          notas?: string | null
          oferta_id?: string | null
          servicio_id: string
        }
        Update: {
          aceptada_en?: string | null
          confirmada_en?: string | null
          confirmada_por?: string | null
          confirmada_por_planificador?: boolean | null
          created_at?: string | null
          custodio_id?: string
          id?: string
          notas?: string | null
          oferta_id?: string | null
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pc_asignaciones_custodio_id_fkey"
            columns: ["custodio_id"]
            isOneToOne: false
            referencedRelation: "pc_custodios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_asignaciones_oferta_id_fkey"
            columns: ["oferta_id"]
            isOneToOne: false
            referencedRelation: "pc_ofertas_custodio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_asignaciones_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: true
            referencedRelation: "pc_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_audit_log: {
        Row: {
          accion: string
          entidad: string
          entidad_id: string | null
          id: string
          ip_address: unknown | null
          payload: Json | null
          timestamp: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          entidad: string
          entidad_id?: string | null
          id?: string
          ip_address?: unknown | null
          payload?: Json | null
          timestamp?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          entidad?: string
          entidad_id?: string | null
          id?: string
          ip_address?: unknown | null
          payload?: Json | null
          timestamp?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      pc_clientes: {
        Row: {
          activo: boolean | null
          contacto_email: string | null
          contacto_nombre: string
          contacto_tel: string
          created_at: string | null
          created_by: string | null
          descuentos_aplicables: Json | null
          forma_pago_preferida: string | null
          id: string
          margen_objetivo_porcentaje: number | null
          nombre: string
          notas: string | null
          rfc: string | null
          search_vector: unknown | null
          sla_minutos_asignacion: number | null
          sla_respuesta_horas: number | null
          tarifas_especiales: boolean | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          contacto_email?: string | null
          contacto_nombre: string
          contacto_tel: string
          created_at?: string | null
          created_by?: string | null
          descuentos_aplicables?: Json | null
          forma_pago_preferida?: string | null
          id?: string
          margen_objetivo_porcentaje?: number | null
          nombre: string
          notas?: string | null
          rfc?: string | null
          search_vector?: unknown | null
          sla_minutos_asignacion?: number | null
          sla_respuesta_horas?: number | null
          tarifas_especiales?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          contacto_email?: string | null
          contacto_nombre?: string
          contacto_tel?: string
          created_at?: string | null
          created_by?: string | null
          descuentos_aplicables?: Json | null
          forma_pago_preferida?: string | null
          id?: string
          margen_objetivo_porcentaje?: number | null
          nombre?: string
          notas?: string | null
          rfc?: string | null
          search_vector?: unknown | null
          sla_minutos_asignacion?: number | null
          sla_respuesta_horas?: number | null
          tarifas_especiales?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pc_config_scoring: {
        Row: {
          activa: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          nombre_config: string
          peso_antiguo_inactivo: number | null
          peso_certificaciones: number | null
          peso_confirmado_disponible: number | null
          peso_distancia_origen: number | null
          peso_gadgets: number | null
          peso_match_tipo: number | null
          peso_rating: number | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre_config: string
          peso_antiguo_inactivo?: number | null
          peso_certificaciones?: number | null
          peso_confirmado_disponible?: number | null
          peso_distancia_origen?: number | null
          peso_gadgets?: number | null
          peso_match_tipo?: number | null
          peso_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre_config?: string
          peso_antiguo_inactivo?: number | null
          peso_certificaciones?: number | null
          peso_confirmado_disponible?: number | null
          peso_distancia_origen?: number | null
          peso_gadgets?: number | null
          peso_match_tipo?: number | null
          peso_rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pc_costos_ingresos: {
        Row: {
          casetas: number | null
          cobro_cliente: number | null
          costo_custodio: number | null
          created_at: string | null
          id: string
          margen: number | null
          notas_costos: string | null
          otros_costos: number | null
          porcentaje_margen: number | null
          servicio_id: string
          updated_at: string | null
          variacion: number | null
          viaticos: number | null
        }
        Insert: {
          casetas?: number | null
          cobro_cliente?: number | null
          costo_custodio?: number | null
          created_at?: string | null
          id?: string
          margen?: number | null
          notas_costos?: string | null
          otros_costos?: number | null
          porcentaje_margen?: number | null
          servicio_id: string
          updated_at?: string | null
          variacion?: number | null
          viaticos?: number | null
        }
        Update: {
          casetas?: number | null
          cobro_cliente?: number | null
          costo_custodio?: number | null
          created_at?: string | null
          id?: string
          margen?: number | null
          notas_costos?: string | null
          otros_costos?: number | null
          porcentaje_margen?: number | null
          servicio_id?: string
          updated_at?: string | null
          variacion?: number | null
          viaticos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_costos_ingresos_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "pc_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_custodios: {
        Row: {
          certificaciones: string[] | null
          comentarios: string | null
          created_at: string | null
          cuenta_bancaria: Json | null
          dias_sin_actividad: number | null
          disponibilidad:
            | Database["public"]["Enums"]["disponibilidad_custodio"]
            | null
          documentos: string[] | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_custodio"] | null
          id: string
          lat: number | null
          lng: number | null
          nombre: string
          rating_promedio: number | null
          search_vector: unknown | null
          tel: string
          tiene_gadgets: boolean | null
          tipo_custodia: Database["public"]["Enums"]["tipo_custodia"] | null
          ultima_actividad: string | null
          updated_at: string | null
          zona_base: string | null
        }
        Insert: {
          certificaciones?: string[] | null
          comentarios?: string | null
          created_at?: string | null
          cuenta_bancaria?: Json | null
          dias_sin_actividad?: number | null
          disponibilidad?:
            | Database["public"]["Enums"]["disponibilidad_custodio"]
            | null
          documentos?: string[] | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_custodio"] | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre: string
          rating_promedio?: number | null
          search_vector?: unknown | null
          tel: string
          tiene_gadgets?: boolean | null
          tipo_custodia?: Database["public"]["Enums"]["tipo_custodia"] | null
          ultima_actividad?: string | null
          updated_at?: string | null
          zona_base?: string | null
        }
        Update: {
          certificaciones?: string[] | null
          comentarios?: string | null
          created_at?: string | null
          cuenta_bancaria?: Json | null
          dias_sin_actividad?: number | null
          disponibilidad?:
            | Database["public"]["Enums"]["disponibilidad_custodio"]
            | null
          documentos?: string[] | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_custodio"] | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre?: string
          rating_promedio?: number | null
          search_vector?: unknown | null
          tel?: string
          tiene_gadgets?: boolean | null
          tipo_custodia?: Database["public"]["Enums"]["tipo_custodia"] | null
          ultima_actividad?: string | null
          updated_at?: string | null
          zona_base?: string | null
        }
        Relationships: []
      }
      pc_eventos_monitoreo: {
        Row: {
          adjuntos: string[] | null
          created_at: string | null
          created_by: string | null
          detalle: string
          id: string
          notas_resolucion: string | null
          resuelto: boolean | null
          resuelto_en: string | null
          resuelto_por: string | null
          servicio_id: string
          severidad: Database["public"]["Enums"]["severidad_evento"] | null
          timestamp: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          ubicacion_lat: number | null
          ubicacion_lng: number | null
        }
        Insert: {
          adjuntos?: string[] | null
          created_at?: string | null
          created_by?: string | null
          detalle: string
          id?: string
          notas_resolucion?: string | null
          resuelto?: boolean | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          servicio_id: string
          severidad?: Database["public"]["Enums"]["severidad_evento"] | null
          timestamp?: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
        }
        Update: {
          adjuntos?: string[] | null
          created_at?: string | null
          created_by?: string | null
          detalle?: string
          id?: string
          notas_resolucion?: string | null
          resuelto?: boolean | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          servicio_id?: string
          severidad?: Database["public"]["Enums"]["severidad_evento"] | null
          timestamp?: string | null
          tipo?: Database["public"]["Enums"]["tipo_evento"]
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_eventos_monitoreo_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "pc_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_ofertas_custodio: {
        Row: {
          canal: Database["public"]["Enums"]["canal_comunicacion"] | null
          created_at: string | null
          custodio_id: string
          enviada_en: string | null
          estado: Database["public"]["Enums"]["estado_oferta"] | null
          expira_en: string | null
          id: string
          mensaje_enviado: string | null
          motivo_rechazo: string | null
          ola_numero: number | null
          respondida_en: string | null
          score_asignacion: number | null
          servicio_id: string
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal_comunicacion"] | null
          created_at?: string | null
          custodio_id: string
          enviada_en?: string | null
          estado?: Database["public"]["Enums"]["estado_oferta"] | null
          expira_en?: string | null
          id?: string
          mensaje_enviado?: string | null
          motivo_rechazo?: string | null
          ola_numero?: number | null
          respondida_en?: string | null
          score_asignacion?: number | null
          servicio_id: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_comunicacion"] | null
          created_at?: string | null
          custodio_id?: string
          enviada_en?: string | null
          estado?: Database["public"]["Enums"]["estado_oferta"] | null
          expira_en?: string | null
          id?: string
          mensaje_enviado?: string | null
          motivo_rechazo?: string | null
          ola_numero?: number | null
          respondida_en?: string | null
          score_asignacion?: number | null
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pc_ofertas_custodio_custodio_id_fkey"
            columns: ["custodio_id"]
            isOneToOne: false
            referencedRelation: "pc_custodios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_ofertas_custodio_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "pc_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_rutas_frecuentes: {
        Row: {
          activa: boolean | null
          cliente_id: string
          costo_operativo_actualizado: number | null
          created_at: string | null
          destino_lat: number | null
          destino_lng: number | null
          destino_texto: string
          distancia_km_real: number | null
          fecha_ultima_actualizacion_precios: string | null
          id: string
          km_estimados: number | null
          margen_objetivo: number | null
          nombre_ruta: string
          origen_lat: number | null
          origen_lng: number | null
          origen_texto: string
          tiempo_estimado_min: number | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          cliente_id: string
          costo_operativo_actualizado?: number | null
          created_at?: string | null
          destino_lat?: number | null
          destino_lng?: number | null
          destino_texto: string
          distancia_km_real?: number | null
          fecha_ultima_actualizacion_precios?: string | null
          id?: string
          km_estimados?: number | null
          margen_objetivo?: number | null
          nombre_ruta: string
          origen_lat?: number | null
          origen_lng?: number | null
          origen_texto: string
          tiempo_estimado_min?: number | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          cliente_id?: string
          costo_operativo_actualizado?: number | null
          created_at?: string | null
          destino_lat?: number | null
          destino_lng?: number | null
          destino_texto?: string
          distancia_km_real?: number | null
          fecha_ultima_actualizacion_precios?: string | null
          id?: string
          km_estimados?: number | null
          margen_objetivo?: number | null
          nombre_ruta?: string
          origen_lat?: number | null
          origen_lng?: number | null
          origen_texto?: string
          tiempo_estimado_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_rutas_frecuentes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "pc_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_servicios: {
        Row: {
          cliente: string | null
          cliente_id: string
          created_at: string | null
          created_by: string | null
          custodio_asignado_id: string | null
          destino_lat: number | null
          destino_lng: number | null
          destino_texto: string
          estado: Database["public"]["Enums"]["estado_servicio"] | null
          fecha_hora_recepcion_servicio: string | null
          fecha_programada: string
          folio: string
          hora_programacion: string | null
          hora_ventana_fin: string
          hora_ventana_inicio: string
          id: string
          motivo_cancelacion: string | null
          notas_especiales: string | null
          origen_lat: number | null
          origen_lng: number | null
          origen_texto: string
          prioridad: number | null
          requiere_gadgets: boolean | null
          tipo_servicio:
            | Database["public"]["Enums"]["tipo_servicio_custodia"]
            | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          cliente?: string | null
          cliente_id: string
          created_at?: string | null
          created_by?: string | null
          custodio_asignado_id?: string | null
          destino_lat?: number | null
          destino_lng?: number | null
          destino_texto: string
          estado?: Database["public"]["Enums"]["estado_servicio"] | null
          fecha_hora_recepcion_servicio?: string | null
          fecha_programada: string
          folio: string
          hora_programacion?: string | null
          hora_ventana_fin: string
          hora_ventana_inicio: string
          id?: string
          motivo_cancelacion?: string | null
          notas_especiales?: string | null
          origen_lat?: number | null
          origen_lng?: number | null
          origen_texto: string
          prioridad?: number | null
          requiere_gadgets?: boolean | null
          tipo_servicio?:
            | Database["public"]["Enums"]["tipo_servicio_custodia"]
            | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          cliente?: string | null
          cliente_id?: string
          created_at?: string | null
          created_by?: string | null
          custodio_asignado_id?: string | null
          destino_lat?: number | null
          destino_lng?: number | null
          destino_texto?: string
          estado?: Database["public"]["Enums"]["estado_servicio"] | null
          fecha_hora_recepcion_servicio?: string | null
          fecha_programada?: string
          folio?: string
          hora_programacion?: string | null
          hora_ventana_fin?: string
          hora_ventana_inicio?: string
          id?: string
          motivo_cancelacion?: string | null
          notas_especiales?: string | null
          origen_lat?: number | null
          origen_lng?: number | null
          origen_texto?: string
          prioridad?: number | null
          requiere_gadgets?: boolean | null
          tipo_servicio?:
            | Database["public"]["Enums"]["tipo_servicio_custodia"]
            | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_servicios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "pc_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_servicios_custodio_asignado_id_fkey"
            columns: ["custodio_asignado_id"]
            isOneToOne: false
            referencedRelation: "pc_custodios"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_touchpoints: {
        Row: {
          actor: Database["public"]["Enums"]["actor_touchpoint"]
          adjuntos: string[] | null
          created_at: string | null
          created_by: string | null
          duracion_min: number | null
          id: string
          medio: Database["public"]["Enums"]["canal_comunicacion"]
          notas: string
          servicio_id: string
          timestamp: string | null
        }
        Insert: {
          actor: Database["public"]["Enums"]["actor_touchpoint"]
          adjuntos?: string[] | null
          created_at?: string | null
          created_by?: string | null
          duracion_min?: number | null
          id?: string
          medio: Database["public"]["Enums"]["canal_comunicacion"]
          notas: string
          servicio_id: string
          timestamp?: string | null
        }
        Update: {
          actor?: Database["public"]["Enums"]["actor_touchpoint"]
          adjuntos?: string[] | null
          created_at?: string | null
          created_by?: string | null
          duracion_min?: number | null
          id?: string
          medio?: Database["public"]["Enums"]["canal_comunicacion"]
          notas?: string
          servicio_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_touchpoints_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "pc_servicios"
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
      pool_reserva_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          fecha_entrada: string | null
          fecha_salida: string | null
          id: string
          lead_id: string
          metadata: Json | null
          motivo: string
          movimiento_tipo: string
          notas: string | null
          reactivado_por: string | null
          zona_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fecha_entrada?: string | null
          fecha_salida?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          motivo: string
          movimiento_tipo: string
          notas?: string | null
          reactivado_por?: string | null
          zona_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fecha_entrada?: string | null
          fecha_salida?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          motivo?: string
          movimiento_tipo?: string
          notas?: string | null
          reactivado_por?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_reserva_movements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_reserva_movements_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos_zona: {
        Row: {
          aprobado_por: string | null
          categoria_id: string | null
          created_at: string | null
          custodios_objetivo: number | null
          estado: string | null
          id: string
          notas: string | null
          periodo_fin: string
          periodo_inicio: string
          presupuesto_asignado: number
          presupuesto_utilizado: number | null
          roi_esperado: number | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          aprobado_por?: string | null
          categoria_id?: string | null
          created_at?: string | null
          custodios_objetivo?: number | null
          estado?: string | null
          id?: string
          notas?: string | null
          periodo_fin: string
          periodo_inicio: string
          presupuesto_asignado: number
          presupuesto_utilizado?: number | null
          roi_esperado?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          aprobado_por?: string | null
          categoria_id?: string | null
          created_at?: string | null
          custodios_objetivo?: number | null
          estado?: string | null
          id?: string
          notas?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          presupuesto_asignado?: number
          presupuesto_utilizado?: number | null
          roi_esperado?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_zona_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_zona_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_inventario: {
        Row: {
          activo: boolean | null
          archivado_por: string | null
          categoria_id: string | null
          certificaciones: string[] | null
          codigo_barras: string | null
          codigo_producto: string
          color: string | null
          compatibilidad_vehiculos: string[] | null
          consumo_energia_mw: number | null
          created_at: string | null
          descripcion: string | null
          dimensiones: string | null
          es_serializado: boolean | null
          especificaciones: Json | null
          estado_producto: string | null
          fecha_archivado: string | null
          foto_url: string | null
          frecuencia_transmision_hz: number | null
          garantia_meses: number | null
          id: string
          marca: string | null
          marca_gps_id: string | null
          modelo: string | null
          modelo_gps_id: string | null
          motivo_archivado: string | null
          nombre: string
          peso_kg: number | null
          precio_compra_promedio: number | null
          precio_venta_sugerido: number | null
          proveedor_id: string | null
          requiere_configuracion: boolean | null
          software_requerido: string | null
          stock_maximo: number | null
          stock_minimo: number | null
          temperatura_operacion: string | null
          ubicacion_almacen: string | null
          unidad_medida: string | null
          updated_at: string | null
          voltaje_operacion: string | null
        }
        Insert: {
          activo?: boolean | null
          archivado_por?: string | null
          categoria_id?: string | null
          certificaciones?: string[] | null
          codigo_barras?: string | null
          codigo_producto: string
          color?: string | null
          compatibilidad_vehiculos?: string[] | null
          consumo_energia_mw?: number | null
          created_at?: string | null
          descripcion?: string | null
          dimensiones?: string | null
          es_serializado?: boolean | null
          especificaciones?: Json | null
          estado_producto?: string | null
          fecha_archivado?: string | null
          foto_url?: string | null
          frecuencia_transmision_hz?: number | null
          garantia_meses?: number | null
          id?: string
          marca?: string | null
          marca_gps_id?: string | null
          modelo?: string | null
          modelo_gps_id?: string | null
          motivo_archivado?: string | null
          nombre: string
          peso_kg?: number | null
          precio_compra_promedio?: number | null
          precio_venta_sugerido?: number | null
          proveedor_id?: string | null
          requiere_configuracion?: boolean | null
          software_requerido?: string | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          temperatura_operacion?: string | null
          ubicacion_almacen?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
          voltaje_operacion?: string | null
        }
        Update: {
          activo?: boolean | null
          archivado_por?: string | null
          categoria_id?: string | null
          certificaciones?: string[] | null
          codigo_barras?: string | null
          codigo_producto?: string
          color?: string | null
          compatibilidad_vehiculos?: string[] | null
          consumo_energia_mw?: number | null
          created_at?: string | null
          descripcion?: string | null
          dimensiones?: string | null
          es_serializado?: boolean | null
          especificaciones?: Json | null
          estado_producto?: string | null
          fecha_archivado?: string | null
          foto_url?: string | null
          frecuencia_transmision_hz?: number | null
          garantia_meses?: number | null
          id?: string
          marca?: string | null
          marca_gps_id?: string | null
          modelo?: string | null
          modelo_gps_id?: string | null
          motivo_archivado?: string | null
          nombre?: string
          peso_kg?: number | null
          precio_compra_promedio?: number | null
          precio_venta_sugerido?: number | null
          proveedor_id?: string | null
          requiere_configuracion?: boolean | null
          software_requerido?: string | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          temperatura_operacion?: string | null
          ubicacion_almacen?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
          voltaje_operacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_inventario_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_inventario_marca_gps_id_fkey"
            columns: ["marca_gps_id"]
            isOneToOne: false
            referencedRelation: "marcas_gps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_inventario_modelo_gps_id_fkey"
            columns: ["modelo_gps_id"]
            isOneToOne: false
            referencedRelation: "modelos_gps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_inventario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_serie: {
        Row: {
          costo_adquisicion: number | null
          created_at: string | null
          estado: string | null
          fecha_ingreso: string | null
          fecha_vencimiento: string | null
          id: string
          imei: string | null
          instalacion_asignada: string | null
          mac_address: string | null
          notas: string | null
          numero_serie: string
          orden_compra_id: string | null
          producto_id: string
          servicio_asignado: string | null
          ubicacion_fisica: string | null
          updated_at: string | null
        }
        Insert: {
          costo_adquisicion?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_ingreso?: string | null
          fecha_vencimiento?: string | null
          id?: string
          imei?: string | null
          instalacion_asignada?: string | null
          mac_address?: string | null
          notas?: string | null
          numero_serie: string
          orden_compra_id?: string | null
          producto_id: string
          servicio_asignado?: string | null
          ubicacion_fisica?: string | null
          updated_at?: string | null
        }
        Update: {
          costo_adquisicion?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_ingreso?: string | null
          fecha_vencimiento?: string | null
          id?: string
          imei?: string | null
          instalacion_asignada?: string | null
          mac_address?: string | null
          notas?: string | null
          numero_serie?: string
          orden_compra_id?: string | null
          producto_id?: string
          servicio_asignado?: string | null
          ubicacion_fisica?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_serie_instalacion_asignada_fkey"
            columns: ["instalacion_asignada"]
            isOneToOne: false
            referencedRelation: "programacion_instalaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_serie_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_serie_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_serie_servicio_asignado_fkey"
            columns: ["servicio_asignado"]
            isOneToOne: false
            referencedRelation: "servicios_monitoreo"
            referencedColumns: ["id"]
          },
        ]
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
          auto_asignacion_completada: boolean | null
          configuracion_sensores: Json | null
          contacto_cliente: string
          coordenadas_instalacion: Json | null
          created_at: string | null
          direccion_instalacion: string
          equipos_requeridos: Json | null
          es_electrico: boolean | null
          estado: string | null
          fecha_estimada_fin: string | null
          fecha_programada: string
          herramientas_especiales: string[] | null
          id: string
          instalador_id: string | null
          instrucciones_especiales: string | null
          kit_asignado_id: string | null
          observaciones_cliente: string | null
          prioridad: string | null
          requiere_vehiculo_elevado: boolean | null
          scoring_recomendacion: Json | null
          servicio_id: string
          telefono_contacto: string
          tiempo_estimado: number | null
          tipo_combustible: string | null
          tipo_instalacion: string
          updated_at: string | null
          vehiculo_año: number | null
          vehiculo_marca: string | null
          vehiculo_modelo: string | null
        }
        Insert: {
          acceso_restringido?: boolean | null
          activo_id?: string | null
          auto_asignacion_completada?: boolean | null
          configuracion_sensores?: Json | null
          contacto_cliente: string
          coordenadas_instalacion?: Json | null
          created_at?: string | null
          direccion_instalacion: string
          equipos_requeridos?: Json | null
          es_electrico?: boolean | null
          estado?: string | null
          fecha_estimada_fin?: string | null
          fecha_programada: string
          herramientas_especiales?: string[] | null
          id?: string
          instalador_id?: string | null
          instrucciones_especiales?: string | null
          kit_asignado_id?: string | null
          observaciones_cliente?: string | null
          prioridad?: string | null
          requiere_vehiculo_elevado?: boolean | null
          scoring_recomendacion?: Json | null
          servicio_id: string
          telefono_contacto: string
          tiempo_estimado?: number | null
          tipo_combustible?: string | null
          tipo_instalacion: string
          updated_at?: string | null
          vehiculo_año?: number | null
          vehiculo_marca?: string | null
          vehiculo_modelo?: string | null
        }
        Update: {
          acceso_restringido?: boolean | null
          activo_id?: string | null
          auto_asignacion_completada?: boolean | null
          configuracion_sensores?: Json | null
          contacto_cliente?: string
          coordenadas_instalacion?: Json | null
          created_at?: string | null
          direccion_instalacion?: string
          equipos_requeridos?: Json | null
          es_electrico?: boolean | null
          estado?: string | null
          fecha_estimada_fin?: string | null
          fecha_programada?: string
          herramientas_especiales?: string[] | null
          id?: string
          instalador_id?: string | null
          instrucciones_especiales?: string | null
          kit_asignado_id?: string | null
          observaciones_cliente?: string | null
          prioridad?: string | null
          requiere_vehiculo_elevado?: boolean | null
          scoring_recomendacion?: Json | null
          servicio_id?: string
          telefono_contacto?: string
          tiempo_estimado?: number | null
          tipo_combustible?: string | null
          tipo_instalacion?: string
          updated_at?: string | null
          vehiculo_año?: number | null
          vehiculo_marca?: string | null
          vehiculo_modelo?: string | null
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
      programacion_llamadas: {
        Row: {
          created_at: string | null
          created_by: string
          estado: string | null
          fecha_programada: string
          id: string
          lead_id: string
          motivo_reprogramacion: string | null
          session_id: string | null
          tipo_llamada: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          estado?: string | null
          fecha_programada: string
          id?: string
          lead_id: string
          motivo_reprogramacion?: string | null
          session_id?: string | null
          tipo_llamada?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          estado?: string | null
          fecha_programada?: string
          id?: string
          lead_id?: string
          motivo_reprogramacion?: string | null
          session_id?: string | null
          tipo_llamada?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programacion_llamadas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean | null
          calificacion: number | null
          condiciones_pago: string | null
          contacto_principal: string | null
          created_at: string | null
          descuento_por_volumen: number | null
          direccion: string | null
          email: string | null
          email_contacto: string | null
          id: string
          nombre: string
          notas: string | null
          razon_social: string | null
          rfc: string | null
          telefono: string | null
          telefono_contacto: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          calificacion?: number | null
          condiciones_pago?: string | null
          contacto_principal?: string | null
          created_at?: string | null
          descuento_por_volumen?: number | null
          direccion?: string | null
          email?: string | null
          email_contacto?: string | null
          id?: string
          nombre: string
          notas?: string | null
          razon_social?: string | null
          rfc?: string | null
          telefono?: string | null
          telefono_contacto?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          calificacion?: number | null
          condiciones_pago?: string | null
          contacto_principal?: string | null
          created_at?: string | null
          descuento_por_volumen?: number | null
          direccion?: string | null
          email?: string | null
          email_contacto?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          razon_social?: string | null
          rfc?: string | null
          telefono?: string | null
          telefono_contacto?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proveedores_armados: {
        Row: {
          activo: boolean | null
          capacidad_actual: number | null
          capacidad_maxima: number | null
          contacto_principal: string
          created_at: string
          descuento_volumen: number | null
          disponibilidad_24h: boolean | null
          documentacion_legal: string[] | null
          documentos_completos: boolean | null
          email_contacto: string
          id: string
          licencias_vigentes: boolean | null
          nombre_empresa: string
          numero_servicios_empresa: number | null
          observaciones: string | null
          rating_proveedor: number | null
          rfc: string | null
          servicios_disponibles: string[] | null
          tarifa_alta_seguridad: number | null
          tarifa_base_foraneo: number | null
          tarifa_base_local: number | null
          tasa_confirmacion_empresa: number | null
          telefono_contacto: string
          tiempo_respuesta_promedio: number | null
          updated_at: string
          zonas_cobertura: string[]
        }
        Insert: {
          activo?: boolean | null
          capacidad_actual?: number | null
          capacidad_maxima?: number | null
          contacto_principal: string
          created_at?: string
          descuento_volumen?: number | null
          disponibilidad_24h?: boolean | null
          documentacion_legal?: string[] | null
          documentos_completos?: boolean | null
          email_contacto: string
          id?: string
          licencias_vigentes?: boolean | null
          nombre_empresa: string
          numero_servicios_empresa?: number | null
          observaciones?: string | null
          rating_proveedor?: number | null
          rfc?: string | null
          servicios_disponibles?: string[] | null
          tarifa_alta_seguridad?: number | null
          tarifa_base_foraneo?: number | null
          tarifa_base_local?: number | null
          tasa_confirmacion_empresa?: number | null
          telefono_contacto: string
          tiempo_respuesta_promedio?: number | null
          updated_at?: string
          zonas_cobertura?: string[]
        }
        Update: {
          activo?: boolean | null
          capacidad_actual?: number | null
          capacidad_maxima?: number | null
          contacto_principal?: string
          created_at?: string
          descuento_volumen?: number | null
          disponibilidad_24h?: boolean | null
          documentacion_legal?: string[] | null
          documentos_completos?: boolean | null
          email_contacto?: string
          id?: string
          licencias_vigentes?: boolean | null
          nombre_empresa?: string
          numero_servicios_empresa?: number | null
          observaciones?: string | null
          rating_proveedor?: number | null
          rfc?: string | null
          servicios_disponibles?: string[] | null
          tarifa_alta_seguridad?: number | null
          tarifa_base_foraneo?: number | null
          tarifa_base_local?: number | null
          tasa_confirmacion_empresa?: number | null
          telefono_contacto?: string
          tiempo_respuesta_promedio?: number | null
          updated_at?: string
          zonas_cobertura?: string[]
        }
        Relationships: []
      }
      recepciones_mercancia: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_programada: string | null
          fecha_recepcion: string | null
          id: string
          notas_recepcion: string | null
          numero_recepcion: string
          observaciones: string | null
          orden_compra_id: string | null
          proveedor_id: string | null
          recibido_por: string | null
          total_esperado: number | null
          total_recibido: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_programada?: string | null
          fecha_recepcion?: string | null
          id?: string
          notas_recepcion?: string | null
          numero_recepcion: string
          observaciones?: string | null
          orden_compra_id?: string | null
          proveedor_id?: string | null
          recibido_por?: string | null
          total_esperado?: number | null
          total_recibido?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_programada?: string | null
          fecha_recepcion?: string | null
          id?: string
          notas_recepcion?: string | null
          numero_recepcion?: string
          observaciones?: string | null
          orden_compra_id?: string | null
          proveedor_id?: string | null
          recibido_por?: string | null
          total_esperado?: number | null
          total_recibido?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recepciones_mercancia_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recepciones_mercancia_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recepciones_mercancia_recibido_por_fkey"
            columns: ["recibido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      roi_custodios: {
        Row: {
          costo_adquisicion: number | null
          created_at: string | null
          custodio_id: string | null
          dias_activo: number | null
          estado_custodio: string | null
          id: string
          ingresos_generados: number | null
          inversion_total: number | null
          ltv_estimado: number | null
          payback_dias: number | null
          periodo_fin: string
          periodo_inicio: string
          roi_percentage: number | null
          servicios_completados: number | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          costo_adquisicion?: number | null
          created_at?: string | null
          custodio_id?: string | null
          dias_activo?: number | null
          estado_custodio?: string | null
          id?: string
          ingresos_generados?: number | null
          inversion_total?: number | null
          ltv_estimado?: number | null
          payback_dias?: number | null
          periodo_fin: string
          periodo_inicio: string
          roi_percentage?: number | null
          servicios_completados?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          costo_adquisicion?: number | null
          created_at?: string | null
          custodio_id?: string | null
          dias_activo?: number | null
          estado_custodio?: string | null
          id?: string
          ingresos_generados?: number | null
          inversion_total?: number | null
          ltv_estimado?: number | null
          payback_dias?: number | null
          periodo_fin?: string
          periodo_inicio?: string
          roi_percentage?: number | null
          servicios_completados?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_custodios_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          approved_by: string | null
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_role: string
          old_role: string | null
          target_user_email: string
          target_user_id: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_role: string
          old_role?: string | null
          target_user_email: string
          target_user_id: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_role?: string
          old_role?: string | null
          target_user_email?: string
          target_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
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
          id: number
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
          id?: number
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
          id?: number
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
          plan_rastreo_satelital: string | null
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
          plan_rastreo_satelital?: string | null
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
          plan_rastreo_satelital?: string | null
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
      servicios_segmentados: {
        Row: {
          complejidad_score: number | null
          created_at: string | null
          demanda_diaria_promedio: number | null
          duracion_promedio_horas: number
          id: string
          margen_beneficio: number | null
          periodo_analisis: string
          tipo_servicio: string
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          complejidad_score?: number | null
          created_at?: string | null
          demanda_diaria_promedio?: number | null
          duracion_promedio_horas: number
          id?: string
          margen_beneficio?: number | null
          periodo_analisis?: string
          tipo_servicio: string
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          complejidad_score?: number | null
          created_at?: string | null
          demanda_diaria_promedio?: number | null
          duracion_promedio_horas?: number
          id?: string
          margen_beneficio?: number | null
          periodo_analisis?: string
          tipo_servicio?: string
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicios_segmentados_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      siercp_results: {
        Row: {
          clinical_interpretation: string | null
          completed_at: string
          created_at: string
          global_score: number
          id: string
          percentiles: Json
          risk_flags: string[] | null
          scores: Json
          user_id: string
        }
        Insert: {
          clinical_interpretation?: string | null
          completed_at?: string
          created_at?: string
          global_score: number
          id?: string
          percentiles: Json
          risk_flags?: string[] | null
          scores: Json
          user_id: string
        }
        Update: {
          clinical_interpretation?: string | null
          completed_at?: string
          created_at?: string
          global_score?: number
          id?: string
          percentiles?: Json
          risk_flags?: string[] | null
          scores?: Json
          user_id?: string
        }
        Relationships: []
      }
      stock_productos: {
        Row: {
          cantidad_desecho: number
          cantidad_disponible: number | null
          cantidad_reservada: number | null
          cantidad_rma: number
          cantidad_transito: number | null
          id: string
          producto_id: string
          ultima_actualizacion: string | null
          updated_at: string | null
          valor_inventario: number | null
        }
        Insert: {
          cantidad_desecho?: number
          cantidad_disponible?: number | null
          cantidad_reservada?: number | null
          cantidad_rma?: number
          cantidad_transito?: number | null
          id?: string
          producto_id: string
          ultima_actualizacion?: string | null
          updated_at?: string | null
          valor_inventario?: number | null
        }
        Update: {
          cantidad_desecho?: number
          cantidad_disponible?: number | null
          cantidad_reservada?: number | null
          cantidad_rma?: number
          cantidad_transito?: number | null
          id?: string
          producto_id?: string
          ultima_actualizacion?: string | null
          updated_at?: string | null
          valor_inventario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_productos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: true
            referencedRelation: "productos_inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategorias_gastos: {
        Row: {
          activo: boolean | null
          categoria_principal_id: string | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          orden: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria_principal_id?: string | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria_principal_id?: string | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_gastos_categoria_principal_id_fkey"
            columns: ["categoria_principal_id"]
            isOneToOne: false
            referencedRelation: "categorias_principales"
            referencedColumns: ["id"]
          },
        ]
      }
      system_changes: {
        Row: {
          affected_components: string[] | null
          change_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          impact_level: string
          module: string
          rollback_plan: string | null
          technical_details: string | null
          testing_notes: string | null
          title: string
          updated_at: string | null
          version_id: string | null
        }
        Insert: {
          affected_components?: string[] | null
          change_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          impact_level?: string
          module: string
          rollback_plan?: string | null
          technical_details?: string | null
          testing_notes?: string | null
          title: string
          updated_at?: string | null
          version_id?: string | null
        }
        Update: {
          affected_components?: string[] | null
          change_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          impact_level?: string
          module?: string
          rollback_plan?: string | null
          technical_details?: string | null
          testing_notes?: string | null
          title?: string
          updated_at?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_changes_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
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
      system_versions: {
        Row: {
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          release_date: string
          release_notes: string | null
          status: string
          updated_at: string | null
          version_name: string | null
          version_number: string
          version_type: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          release_date?: string
          release_notes?: string | null
          status?: string
          updated_at?: string | null
          version_name?: string | null
          version_number: string
          version_type?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          release_date?: string
          release_notes?: string | null
          status?: string
          updated_at?: string | null
          version_name?: string | null
          version_number?: string
          version_type?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          source: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          whatsapp_chat_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string | null
          subject: string
          ticket_number?: string
          updated_at?: string | null
          whatsapp_chat_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          whatsapp_chat_id?: string | null
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
      user_skills: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          skill: Database["public"]["Enums"]["user_skill_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          skill: Database["public"]["Enums"]["user_skill_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          skill?: Database["public"]["Enums"]["user_skill_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vapi_call_logs: {
        Row: {
          analysis: Json | null
          analysis_score: number | null
          analyst_id: string
          artifacts: Json | null
          auto_decision: string | null
          call_status: string | null
          call_type: string | null
          cost_usd: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          lead_id: string
          phone_number: string | null
          recommendation: string | null
          recording_url: string | null
          red_flags: string[] | null
          started_at: string | null
          structured_data: Json | null
          summary: string | null
          transcript: string | null
          updated_at: string
          vapi_assistant_id: string
          vapi_call_id: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_score?: number | null
          analyst_id: string
          artifacts?: Json | null
          auto_decision?: string | null
          call_status?: string | null
          call_type?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_id: string
          phone_number?: string | null
          recommendation?: string | null
          recording_url?: string | null
          red_flags?: string[] | null
          started_at?: string | null
          structured_data?: Json | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          vapi_assistant_id?: string
          vapi_call_id?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_score?: number | null
          analyst_id?: string
          artifacts?: Json | null
          auto_decision?: string | null
          call_status?: string | null
          call_type?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_id?: string
          phone_number?: string | null
          recommendation?: string | null
          recording_url?: string | null
          red_flags?: string[] | null
          started_at?: string | null
          structured_data?: Json | null
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
      whatsapp_configurations: {
        Row: {
          auto_reply_enabled: boolean | null
          business_hours_end: string | null
          business_hours_start: string | null
          connection_status: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          phone_number: string | null
          qr_code: string | null
          session_data: Json | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          connection_status?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          auto_reply_enabled?: boolean | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          connection_status?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      whatsapp_connection_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connection_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          is_from_bot: boolean | null
          is_read: boolean | null
          media_url: string | null
          message_id: string | null
          message_text: string | null
          message_type: string | null
          sender_name: string | null
          sender_phone: string | null
          ticket_id: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          is_from_bot?: boolean | null
          is_read?: boolean | null
          media_url?: string | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          ticket_id?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          is_from_bot?: boolean | null
          is_read?: boolean | null
          media_url?: string | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          phone_number: string
          session_data: Json | null
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          phone_number: string
          session_data?: Json | null
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          phone_number?: string
          session_data?: Json | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      zona_capacity_management: {
        Row: {
          activo: boolean
          capacidad_actual: number
          capacidad_maxima: number
          configuracion: Json | null
          created_at: string | null
          id: string
          umbral_saturacion: number
          updated_at: string | null
          updated_by: string | null
          zona_id: string
        }
        Insert: {
          activo?: boolean
          capacidad_actual?: number
          capacidad_maxima?: number
          configuracion?: Json | null
          created_at?: string | null
          id?: string
          umbral_saturacion?: number
          updated_at?: string | null
          updated_by?: string | null
          zona_id: string
        }
        Update: {
          activo?: boolean
          capacidad_actual?: number
          capacidad_maxima?: number
          configuracion?: Json | null
          created_at?: string | null
          id?: string
          umbral_saturacion?: number
          updated_at?: string | null
          updated_by?: string | null
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zona_capacity_management_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: true
            referencedRelation: "zonas_operacion_nacional"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_operacion_nacional: {
        Row: {
          coordenadas_centro: unknown | null
          created_at: string | null
          estados_incluidos: string[] | null
          id: string
          nombre: string
          prioridad_reclutamiento: number | null
          radio_cobertura_km: number | null
          updated_at: string | null
        }
        Insert: {
          coordenadas_centro?: unknown | null
          created_at?: string | null
          estados_incluidos?: string[] | null
          id?: string
          nombre: string
          prioridad_reclutamiento?: number | null
          radio_cobertura_km?: number | null
          updated_at?: string | null
        }
        Update: {
          coordenadas_centro?: unknown | null
          created_at?: string | null
          estados_incluidos?: string[] | null
          id?: string
          nombre?: string
          prioridad_reclutamiento?: number | null
          radio_cobertura_km?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      armados_operativos_disponibles: {
        Row: {
          created_at: string | null
          disponibilidad: string | null
          disponible_hoy: boolean | null
          email: string | null
          equipamiento_disponible: string[] | null
          estado: string | null
          experiencia_anos: number | null
          fecha_ultimo_servicio: string | null
          fecha_vencimiento_licencia: string | null
          fuente: string | null
          id: string | null
          licencia_portacion: string | null
          nombre: string | null
          numero_servicios: number | null
          proveedor_capacidad_actual: number | null
          proveedor_capacidad_maxima: number | null
          proveedor_id: string | null
          proveedor_nombre: string | null
          rating_promedio: number | null
          restricciones_horario: Json | null
          score_comunicacion: number | null
          score_confiabilidad: number | null
          score_disponibilidad: number | null
          score_disponibilidad_efectiva: number | null
          score_total: number | null
          servicios_permitidos: string[] | null
          tasa_confiabilidad: number | null
          tasa_confirmacion: number | null
          tasa_respuesta: number | null
          telefono: string | null
          tipo_armado: string | null
          updated_at: string | null
          zona_base: string | null
          zonas_permitidas: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_armados_proveedor"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_armados"
            referencedColumns: ["id"]
          },
        ]
      }
      custodios_operativos_activos: {
        Row: {
          km_promedio: number | null
          nombre_custodio: string | null
          servicios_completados: number | null
          telefono: string | null
          telefono_operador: string | null
          total_servicios: number | null
          ultimo_servicio: string | null
        }
        Relationships: []
      }
      custodios_operativos_disponibles: {
        Row: {
          certificaciones: string[] | null
          created_at: string | null
          disponibilidad: string | null
          disponibilidad_efectiva:
            | Database["public"]["Enums"]["disponibilidad_custodio"]
            | null
          email: string | null
          estado: string | null
          experiencia_seguridad: boolean | null
          fecha_ultimo_servicio: string | null
          fuente: string | null
          id: string | null
          indisponibilidades_activas: Json | null
          lat: number | null
          lng: number | null
          nombre: string | null
          numero_servicios: number | null
          rating_promedio: number | null
          score_aceptacion: number | null
          score_comunicacion: number | null
          score_confiabilidad: number | null
          score_total: number | null
          tasa_aceptacion: number | null
          tasa_confiabilidad: number | null
          tasa_respuesta: number | null
          telefono: string | null
          updated_at: string | null
          vehiculo_propio: boolean | null
          zona_base: string | null
        }
        Insert: {
          certificaciones?: string[] | null
          created_at?: string | null
          disponibilidad?: string | null
          disponibilidad_efectiva?: never
          email?: string | null
          estado?: string | null
          experiencia_seguridad?: boolean | null
          fecha_ultimo_servicio?: string | null
          fuente?: string | null
          id?: string | null
          indisponibilidades_activas?: never
          lat?: number | null
          lng?: number | null
          nombre?: string | null
          numero_servicios?: number | null
          rating_promedio?: number | null
          score_aceptacion?: number | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_total?: number | null
          tasa_aceptacion?: number | null
          tasa_confiabilidad?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          updated_at?: string | null
          vehiculo_propio?: boolean | null
          zona_base?: string | null
        }
        Update: {
          certificaciones?: string[] | null
          created_at?: string | null
          disponibilidad?: string | null
          disponibilidad_efectiva?: never
          email?: string | null
          estado?: string | null
          experiencia_seguridad?: boolean | null
          fecha_ultimo_servicio?: string | null
          fuente?: string | null
          id?: string | null
          indisponibilidades_activas?: never
          lat?: number | null
          lng?: number | null
          nombre?: string | null
          numero_servicios?: number | null
          rating_promedio?: number | null
          score_aceptacion?: number | null
          score_comunicacion?: number | null
          score_confiabilidad?: number | null
          score_total?: number | null
          tasa_aceptacion?: number | null
          tasa_confiabilidad?: number | null
          tasa_respuesta?: number | null
          telefono?: string | null
          updated_at?: string | null
          vehiculo_propio?: boolean | null
          zona_base?: string | null
        }
        Relationships: []
      }
      user_skills_view: {
        Row: {
          display_name: string | null
          email: string | null
          expires_at: string | null
          granted_at: string | null
          is_active: boolean | null
          skill: Database["public"]["Enums"]["user_skill_type"] | null
          status: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_roi_custodios: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      actualizar_tracking_rotacion: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      add_admin_role: {
        Args: { user_id: string }
        Returns: undefined
      }
      archivar_producto: {
        Args: { p_motivo?: string; p_producto_id: string }
        Returns: boolean
      }
      assign_initial_owner: {
        Args: { target_email: string }
        Returns: boolean
      }
      assign_role_secure: {
        Args: {
          audit_reason?: string
          new_role: string
          target_user_id: string
        }
        Returns: boolean
      }
      assign_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
      }
      assign_user_role_secure: {
        Args: {
          change_reason?: string
          new_role: string
          target_user_id: string
        }
        Returns: boolean
      }
      audit_sensitive_access: {
        Args: { operation: string; record_id?: string; table_name: string }
        Returns: undefined
      }
      auto_asignar_kit_instalacion: {
        Args: {
          p_forzar_asignacion?: boolean
          p_programacion_id: string
          p_sensores_requeridos?: string[]
          p_tipo_vehiculo?: string
        }
        Returns: Json
      }
      auto_reactivar_custodios: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      award_points: {
        Args: {
          p_description: string
          p_point_type: string
          p_points: number
          p_service_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      buscar_precio_ruta: {
        Args: {
          p_cliente_nombre: string
          p_destino: string
          p_distancia_km?: number
        }
        Returns: {
          costo_operativo: number
          margen_estimado: number
          precio_custodio: number
          precio_sugerido: number
          ruta_encontrada: string
        }[]
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
          id: number
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
          id: number
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
      calcular_costo_promedio_ponderado: {
        Args: { p_producto_id: string }
        Returns: number
      }
      calcular_deficit_dinamico_por_zona: {
        Args: {
          p_fecha_desde?: string
          p_fecha_hasta?: string
          p_zona_operacion: string
        }
        Returns: {
          deficit_ajustado: number
          deficit_inicial: number
          fecha_calculo: string
          nuevos_custodios_incorporados: number
          porcentaje_progreso: number
          zona_operacion: string
        }[]
      }
      calcular_distancia_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calcular_puntos_viaje: {
        Args: { estado_viaje: string; km_viaje: number }
        Returns: number
      }
      calcular_roi_zona: {
        Args: { p_periodo_dias?: number; p_zona_id: string }
        Returns: {
          costo_promedio_adquisicion: number
          custodios_adquiridos: number
          ingresos_generados: number
          inversion_total: number
          roi_percentage: number
          servicios_totales: number
          zona_nombre: string
        }[]
      }
      calcular_score_urgencia_zona: {
        Args: { p_zona_id: string }
        Returns: number
      }
      calcular_valor_inventario: {
        Args: { p_producto_id: string }
        Returns: {
          margen_potencial: number
          valor_costo: number
          valor_venta: number
        }[]
      }
      calculate_custodian_level: {
        Args: { points: number }
        Returns: number
      }
      calculate_custodian_level_dynamic: {
        Args: { total_points: number }
        Returns: number
      }
      calculate_custodio_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_monthly_retention: {
        Args: { target_month: string }
        Returns: undefined
      }
      calculate_points_with_validation: {
        Args: {
          p_estado: string
          p_km_recorridos: number
          p_service_id?: string
        }
        Returns: {
          calculated_points: number
          flag_reason: string
          is_flagged: boolean
        }[]
      }
      calculate_punctuality_rate: {
        Args: { p_custodian_name: string }
        Returns: number
      }
      calculate_unified_points: {
        Args: { p_estado: string; p_km_recorridos: number }
        Returns: number
      }
      calculate_user_punctuality_rate: {
        Args: { p_user_id: string }
        Returns: number
      }
      can_access_call_logs: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_custodio_portal: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_financial_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_home: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_recruitment_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_lead_assignments: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_wms: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_view_financial_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_view_sensitive_kpis: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_admin_for_rewards: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_admin_secure: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_duplicate_service_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          duplicate_count: number
          id_servicio: string
          latest_date: string
          service_ids: number[]
        }[]
      }
      check_pending_referral_bonuses: {
        Args: Record<PropertyKey, never>
        Returns: {
          custodio_email: string
          custodio_id: string
          pending_bonuses: number
          total_amount: number
        }[]
      }
      check_user_role: {
        Args: { role_name: string; user_id: string }
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
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      check_zone_capacity: {
        Args: { p_zona_id: string }
        Returns: Json
      }
      clean_duplicate_service_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          duplicates_found: number
          duplicates_removed: number
        }[]
      }
      cleanup_expired_interview_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_skills: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clear_redemptions_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      compare_dashboard_vs_forensic: {
        Args: Record<PropertyKey, never>
        Returns: {
          dashboard_value: number
          discrepancy: number
          discrepancy_percent: number
          forensic_value: number
          metric_name: string
          status: string
        }[]
      }
      crear_kit_instalacion: {
        Args: {
          p_gps_id: string
          p_microsd_id?: string
          p_preparado_por?: string
          p_programacion_id: string
          p_sim_id?: string
        }
        Returns: string
      }
      create_new_role: {
        Args: { new_role: string }
        Returns: undefined
      }
      create_redemptions_bypass_rls: {
        Args: { redemptions_data: Json }
        Returns: {
          id: string
        }[]
      }
      create_reward_bypass_rls: {
        Args: {
          reward_availability: number
          reward_category_id: string
          reward_description: string
          reward_featured: boolean
          reward_image_url: string
          reward_name: string
          reward_point_cost: number
        }
        Returns: string
      }
      create_test_trips_for_user: {
        Args: { p_user_id: string; p_user_name: string; p_user_phone: string }
        Returns: number
      }
      create_vapi_call_log: {
        Args:
          | {
              p_analysis_score?: number
              p_auto_decision?: string
              p_lead_id: string
              p_phone_number: string
              p_recommendation?: string
              p_red_flags?: string[]
              p_structured_data?: Json
              p_vapi_call_id: string
            }
          | {
              p_lead_id: string
              p_phone_number: string
              p_vapi_call_id: string
            }
        Returns: string
      }
      current_user_has_role: {
        Args: { required_role: string }
        Returns: boolean
      }
      current_user_is_coordinator_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      daily_duplicate_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_reward_bypass_rls: {
        Args: { reward_id: string }
        Returns: boolean
      }
      delete_role: {
        Args: { target_role: string }
        Returns: undefined
      }
      detect_suspicious_patterns: {
        Args: Record<PropertyKey, never>
        Returns: {
          count_found: number
          pattern_description: string
          pattern_type: string
          sample_data: string
          severity: string
        }[]
      }
      diagnose_phone_services: {
        Args: { p_phone: string }
        Returns: {
          distinct_phones: string[]
          found_services: number
          phone_variations: string[]
          sample_custodian: string
          sample_estado: string
          sample_phone: string
          sample_service_id: string
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
      es_c4_monitoreo: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      es_planificador: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      es_usuario_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      flag_service_for_review: {
        Args: {
          p_flag_reason: string
          p_original_km: number
          p_original_points: number
          p_service_id: string
          p_suggested_km: number
          p_suggested_points: number
        }
        Returns: string
      }
      forensic_audit_servicios_enero_actual: {
        Args: Record<PropertyKey, never>
        Returns: {
          clientes_distintos: number
          custodios_con_hash_na: number
          custodios_distintos: number
          estados_distintos: number
          fecha_mas_antigua: string
          fecha_mas_reciente: string
          gmv_solo_completados: number
          gmv_solo_finalizados: number
          gmv_total_sin_filtros: number
          registros_con_cobro_null: number
          registros_con_cobro_valido: number
          registros_con_cobro_zero: number
          registros_con_destino: number
          registros_con_fecha_valida: number
          registros_con_origen: number
          registros_con_ruta_completa: number
          registros_duplicados_id: number
          registros_enero_actual: number
          registros_fuera_rango: number
          registros_sin_cliente: number
          registros_sin_custodio: number
          registros_sin_id: number
          servicios_cancelados: number
          servicios_completado: number
          servicios_estado_null: number
          servicios_estado_vacio: number
          servicios_finalizado_exact: number
          servicios_pendientes: number
          servicios_unicos_id: number
          total_registros_raw: number
        }[]
      }
      generar_alertas_automaticas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generar_folio_servicio: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_recepcion_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_activation_metrics_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          activated_custodians: number
          activation_rate: number
          median_activation_days: number
          total_custodians: number
        }[]
      }
      get_active_custodians_60_days: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          custodians: string[]
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
          id: number
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
          admin_notes: string
          created_at: string
          custodian_name: string
          custodian_phone: string
          id: string
          points_spent: number
          reward: Json
          reward_id: string
          status: string
          user_id: string
        }[]
      }
      get_all_rewards: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability: number
          category: string
          category_id: string
          created_at: string
          description: string
          featured: boolean
          id: string
          image_url: string
          name: string
          point_cost: number
          updated_at: string
        }[]
      }
      get_all_user_roles_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
          user_id: string
        }[]
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          display_name: string
          email: string
          is_verified: boolean
          last_sign_in_at: string
          phone: string
          photo_url: string
          user_id: string
          user_roles: string[]
        }[]
      }
      get_analyst_assigned_leads: {
        Args: Record<PropertyKey, never>
        Returns: {
          analista_email: string
          analista_nombre: string
          asignado_a: string
          contact_attempts_count: number
          fecha_entrada_pool: string
          final_decision: string
          has_scheduled_call: boolean
          has_successful_call: boolean
          interview_in_progress: boolean
          interview_interrupted: boolean
          interview_session_id: string
          interview_started_at: string
          last_contact_outcome: string
          lead_email: string
          lead_estado: string
          lead_fecha_creacion: string
          lead_id: string
          lead_nombre: string
          lead_telefono: string
          motivo_pool: string
          scheduled_call_datetime: string
          zona_nombre: string
          zona_preferida_id: string
        }[]
      }
      get_available_roles_secure: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_ciudades_safe: {
        Args: { estado_uuid: string }
        Returns: {
          estado_id: string
          id: string
          nombre: string
        }[]
      }
      get_cohort_retention_matrix: {
        Args: Record<PropertyKey, never>
        Returns: {
          cohort_month: string
          initial_size: number
          month_1: number
          month_2: number
          month_3: number
          month_4: number
          month_5: number
          month_6: number
        }[]
      }
      get_current_user_ranking_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          km_totales: number
          nombre_custodio: string
          posicion: number
          puntos_totales: number
          total_custodios: number
          total_viajes: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_secure: {
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
          km_totales: number
          nivel: number
          puntos_mes_actual: number
          puntos_totales: number
          total_viajes: number
          viajes_completados: number
          viajes_mes_actual: number
          viajes_pendientes: number
        }[]
      }
      get_custodian_performance_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          km_totales: number
          nombre_custodio: string
          posicion: number
          puntos_totales: number
          total_viajes: number
        }[]
      }
      get_custodian_performance_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          km_totales: number
          nombre_custodio: string
          posicion: number
          puntos_totales: number
          total_viajes: number
        }[]
      }
      get_custodian_performance_unified: {
        Args: Record<PropertyKey, never>
        Returns: {
          km_totales: number
          nombre_custodio: string
          posicion: number
          puntos_totales: number
          total_viajes: number
        }[]
      }
      get_custodian_services: {
        Args: { custodian_name: string }
        Returns: {
          destino: string
          estado: string
          fecha_hora_cita: string
          id_servicio: string
          km_recorridos: number
          nombre_cliente: string
          origen: string
          tipo_servicio: string
        }[]
      }
      get_custodian_services_with_points: {
        Args: { p_custodian_name: string }
        Returns: {
          destino: string
          estado: string
          fecha_hora_cita: string
          flag_reason: string
          id_servicio: string
          is_flagged: boolean
          km_recorridos: number
          nombre_cliente: string
          origen: string
          puntos_ganados: number
          tipo_servicio: string
        }[]
      }
      get_custodians_levels_and_average: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_level: number
          level_1_count: number
          level_2_count: number
          level_3_count: number
          level_4_count: number
          level_5_count: number
          total_custodians: number
        }[]
      }
      get_custodio_referidos: {
        Args: { p_custodio_id: string }
        Returns: {
          bono_otorgado: boolean
          candidato_email: string
          candidato_nombre: string
          estado_referido: string
          fecha_activacion: string
          fecha_referencia: string
          monto_bono: number
          referido_id: string
        }[]
      }
      get_custodio_referral_stats: {
        Args: { p_custodio_id: string }
        Returns: {
          bonos_ganados: number
          referidos_activos: number
          total_referidos: number
          ultimo_bono_fecha: string
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
      get_custodios_estadisticas_planeacion: {
        Args: Record<PropertyKey, never>
        Returns: {
          estados: string
          ingresos_total: number
          km_total: number
          nombre_custodio: string
          promedio_km: number
          servicios_activos: number
          servicios_finalizados: number
          tasa_finalizacion: number
          total_servicios: number
          ultimo_servicio: string
        }[]
      }
      get_custodios_nuevos_por_mes: {
        Args: { fecha_fin: string; fecha_inicio: string }
        Returns: {
          custodios_nuevos: number
          mes: string
          nombres_custodios: string[]
        }[]
      }
      get_custodios_operativos_activos: {
        Args: Record<PropertyKey, never>
        Returns: {
          km_promedio: number
          nombre_custodio: string
          servicios_completados: number
          telefono: string
          telefono_operador: string
          total_servicios: number
          ultimo_servicio: string
        }[]
      }
      get_estados_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          codigo: string
          id: string
          nombre: string
        }[]
      }
      get_finalized_services_data_secure: {
        Args: { end_date: string; start_date: string }
        Returns: {
          service_count: number
          total_gmv: number
          total_services: number
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
          id: number
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
      get_historical_monthly_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          gmv: number
          month: number
          services: number
          services_completed: number
          year: number
        }[]
      }
      get_income_distribution_by_threshold: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_income: number
          avg_services: number
          custodian_count: number
          income_level: string
          income_range: string
          percentage: number
        }[]
      }
      get_instaladores_disponibles: {
        Args: { p_fecha: string; p_tipo_instalacion?: string; p_zona?: Json }
        Returns: {
          calificacion_promedio: number
          disponible: boolean
          especialidades: string[]
          id: string
          nombre_completo: string
          servicios_completados: number
          telefono: string
        }[]
      }
      get_instaladores_for_programacion: {
        Args: { instalador_ids: string[] }
        Returns: {
          calificacion_promedio: number
          especialidades: string[]
          id: string
          nombre_completo: string
          telefono: string
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
      get_monthly_productivity_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_custodians: number
          avg_income_per_custodian: number
          avg_services_per_custodian: number
          month_year: string
          total_income: number
          total_services: number
        }[]
      }
      get_mtd_comparison: {
        Args: {
          p_current_day: number
          p_current_month: number
          p_current_year: number
          p_previous_month: number
          p_previous_year: number
        }
        Returns: {
          current_aov: number
          current_gmv: number
          current_services: number
          current_year: number
          previous_aov: number
          previous_gmv: number
          previous_services: number
          previous_year: number
        }[]
      }
      get_my_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          allowed: boolean
          created_at: string
          id: string
          permission_id: string
          permission_type: string
          role: string
          updated_at: string
        }[]
      }
      get_points_system_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          level_names: Json
          level_thresholds: Json
          min_points_for_rewards: number
          points_multiplier: number
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
      get_quick_metrics_fallback: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_updated: string
          metric_name: string
          metric_value: number
        }[]
      }
      get_real_marketing_roi: {
        Args: { periodo_dias?: number }
        Returns: {
          canal: string
          candidatos_generados: number
          cpa_real: number
          custodios_activos: number
          gasto_total: number
          ingresos_generados: number
          roi_porcentaje: number
          roi_total_marketing: number
        }[]
      }
      get_real_marketing_roi_v2: {
        Args: { periodo_dias?: number }
        Returns: {
          canal: string
          candidatos_generados: number
          cpa_real: number
          custodios_activos: number
          desglose_calculo: Json
          gasto_total: number
          ingresos_generados: number
          roi_porcentaje: number
          roi_total_marketing: number
        }[]
      }
      get_redemptions_with_custodian_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_notes: string
          created_at: string
          custodian_level: number
          custodian_name: string
          custodian_phone: string
          custodian_total_points: number
          points_spent: number
          redemption_id: string
          reward_description: string
          reward_id: string
          reward_name: string
          reward_point_cost: number
          status: string
          user_id: string
        }[]
      }
      get_reward_categories_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_rewards: number
          color: string
          description: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          total_redemptions: number
          total_rewards: number
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
          availability: number
          category_color: string
          category_icon: string
          category_name: string
          created_at: string
          description: string
          featured: boolean
          id: string
          image_url: string
          name: string
          point_cost: number
        }[]
      }
      get_roi_marketing_data: {
        Args: { periodo_dias?: number }
        Returns: {
          gastos_totales: number
          ingresos_estimados: number
          num_candidatos: number
          num_custodios_activos: number
          roi_calculado: number
        }[]
      }
      get_roi_marketing_real_data: {
        Args: { periodo_dias?: number }
        Returns: {
          cpa_real: number
          custodios_activos: number
          custodios_contratados: number
          detalles_por_canal: Json
          ingresos_por_custodio: number
          ingresos_reales: number
          inversion_total: number
          roi_calculado: number
          servicios_completados: number
        }[]
      }
      get_role_permissions_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          allowed: boolean
          created_at: string
          id: string
          permission_id: string
          permission_type: string
          role: string
          updated_at: string
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
          id: number
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
          km_totales: number
          puntos_totales: number
          servicios_completados: number
          servicios_data: Json
          servicios_pendientes: number
          total_servicios: number
        }[]
      }
      get_services_by_user_phone: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_name: string
          date: string
          destination: string
          km_travelled: number
          origin: string
          service_id: string
          status: string
        }[]
      }
      get_servicio_completo_secure: {
        Args: { servicio_uuid: string }
        Returns: Json
      }
      get_supply_growth_metrics: {
        Args: { fecha_fin: string; fecha_inicio: string }
        Returns: {
          custodios_activos_fin: number
          custodios_activos_inicio: number
          custodios_nuevos: number
          custodios_perdidos: number
          period_end: string
          period_start: string
          supply_growth_absolute: number
          supply_growth_rate: number
        }[]
      }
      get_user_confirmation_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          email_confirmed_at: string
          is_confirmed: boolean
          profile_verified: boolean
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_direct: {
        Args: Record<PropertyKey, never> | { user_uid: string }
        Returns: string
      }
      get_user_role_for_recruitment: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role_safe: {
        Args: { user_uid: string }
        Returns: string
      }
      get_user_role_secure: {
        Args: Record<PropertyKey, never> | { user_uuid: string }
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
          destino: string
          estado: string
          fecha_hora_cita: string
          id_servicio: string
          km_recorridos: number
          nombre_cliente: string
          origen: string
          user_id: string
          user_name: string
          user_phone: string
        }[]
      }
      get_user_services_by_phone_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          destino: string
          estado: string
          fecha_hora_cita: string
          id_servicio: string
          km_recorridos: number
          nombre_cliente: string
          nombre_custodio: string
          origen: string
          puntos_ganados: number
          telefono: string
        }[]
      }
      get_user_services_comprehensive: {
        Args: {
          p_user_email?: string
          p_user_id?: string
          p_user_name?: string
          p_user_phone?: string
        }
        Returns: {
          km_totales: number
          puntos_totales: number
          servicios_completados: number
          servicios_data: Json
          servicios_pendientes: number
          total_servicios: number
        }[]
      }
      get_user_services_list: {
        Args: { p_phone: string }
        Returns: {
          destino: string
          estado: string
          fecha_hora_cita: string
          id_custodio: string
          id_servicio: string
          km_recorridos: number
          nombre_cliente: string
          nombre_custodio: string
          origen: string
          puntos_ganados: number
          telefono: string
          tiempo_retraso: number
          tipo_servicio: string
        }[]
      }
      get_user_servicios_secure: {
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
          id: number
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
      get_user_skills: {
        Args: { check_user_id: string }
        Returns: {
          expires_at: string
          granted_at: string
          skill: Database["public"]["Enums"]["user_skill_type"]
        }[]
      }
      get_user_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_users: number
          custodio_users: number
          manager_users: number
          total_users: number
          unverified_users: number
          users_last_30_days: number
          verified_users: number
        }[]
      }
      get_users_with_roles_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          role: string
          user_id: string
        }[]
      }
      get_users_with_roles_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_name: string
          email: string
          id: string
          role: string
        }[]
      }
      get_weekly_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          custodio_id: string
          km_totales: number
          nombre_custodio: string
          posicion: number
          puntos: number
          total_viajes: number
        }[]
      }
      get_ytd_by_exact_dates: {
        Args: {
          end_date_current: string
          end_date_previous: string
          start_date_current: string
          start_date_previous: string
        }
        Returns: {
          current_gmv: number
          current_services: number
          current_year: number
          previous_gmv: number
          previous_services: number
          previous_year: number
        }[]
      }
      get_zonas_trabajo_safe: {
        Args: { ciudad_uuid: string }
        Returns: {
          ciudad_id: string
          descripcion: string
          id: string
          nombre: string
        }[]
      }
      has_management_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: { role_name: string; user_uuid: string }
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
      is_admin_email_secure: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_no_recursion: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin_or_owner: {
        Args: Record<PropertyKey, never> | { user_uuid: string }
        Returns: boolean
      }
      is_admin_safe: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_admin_secure: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user_secure: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_coordinator_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_coordinator_or_security: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_custodio: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_installer_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_sales_executive_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_security_analyst_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_owner: {
        Args: { service_custodio_id: string; user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_supply_admin_or_higher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_supply_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_whatsapp_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_user_to_custodio_services: {
        Args: { p_phone: string; p_user_id: string }
        Returns: {
          linked_services: number
        }[]
      }
      log_sensitive_access: {
        Args:
          | {
              additional_data?: Json
              operation: string
              record_id?: string
              table_name: string
            }
          | {
              additional_data?: Json
              operation: string
              record_id?: string
              table_name: string
            }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: { operation: string; table_name: string; user_role?: string }
        Returns: undefined
      }
      manually_verify_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      marcar_producto_inactivo: {
        Args: { p_motivo?: string; p_producto_id: string }
        Returns: boolean
      }
      mark_interview_interrupted: {
        Args: { p_lead_id: string; p_reason: string; p_session_id: string }
        Returns: boolean
      }
      migrar_armados_historicos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrar_custodios_historicos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrate_existing_categories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_existing_contact_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_roles_to_skills: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      move_lead_to_pool: {
        Args:
          | { p_estado_id: string; p_lead_id: string; p_motivo?: string }
          | { p_lead_id: string; p_motivo?: string; p_zona_id: string }
        Returns: boolean
      }
      obtener_deficit_dinamico_nacional: {
        Args: { p_fecha_desde?: string; p_fecha_hasta?: string }
        Returns: {
          deficit_ajustado: number
          deficit_inicial: number
          estado_progreso: string
          fecha_calculo: string
          nuevos_custodios_incorporados: number
          porcentaje_progreso: number
          zona_operacion: string
        }[]
      }
      obtener_estadisticas_custodio: {
        Args: { custodio_id: string }
        Returns: {
          km_totales: number
          puntos_totales: number
          total_viajes: number
          viajes_completados: number
          viajes_pendientes: number
        }[]
      }
      obtener_microsd_disponibles: {
        Args: { p_capacidad_minima_gb?: number }
        Returns: {
          capacidad_gb: number
          clase_velocidad: string
          marca: string
          microsd_id: string
          modelo: string
          numero_serie: string
        }[]
      }
      obtener_sim_disponibles: {
        Args: { p_tipo_plan?: string }
        Returns: {
          costo_mensual: number
          datos_incluidos_mb: number
          numero_sim: string
          operador: string
          sim_id: string
          tipo_plan: string
        }[]
      }
      parse_tiempo_retraso: {
        Args: { tiempo_str: string }
        Returns: unknown
      }
      populate_historical_retention_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      procesar_bono_referido: {
        Args: { p_referido_id: string }
        Returns: boolean
      }
      puede_acceder_planeacion: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reactivate_lead_from_pool: {
        Args: { p_lead_id: string; p_nuevo_estado?: string }
        Returns: boolean
      }
      recomendar_gps_para_instalacion: {
        Args: {
          p_sensores_requeridos: string[]
          p_tipo_vehiculo: string
          p_ubicacion_instalacion?: string
        }
        Returns: {
          gps_id: string
          marca: string
          modelo: string
          numero_serie: string
          requiere_microsd: boolean
          score_compatibilidad: number
          tipo_sim_recomendado: string
        }[]
      }
      redeem_points: {
        Args: { p_quantity?: number; p_reward_id: string; p_user_id: string }
        Returns: string
      }
      refresh_armados_operativos_disponibles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_custodios_operativos_activos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      restaurar_producto: {
        Args: { p_producto_id: string }
        Returns: boolean
      }
      review_flagged_service: {
        Args: {
          p_admin_notes?: string
          p_flag_id: string
          p_override_km?: number
          p_override_points?: number
          p_status: string
        }
        Returns: boolean
      }
      save_interview_progress: {
        Args: {
          p_autosave?: boolean
          p_interview_data: Json
          p_lead_id: string
          p_session_id: string
        }
        Returns: boolean
      }
      save_interview_session: {
        Args: {
          p_interview_data: Json
          p_lead_id: string
          p_session_id: string
        }
        Returns: boolean
      }
      self_verify_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      test_recruitment_system_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_status: string
          record_count: number
          sample_data: Json
          table_name: string
        }[]
      }
      transaction_crear_aprobacion_coordinador: {
        Args: {
          p_aprobacion_data: Json
          p_coordinador_id: string
          p_estado_aprobacion: string
          p_servicio_id: string
        }
        Returns: string
      }
      update_all_custodian_levels: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_approval_process: {
        Args: {
          p_decision: string
          p_decision_reason: string
          p_interview_method: string
          p_lead_id: string
          p_notes: string
          p_stage: string
        }
        Returns: boolean
      }
      update_last_login: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_lead_state_after_interview: {
        Args: {
          p_interview_notes?: string
          p_lead_id: string
          p_new_status: string
          p_rejection_reason?: string
        }
        Returns: boolean
      }
      update_points_system_config: {
        Args: {
          p_level_names: Json
          p_level_thresholds: Json
          p_min_points_for_rewards: number
          p_points_multiplier: number
        }
        Returns: string
      }
      update_redemption_status_bypass_rls: {
        Args: {
          p_admin_notes?: string
          p_redemption_id: string
          p_status: string
        }
        Returns: boolean
      }
      update_reward_bypass_rls: {
        Args: {
          reward_availability: number
          reward_category_id: string
          reward_description: string
          reward_featured: boolean
          reward_id: string
          reward_image_url: string
          reward_name: string
          reward_point_cost: number
        }
        Returns: string
      }
      update_role_name: {
        Args: { new_role: string; old_role: string }
        Returns: undefined
      }
      update_role_permission_secure: {
        Args: { p_allowed: boolean; p_permission_id: string }
        Returns: boolean
      }
      update_user_role_by_email: {
        Args: { p_email: string; p_new_role: string }
        Returns: boolean
      }
      update_user_role_secure: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
      }
      update_vapi_call_with_results: {
        Args: {
          p_analysis_score: number
          p_call_status: string
          p_cost_usd?: number
          p_duration_seconds: number
          p_recording_url?: string
          p_structured_data: Json
          p_summary: string
          p_transcript: string
          p_vapi_call_id: string
        }
        Returns: boolean
      }
      upsert_user_profile: {
        Args: {
          user_display_name: string
          user_email: string
          user_id: string
          user_phone?: string
          user_photo_url?: string
          user_role?: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: {
          permission_id: string
          permission_type: string
          user_uid: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { required_role: string; user_id: string }
        Returns: boolean
      }
      user_has_role_direct: {
        Args: { role_name: string }
        Returns: boolean
      }
      user_has_role_secure: {
        Args:
          | { check_role: string }
          | { required_role: string; user_uuid: string }
        Returns: boolean
      }
      user_has_skill: {
        Args: {
          check_user_id: string
          required_skill: Database["public"]["Enums"]["user_skill_type"]
        }
        Returns: boolean
      }
      validar_horario_instalacion: {
        Args: { fecha_programada: string }
        Returns: boolean
      }
      validar_instalacion_completada: {
        Args: {
          p_kit_id: string
          p_observaciones?: string
          p_validado_por?: string
        }
        Returns: boolean
      }
      validate_image_url: {
        Args: { url: string }
        Returns: boolean
      }
      validate_input_text: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      validate_role_change_secure: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
      }
      validate_role_input: {
        Args: { role_name: string }
        Returns: boolean
      }
      validate_service_distance: {
        Args: {
          p_destino: string
          p_km_recorridos: number
          p_origen: string
          p_service_id?: string
        }
        Returns: {
          flag_reason: string
          is_valid: boolean
          should_flag: boolean
          suggested_km: number
        }[]
      }
      validate_user_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      verificar_admin_seguro: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      verificar_cumplimiento_referido: {
        Args: { p_referido_id: string }
        Returns: boolean
      }
      verify_user_account: {
        Args: { target_user_id: string; verify_status: boolean }
        Returns: boolean
      }
      verify_user_email_secure: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      verify_user_role: {
        Args: { role_to_check: string }
        Returns: boolean
      }
    }
    Enums: {
      actor_touchpoint: "C4" | "Planificador" | "Custodio" | "Cliente"
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
      canal_comunicacion: "whatsapp" | "app" | "telefono" | "email"
      disponibilidad_custodio:
        | "disponible"
        | "ocupado"
        | "off"
        | "temporalmente_indisponible"
      estado_custodio: "activo" | "inactivo"
      estado_oferta: "enviada" | "aceptada" | "rechazada" | "expirada"
      estado_servicio:
        | "nuevo"
        | "en_oferta"
        | "asignado"
        | "en_curso"
        | "finalizado"
        | "cancelado"
      severidad_evento: "baja" | "media" | "alta" | "critica"
      tipo_custodia: "armado" | "no_armado"
      tipo_evento:
        | "desvio"
        | "jammer"
        | "ign_on"
        | "ign_off"
        | "arribo_poi"
        | "contacto_custodio"
        | "contacto_cliente"
        | "otro"
      tipo_servicio_custodia:
        | "traslado"
        | "custodia_local"
        | "escolta"
        | "vigilancia"
      user_skill_type:
        | "dashboard_view"
        | "leads_management"
        | "leads_approval"
        | "user_management"
        | "role_management"
        | "monitoring_view"
        | "monitoring_manage"
        | "services_view"
        | "services_manage"
        | "installer_portal_only"
        | "custodio_tracking_only"
        | "supply_chain_view"
        | "supply_chain_manage"
        | "reports_view"
        | "reports_export"
        | "settings_view"
        | "settings_manage"
        | "wms_view"
        | "wms_manage"
        | "tickets_view"
        | "tickets_manage"
        | "admin_full_access"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      actor_touchpoint: ["C4", "Planificador", "Custodio", "Cliente"],
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
      canal_comunicacion: ["whatsapp", "app", "telefono", "email"],
      disponibilidad_custodio: [
        "disponible",
        "ocupado",
        "off",
        "temporalmente_indisponible",
      ],
      estado_custodio: ["activo", "inactivo"],
      estado_oferta: ["enviada", "aceptada", "rechazada", "expirada"],
      estado_servicio: [
        "nuevo",
        "en_oferta",
        "asignado",
        "en_curso",
        "finalizado",
        "cancelado",
      ],
      severidad_evento: ["baja", "media", "alta", "critica"],
      tipo_custodia: ["armado", "no_armado"],
      tipo_evento: [
        "desvio",
        "jammer",
        "ign_on",
        "ign_off",
        "arribo_poi",
        "contacto_custodio",
        "contacto_cliente",
        "otro",
      ],
      tipo_servicio_custodia: [
        "traslado",
        "custodia_local",
        "escolta",
        "vigilancia",
      ],
      user_skill_type: [
        "dashboard_view",
        "leads_management",
        "leads_approval",
        "user_management",
        "role_management",
        "monitoring_view",
        "monitoring_manage",
        "services_view",
        "services_manage",
        "installer_portal_only",
        "custodio_tracking_only",
        "supply_chain_view",
        "supply_chain_manage",
        "reports_view",
        "reports_export",
        "settings_view",
        "settings_manage",
        "wms_view",
        "wms_manage",
        "tickets_view",
        "tickets_manage",
        "admin_full_access",
      ],
    },
  },
} as const
