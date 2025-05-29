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
          tiempo_retraso: number | null
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
          tiempo_retraso?: number | null
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
          tiempo_retraso?: number | null
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
          tiempo_retraso: number | null
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
          tiempo_retraso: number | null
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
      delete_reward_bypass_rls: {
        Args: { reward_id: string }
        Returns: boolean
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
          tiempo_retraso: number | null
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
          tiempo_retraso: number | null
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
      ],
    },
  },
} as const
