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
          precio_venta: number
          stock_actual: number
          tipo: string
          unidad_medida: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
          precio_venta?: number
          stock_actual?: number
          tipo: string
          unidad_medida?: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          precio_venta?: number
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
      lotes_servicio: {
        Row: {
          calidad: string | null
          cantidad_cajuelas: number | null
          creado_en: string
          etapa: string
          id: string
          orden_servicio_id: string
          perfil_tueste_id: string | null
          peso_actual_kg: number
          peso_inicial_kg: number
          proceso_beneficiado_id: string | null
        }
        Insert: {
          calidad?: string | null
          cantidad_cajuelas?: number | null
          creado_en?: string
          etapa: string
          id?: string
          orden_servicio_id: string
          perfil_tueste_id?: string | null
          peso_actual_kg: number
          peso_inicial_kg: number
          proceso_beneficiado_id?: string | null
        }
        Update: {
          calidad?: string | null
          cantidad_cajuelas?: number | null
          creado_en?: string
          etapa?: string
          id?: string
          orden_servicio_id?: string
          perfil_tueste_id?: string | null
          peso_actual_kg?: number
          peso_inicial_kg?: number
          proceso_beneficiado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_servicio_orden_servicio_id_fkey"
            columns: ["orden_servicio_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_servicio_perfil_tueste_id_fkey"
            columns: ["perfil_tueste_id"]
            isOneToOne: false
            referencedRelation: "perfiles_tueste"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_servicio_proceso_beneficiado_id_fkey"
            columns: ["proceso_beneficiado_id"]
            isOneToOne: false
            referencedRelation: "procesos_beneficiado"
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
      ordenes_servicio: {
        Row: {
          cantidad_kg: number
          cliente_id: string
          creado_en: string
          creado_por: string | null
          estado: string
          etapa_entrada: string
          fecha_entrega: string | null
          fecha_recepcion: string
          id: string
          notas: string | null
        }
        Insert: {
          cantidad_kg: number
          cliente_id: string
          creado_en?: string
          creado_por?: string | null
          estado?: string
          etapa_entrada: string
          fecha_entrega?: string | null
          fecha_recepcion?: string
          id?: string
          notas?: string | null
        }
        Update: {
          cantidad_kg?: number
          cliente_id?: string
          creado_en?: string
          creado_por?: string | null
          estado?: string
          etapa_entrada?: string
          fecha_entrega?: string | null
          fecha_recepcion?: string
          id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_creado_por_fkey"
            columns: ["creado_por"]
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
      pasos_servicio: {
        Row: {
          costo_total: number | null
          creado_en: string
          id: string
          lote_servicio_destino_id: string
          lote_servicio_origen_id: string
          merma_pct: number
          peso_procesado_kg: number
          tarifa_kg: number
          tipo_proceso: string
          usuario_id: string | null
        }
        Insert: {
          costo_total?: number | null
          creado_en?: string
          id?: string
          lote_servicio_destino_id: string
          lote_servicio_origen_id: string
          merma_pct: number
          peso_procesado_kg: number
          tarifa_kg: number
          tipo_proceso: string
          usuario_id?: string | null
        }
        Update: {
          costo_total?: number | null
          creado_en?: string
          id?: string
          lote_servicio_destino_id?: string
          lote_servicio_origen_id?: string
          merma_pct?: number
          peso_procesado_kg?: number
          tarifa_kg?: number
          tipo_proceso?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pasos_servicio_lote_servicio_destino_id_fkey"
            columns: ["lote_servicio_destino_id"]
            isOneToOne: false
            referencedRelation: "lotes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasos_servicio_lote_servicio_origen_id_fkey"
            columns: ["lote_servicio_origen_id"]
            isOneToOne: false
            referencedRelation: "lotes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasos_servicio_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          articulo_id: string | null
          cantidad: number
          creado_en: string
          id: string
          lote_id: string | null
          motivo_cambio_precio: string | null
          pedido_id: string
          precio_lista: number | null
          precio_unitario: number
          subtotal: number | null
          tipo_item: string
        }
        Insert: {
          articulo_id?: string | null
          cantidad: number
          creado_en?: string
          id?: string
          lote_id?: string | null
          motivo_cambio_precio?: string | null
          pedido_id: string
          precio_lista?: number | null
          precio_unitario: number
          subtotal?: number | null
          tipo_item: string
        }
        Update: {
          articulo_id?: string | null
          cantidad?: number
          creado_en?: string
          id?: string
          lote_id?: string | null
          motivo_cambio_precio?: string | null
          pedido_id?: string
          precio_lista?: number | null
          precio_unitario?: number
          subtotal?: number | null
          tipo_item?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          creado_en: string
          creado_por: string | null
          estado: string
          id: string
          notas: string | null
          venta_id: string | null
        }
        Insert: {
          cliente_id: string
          creado_en?: string
          creado_por?: string | null
          estado?: string
          id?: string
          notas?: string | null
          venta_id?: string | null
        }
        Update: {
          cliente_id?: string
          creado_en?: string
          creado_por?: string | null
          estado?: string
          id?: string
          notas?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
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
      presupuesto_items: {
        Row: {
          costo_estimado: number | null
          creado_en: string
          id: string
          kg_estimado: number
          presupuesto_id: string
          tarifa_kg: number
          tipo_proceso: string
        }
        Insert: {
          costo_estimado?: number | null
          creado_en?: string
          id?: string
          kg_estimado: number
          presupuesto_id: string
          tarifa_kg: number
          tipo_proceso: string
        }
        Update: {
          costo_estimado?: number | null
          creado_en?: string
          id?: string
          kg_estimado?: number
          presupuesto_id?: string
          tarifa_kg?: number
          tipo_proceso?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_items_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos_servicio: {
        Row: {
          cantidad_cajuelas: number | null
          cantidad_kg: number | null
          cliente_id: string
          creado_en: string
          creado_por: string | null
          estado: string
          etapa_entrada: string
          id: string
          notas: string | null
          orden_servicio_id: string | null
          proceso_beneficiado_id: string | null
        }
        Insert: {
          cantidad_cajuelas?: number | null
          cantidad_kg?: number | null
          cliente_id: string
          creado_en?: string
          creado_por?: string | null
          estado?: string
          etapa_entrada: string
          id?: string
          notas?: string | null
          orden_servicio_id?: string | null
          proceso_beneficiado_id?: string | null
        }
        Update: {
          cantidad_cajuelas?: number | null
          cantidad_kg?: number | null
          cliente_id?: string
          creado_en?: string
          creado_por?: string | null
          estado?: string
          etapa_entrada?: string
          id?: string
          notas?: string | null
          orden_servicio_id?: string | null
          proceso_beneficiado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_servicio_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_servicio_orden_servicio_id_fkey"
            columns: ["orden_servicio_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_servicio_proceso_beneficiado_id_fkey"
            columns: ["proceso_beneficiado_id"]
            isOneToOne: false
            referencedRelation: "procesos_beneficiado"
            referencedColumns: ["id"]
          },
        ]
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
      tarifas_servicio: {
        Row: {
          creado_en: string
          id: string
          tarifa_kg: number
          tipo_servicio: string
        }
        Insert: {
          creado_en?: string
          id?: string
          tarifa_kg?: number
          tipo_servicio: string
        }
        Update: {
          creado_en?: string
          id?: string
          tarifa_kg?: number
          tipo_servicio?: string
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
      venta_items: {
        Row: {
          articulo_id: string | null
          cantidad: number
          creado_en: string
          id: string
          lote_id: string | null
          precio_unitario: number
          subtotal: number | null
          tipo_item: string
          venta_id: string
        }
        Insert: {
          articulo_id?: string | null
          cantidad: number
          creado_en?: string
          id?: string
          lote_id?: string | null
          precio_unitario: number
          subtotal?: number | null
          tipo_item: string
          venta_id: string
        }
        Update: {
          articulo_id?: string | null
          cantidad?: number
          creado_en?: string
          id?: string
          lote_id?: string | null
          precio_unitario?: number
          subtotal?: number | null
          tipo_item?: string
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_items_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_items_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cliente_id: string
          creado_en: string
          creado_por: string | null
          estado_pago: string
          id: string
          notas: string | null
          pedido_id: string | null
        }
        Insert: {
          cliente_id: string
          creado_en?: string
          creado_por?: string | null
          estado_pago?: string
          id?: string
          notas?: string | null
          pedido_id?: string | null
        }
        Update: {
          cliente_id?: string
          creado_en?: string
          creado_por?: string | null
          estado_pago?: string
          id?: string
          notas?: string | null
          pedido_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agregar_item_pedido_granel: {
        Args: {
          p_cantidad_kg: number
          p_lote_id: string
          p_pedido_id: string
          p_precio_unitario: number
        }
        Returns: string
      }
      agregar_item_pedido_producto: {
        Args: {
          p_articulo_id: string
          p_cantidad: number
          p_motivo: string
          p_pedido_id: string
          p_precio_unitario: number
        }
        Returns: string
      }
      agregar_item_presupuesto: {
        Args: {
          p_kg_estimado: number
          p_presupuesto_id: string
          p_tipo_proceso: string
        }
        Returns: string
      }
      ajustar_stock_articulo: {
        Args: { p_articulo_id: string; p_stock_nuevo: number }
        Returns: undefined
      }
      aplicar_beneficiado_servicio: {
        Args: {
          p_kg_a_procesar: number
          p_lote_servicio_origen_id: string
          p_merma_pct: number
        }
        Returns: string
      }
      aplicar_clasificacion_servicio: {
        Args: {
          p_lote_servicio_origen_id: string
          p_primera_kg: number
          p_rechazo_kg: number
          p_segunda_kg: number
          p_tercera_kg: number
        }
        Returns: undefined
      }
      aplicar_molido: {
        Args: {
          p_kg_a_procesar: number
          p_lote_origen_id: string
          p_merma_pct: number
        }
        Returns: string
      }
      aplicar_molido_servicio: {
        Args: {
          p_kg_a_procesar: number
          p_lote_servicio_origen_id: string
          p_merma_pct: number
        }
        Returns: string
      }
      aplicar_pelado_servicio: {
        Args: {
          p_kg_a_procesar: number
          p_lote_servicio_origen_id: string
          p_merma_pct: number
        }
        Returns: string
      }
      aplicar_trillado: {
        Args: { p_lote_origen_id: string; p_merma_pct: number }
        Returns: string
      }
      aplicar_tueste: {
        Args: {
          p_kg_a_procesar: number
          p_lote_origen_id: string
          p_merma_pct: number
          p_perfil_tueste_id: string
        }
        Returns: string
      }
      aplicar_tueste_servicio: {
        Args: {
          p_kg_a_procesar: number
          p_lote_servicio_origen_id: string
          p_merma_pct: number
          p_perfil_tueste_id: string
        }
        Returns: string
      }
      aprobar_presupuesto_servicio: {
        Args: { p_presupuesto_id: string }
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
      confirmar_pedido: { Args: { p_pedido_id: string }; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      eliminar_compra: { Args: { p_compra_id: string }; Returns: undefined }
      eliminar_empacado: { Args: { p_empacado_id: string }; Returns: undefined }
      eliminar_venta: { Args: { p_venta_id: string }; Returns: undefined }
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
      registrar_orden_servicio: {
        Args: {
          p_cantidad_cajuelas: number
          p_cantidad_kg: number
          p_cliente_id: string
          p_etapa_entrada: string
          p_fecha_recepcion: string
          p_notas: string
          p_proceso_beneficiado_id: string
        }
        Returns: string
      }
      registrar_pedido: {
        Args: { p_cliente_id: string; p_notas: string }
        Returns: string
      }
      registrar_presupuesto_servicio: {
        Args: {
          p_cantidad_cajuelas: number
          p_cantidad_kg: number
          p_cliente_id: string
          p_etapa_entrada: string
          p_notas: string
          p_proceso_beneficiado_id: string
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
