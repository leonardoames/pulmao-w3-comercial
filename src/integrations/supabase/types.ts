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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_agents: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          prompt_base: string
          type: Database["public"]["Enums"]["ai_agent_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          prompt_base?: string
          type: Database["public"]["Enums"]["ai_agent_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          prompt_base?: string
          type?: Database["public"]["Enums"]["ai_agent_type"]
        }
        Relationships: []
      }
      ai_outputs: {
        Row: {
          created_at: string
          id: string
          meta_json: Json | null
          output_text: string
          output_type: Database["public"]["Enums"]["ai_output_type"]
          request_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          meta_json?: Json | null
          output_text?: string
          output_type: Database["public"]["Enums"]["ai_output_type"]
          request_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          meta_json?: Json | null
          output_text?: string
          output_type?: Database["public"]["Enums"]["ai_output_type"]
          request_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_outputs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_requests: {
        Row: {
          agent_id: string
          created_at: string
          format: string | null
          id: string
          inputs_json: Json
          platform: Database["public"]["Enums"]["ai_platform"]
          status: Database["public"]["Enums"]["ai_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          format?: string | null
          id?: string
          inputs_json?: Json
          platform?: Database["public"]["Enums"]["ai_platform"]
          status?: Database["public"]["Enums"]["ai_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          format?: string | null
          id?: string
          inputs_json?: Json
          platform?: Database["public"]["Enums"]["ai_platform"]
          status?: Database["public"]["Enums"]["ai_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_comentarios: {
        Row: {
          conteudo_id: string
          criado_em: string
          id: string
          texto: string
          user_id: string
        }
        Insert: {
          conteudo_id: string
          criado_em?: string
          id?: string
          texto?: string
          user_id: string
        }
        Update: {
          conteudo_id?: string
          criado_em?: string
          id?: string
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_comentarios_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos_marketing"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos_marketing: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          data_publicacao: string | null
          id: string
          legenda: string | null
          link_drive: string | null
          onde_postar: string[]
          ordem: number
          responsavel_user_id: string | null
          roteiro: string | null
          status: Database["public"]["Enums"]["conteudo_status"]
          tipo_conteudo: string[]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          data_publicacao?: string | null
          id?: string
          legenda?: string | null
          link_drive?: string | null
          onde_postar?: string[]
          ordem?: number
          responsavel_user_id?: string | null
          roteiro?: string | null
          status?: Database["public"]["Enums"]["conteudo_status"]
          tipo_conteudo?: string[]
          titulo?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          data_publicacao?: string | null
          id?: string
          legenda?: string | null
          link_drive?: string | null
          onde_postar?: string[]
          ordem?: number
          responsavel_user_id?: string | null
          roteiro?: string | null
          status?: Database["public"]["Enums"]["conteudo_status"]
          tipo_conteudo?: string[]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_marketing_responsavel_user_id_fkey"
            columns: ["responsavel_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_marketing_responsavel_user_id_fkey"
            columns: ["responsavel_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos: {
        Row: {
          atualizado_em: string
          calls_realizadas: number
          closer_user_id: string
          criado_em: string
          data: string
          id: string
          no_show: number
          observacoes: string | null
        }
        Insert: {
          atualizado_em?: string
          calls_realizadas?: number
          closer_user_id: string
          criado_em?: string
          data: string
          id?: string
          no_show?: number
          observacoes?: string | null
        }
        Update: {
          atualizado_em?: string
          calls_realizadas?: number
          closer_user_id?: string
          criado_em?: string
          data?: string
          id?: string
          no_show?: number
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_investimentos: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          data: string
          id: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          data: string
          id?: string
          valor?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          data?: string
          id?: string
          valor?: number
        }
        Relationships: []
      }
      ote_goals: {
        Row: {
          atualizado_em: string
          closer_user_id: string
          created_by_user_id: string
          criado_em: string
          id: string
          month_ref: string
          ote_target_value: number
        }
        Insert: {
          atualizado_em?: string
          closer_user_id: string
          created_by_user_id: string
          criado_em?: string
          id?: string
          month_ref: string
          ote_target_value?: number
        }
        Update: {
          atualizado_em?: string
          closer_user_id?: string
          created_by_user_id?: string
          criado_em?: string
          id?: string
          month_ref?: string
          ote_target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ote_goals_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ote_goals_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ote_goals_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ote_goals_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: Database["public"]["Enums"]["user_area"]
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          area?: Database["public"]["Enums"]["user_area"]
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          area?: Database["public"]["Enums"]["user_area"]
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token?: string
        }
        Relationships: []
      }
      social_selling: {
        Row: {
          agendamentos: number
          atualizado_em: string
          closer_user_id: string
          conversas_iniciadas: number
          convites_enviados: number
          criado_em: string
          data: string
          formularios_preenchidos: number
          id: string
          observacoes: string | null
        }
        Insert: {
          agendamentos?: number
          atualizado_em?: string
          closer_user_id: string
          conversas_iniciadas?: number
          convites_enviados?: number
          criado_em?: string
          data: string
          formularios_preenchidos?: number
          id?: string
          observacoes?: string | null
        }
        Update: {
          agendamentos?: number
          atualizado_em?: string
          closer_user_id?: string
          conversas_iniciadas?: number
          convites_enviados?: number
          criado_em?: string
          data?: string
          formularios_preenchidos?: number
          id?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_selling_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_selling_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          closer_user_id: string
          contrato_assinado: boolean
          criado_em: string
          data_fechamento: string
          duracao_contrato_meses: number
          enviado_cs: boolean
          enviado_financeiro: boolean
          id: string
          nome_empresa: string
          nome_lead: string
          observacoes: string | null
          pago: boolean
          quantidade_parcelas_boleto: number
          status: Database["public"]["Enums"]["venda_status"]
          valor_boleto_parcela: number
          valor_cartao: number
          valor_pix: number
          valor_total: number
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          closer_user_id: string
          contrato_assinado?: boolean
          criado_em?: string
          data_fechamento?: string
          duracao_contrato_meses?: number
          enviado_cs?: boolean
          enviado_financeiro?: boolean
          id?: string
          nome_empresa?: string
          nome_lead?: string
          observacoes?: string | null
          pago?: boolean
          quantidade_parcelas_boleto?: number
          status?: Database["public"]["Enums"]["venda_status"]
          valor_boleto_parcela?: number
          valor_cartao?: number
          valor_pix?: number
          valor_total: number
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          closer_user_id?: string
          contrato_assinado?: boolean
          criado_em?: string
          data_fechamento?: string
          duracao_contrato_meses?: number
          enviado_cs?: boolean
          enviado_financeiro?: boolean
          id?: string
          nome_empresa?: string
          nome_lead?: string
          observacoes?: string | null
          pago?: boolean
          quantidade_parcelas_boleto?: number
          status?: Database["public"]["Enums"]["venda_status"]
          valor_boleto_parcela?: number
          valor_cartao?: number
          valor_pix?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_safe: {
        Row: {
          area: Database["public"]["Enums"]["user_area"] | null
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          email: string | null
          id: string | null
          nome: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          area?: Database["public"]["Enums"]["user_area"] | null
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          email?: never
          id?: string | null
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          area?: Database["public"]["Enums"]["user_area"] | null
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          email?: never
          id?: string | null
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_admin_panel: { Args: never; Returns: boolean }
      can_edit_any_fechamento: { Args: never; Returns: boolean }
      can_edit_comercial: { Args: never; Returns: boolean }
      can_edit_vendas: { Args: never; Returns: boolean }
      can_manage_ote_goals: { Args: never; Returns: boolean }
      can_manage_users: { Args: never; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_closer: { Args: never; Returns: boolean }
      is_master: { Args: never; Returns: boolean }
      is_social_selling: { Args: never; Returns: boolean }
    }
    Enums: {
      ai_agent_type: "caption" | "script"
      ai_output_type: "caption" | "script" | "variations"
      ai_platform: "instagram" | "tiktok" | "youtube"
      ai_request_status: "draft" | "processing" | "done" | "error"
      app_role:
        | "MASTER"
        | "DIRETORIA"
        | "GESTOR_COMERCIAL"
        | "CLOSER"
        | "SOCIAL_SELLING"
      call_plataforma: "GoogleMeet" | "Zoom" | "Outro"
      call_status:
        | "Agendada"
        | "Realizada"
        | "No-show"
        | "Remarcada"
        | "Cancelada"
      conteudo_status:
        | "Ideia"
        | "EmGravacao"
        | "EmEdicao"
        | "EmAprovacao"
        | "EmAjuste"
        | "Aprovado"
      lead_origem:
        | "Formulario"
        | "Instagram"
        | "WhatsApp"
        | "Indicacao"
        | "TrafegoPago"
      lead_status_funil:
        | "Novo"
        | "ContatoFeito"
        | "CallAgendada"
        | "CallRealizada"
        | "NoShow"
        | "Perdido"
        | "Ganho"
      user_area: "Comercial" | "CS" | "Financeiro" | "Marketing" | "Diretoria"
      user_role:
        | "CEO"
        | "Founder"
        | "GestorComercial"
        | "Closer"
        | "SDR"
        | "CS"
        | "Mentor"
        | "Financeiro"
        | "Marketing"
      venda_forma_pagamento: "Pix" | "Cartao" | "Boleto"
      venda_status: "Ativo" | "Congelado" | "Cancelado" | "Finalizado"
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
      ai_agent_type: ["caption", "script"],
      ai_output_type: ["caption", "script", "variations"],
      ai_platform: ["instagram", "tiktok", "youtube"],
      ai_request_status: ["draft", "processing", "done", "error"],
      app_role: [
        "MASTER",
        "DIRETORIA",
        "GESTOR_COMERCIAL",
        "CLOSER",
        "SOCIAL_SELLING",
      ],
      call_plataforma: ["GoogleMeet", "Zoom", "Outro"],
      call_status: [
        "Agendada",
        "Realizada",
        "No-show",
        "Remarcada",
        "Cancelada",
      ],
      conteudo_status: [
        "Ideia",
        "EmGravacao",
        "EmEdicao",
        "EmAprovacao",
        "EmAjuste",
        "Aprovado",
      ],
      lead_origem: [
        "Formulario",
        "Instagram",
        "WhatsApp",
        "Indicacao",
        "TrafegoPago",
      ],
      lead_status_funil: [
        "Novo",
        "ContatoFeito",
        "CallAgendada",
        "CallRealizada",
        "NoShow",
        "Perdido",
        "Ganho",
      ],
      user_area: ["Comercial", "CS", "Financeiro", "Marketing", "Diretoria"],
      user_role: [
        "CEO",
        "Founder",
        "GestorComercial",
        "Closer",
        "SDR",
        "CS",
        "Mentor",
        "Financeiro",
        "Marketing",
      ],
      venda_forma_pagamento: ["Pix", "Cartao", "Boleto"],
      venda_status: ["Ativo", "Congelado", "Cancelado", "Finalizado"],
    },
  },
} as const
