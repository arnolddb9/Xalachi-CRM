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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      articulos: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          stock_actual: number
          tipo: string
          unidad_medida: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
          stock_actual?: number
          tipo: string
          unidad_medida?: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          stock_actual?: number
          tipo?: string
          unidad_medida?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          creado_en: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          tipo: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          tipo?: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          tipo?: string
        }
        Relationships: []
      }
      compras: {
        Row: {
          articulo_id: string | null
          cantidad: number | null
          costo_total: number | null
          creado_en: string
          creado_por: string | null
          fecha_compra: string
          id: string
          lote_id: string | null
          notas: string | null
          numero_factura: string | null
          proveedor_id: string
          tipo_compra: string
        }
        Insert: {
          articulo_id?: string | null
          cantidad?: number | null
          costo_total?: number | null
          creado_en?: string
          creado_por?: string | null
          fecha_compra?: string
          id?: string
          lote_id?: string | null
          notas?: string | null
          numero_factura?: string | null
          proveedor_id: string
          tipo_compra?: string
        }
        Update: {
          articulo_id?: string | null
          cantidad?: number | null
          costo_total?: number | null
          creado_en?: string
          creado_por?: string | null
          fecha_compra?: string
          id?: string
          lote_id?: string | null
          notas?: string | null
          numero_factura?: string | null
          proveedor_id?: string
          tipo_compra?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          actualizado_en: string
          factor_kg_por_cajuela: number
          id: number
        }
        Insert: {
          actualizado_en?: string
          factor_kg_por_cajuela?: number
          id?: number
        }
        Update: {
          actualizado_en?: string
          factor_kg_por_cajuela?: number
          id?: number
        }
        Relationships: []
      }
      empacados: {
        Row: {
          articulo_id: string
          creado_en: string
          id: string
          insumo_articulo_id: string | null
          lote_origen_id: string
          peso_kg: number
          presentacion_id: string
          unidades: number
          usuario_id: string | null
        }
        Insert: {
          articulo_id: string
          creado_en?: string
          id?: string
          insumo_articulo_id?: string | null
          lote_origen_id: string
          peso_kg: number
          presentacion_id: string
          unidades: number
          usuario_id?: string | null
        }
        Update: {
          articulo_id?: string
          creado_en?: string
          id?: string
          insumo_articulo_id?: string | null
          lote_origen_id?: string
          peso_kg?: number
          presentacion_id?: string
          unidades?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empacados_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empacados_insumo_articulo_id_fkey"
            columns: ["insumo_articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empacados_lote_origen_id_fkey"
            columns: ["lote_origen_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empacados_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: false
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empacados_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fincas: {
        Row: {
          activo: boolean
          creado_en: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      lotes: {
        Row: {
          calidad: string | null
          cantidad_cajuelas: number | null
          creado_en: string
          etapa: string
          fecha_cosecha: string | null
          finca_id: string | null
          id: string
          nombre: string | null
          numero_cama_secado: string | null
          perfil_tueste_id: string | null
          peso_actual_kg: number
          peso_inicial_kg: number
          proceso_beneficiado_id: string | null
          proveedor_id: string | null
          variedad_id: string
        }
        Insert: {
          calidad?: string | null
          cantidad_cajuelas?: number | null
          creado_en?: string
          etapa: string
          fecha_cosecha?: string | null
          finca_id?: string | null
          id?: string
          nombre?: string | null
          numero_cama_secado?: string | null
          perfil_tueste_id?: string | null
          peso_actual_kg: number
          peso_inicial_kg: number
          proceso_beneficiado_id?: string | null
          proveedor_id?: string | null
          variedad_id: string
        }
        Update: {
          calidad?: string | null
          cantidad_cajuelas?: number | null
          creado_en?: string
          etapa?: string
          fecha_cosecha?: string | null
          finca_id?: string | null
          id?: string
          nombre?: string | null
          numero_cama_secado?: string | null
          perfil_tueste_id?: string | null
          peso_actual_kg?: number
          peso_inicial_kg?: number
          proceso_beneficiado_id?: string | null
          proveedor_id?: string | null
          variedad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "fincas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_perfil_tueste_id_fkey"
            columns: ["perfil_tueste_id"]
            isOneToOne: false
            referencedRelation: "perfiles_tueste"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_proceso_beneficiado_id_fkey"
            columns: ["proceso_beneficiado_id"]
            isOneToOne: false
            referencedRelation: "procesos_beneficiado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_variedad_id_fkey"
            columns: ["variedad_id"]
            isOneToOne: false
            referencedRelation: "variedades"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_proceso: {
        Row: {
          creado_en: string
          id: string
          lote_destino_id: string
          lote_origen_id: string
          merma_pct: number
          proceso_beneficiado_id: string | null
          tipo_proceso: string
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          id?: string
          lote_destino_id: string
          lote_origen_id: string
          merma_pct: number
          proceso_beneficiado_id?: string | null
          tipo_proceso: string
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          id?: string
          lote_destino_id?: string
          lote_origen_id?: string
          merma_pct?: number
          proceso_beneficiado_id?: string | null
          tipo_proceso?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_proceso_lote_destino_id_fkey"
            columns: ["lote_destino_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_proceso_lote_origen_id_fkey"
            columns: ["lote_origen_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_proceso_proceso_beneficiado_id_fkey"
            columns: ["proceso_beneficiado_id"]
            isOneToOne: false
            referencedRelation: "procesos_beneficiado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_proceso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pasos_beneficiado: {
        Row: {
          id: string
          nombre: string
          orden: number
          proceso_beneficiado_id: string
        }
        Insert: {
          id?: string
          nombre: string
          orden: number
          proceso_beneficiado_id: string
        }
        Update: {
          id?: string
          nombre?: string
          orden?: number
          proceso_beneficiado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasos_beneficiado_proceso_beneficiado_id_fkey"
            columns: ["proceso_beneficiado_id"]
            isOneToOne: false
            referencedRelation: "procesos_beneficiado"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_tueste: {
        Row: {
          activo: boolean
          creado_en: string
          descripcion: string | null
          id: string
          nivel: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nivel: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nivel?: string
          nombre?: string
        }
        Relationships: []
      }
      presentaciones: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          peso_gramos: number | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
          peso_gramos?: number | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          peso_gramos?: number | null
        }
        Relationships: []
      }
      procesos_beneficiado: {
        Row: {
          activo: boolean
          creado_en: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          creado_en: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          role: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id: string
          nombre: string
          role: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          role?: string
        }
        Relationships: []
      }
      variedades: {
        Row: {
          activo: boolean
          creado_en: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ajustar_stock_articulo: {
        Args: { p_articulo_id: string; p_stock_nuevo: number }
        Returns: undefined
      }
      aplicar_molido: {
        Args: { p_lote_origen_id: string; p_merma_pct: number }
        Returns: string
      }
      aplicar_trillado: {
        Args: { p_lote_origen_id: string; p_merma_pct: number }
        Returns: string
      }
      aplicar_tueste: {
        Args: {
          p_lote_origen_id: string
          p_merma_pct: number
          p_perfil_tueste_id: string
        }
        Returns: string
      }
      clasificar_calidad_lote: {
        Args: {
          p_lote_origen_id: string
          p_primera_kg: number
          p_rechazo_kg: number
          p_segunda_kg: number
          p_tercera_kg: number
        }
        Returns: undefined
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      eliminar_compra: { Args: { p_compra_id: string }; Returns: undefined }
      eliminar_empacado: { Args: { p_empacado_id: string }; Returns: undefined }
      empacar_lote: {
        Args: {
          p_articulo_id: string
          p_insumo_articulo_id: string
          p_lote_origen_id: string
          p_presentacion_id: string
          p_unidades: number
        }
        Returns: string
      }
      fn_purge_audit_log: {
        Args: { retencion_dias?: number }
        Returns: undefined
      }
      iniciar_o_avanzar_beneficiado: {
        Args: {
          p_lote_origen_id: string
          p_merma_pct: number
          p_proceso_beneficiado_id: string
        }
        Returns: string
      }
      registrar_compra_articulo: {
        Args: {
          p_articulo_id: string
          p_cantidad: number
          p_costo_total: number
          p_fecha_compra: string
          p_notas: string
          p_numero_factura: string
          p_proveedor_id: string
        }
        Returns: string
      }
      registrar_compra_lote: {
        Args: {
          p_cantidad_cajuelas: number
          p_costo_total: number
          p_etapa: string
          p_fecha_compra: string
          p_fecha_cosecha: string
          p_finca_id: string
          p_nombre: string
          p_notas: string
          p_numero_cama_secado: string
          p_numero_factura: string
          p_peso_actual_kg: number
          p_proveedor_id: string
          p_variedad_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
