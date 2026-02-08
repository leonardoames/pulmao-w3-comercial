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
      calls: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          closer_user_id: string
          criado_em: string
          data_hora: string
          id: string
          lead_id: string
          link_reuniao: string | null
          observacoes: string | null
          plataforma: Database["public"]["Enums"]["call_plataforma"]
          sdr_user_id: string | null
          status: Database["public"]["Enums"]["call_status"]
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          closer_user_id: string
          criado_em?: string
          data_hora: string
          id?: string
          lead_id: string
          link_reuniao?: string | null
          observacoes?: string | null
          plataforma?: Database["public"]["Enums"]["call_plataforma"]
          sdr_user_id?: string | null
          status?: Database["public"]["Enums"]["call_status"]
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          closer_user_id?: string
          criado_em?: string
          data_hora?: string
          id?: string
          lead_id?: string
          link_reuniao?: string | null
          observacoes?: string | null
          plataforma?: Database["public"]["Enums"]["call_plataforma"]
          sdr_user_id?: string | null
          status?: Database["public"]["Enums"]["call_status"]
        }
        Relationships: [
          {
            foreignKeyName: "calls_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_sdr_user_id_fkey"
            columns: ["sdr_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          cidade: string | null
          closer_responsavel_user_id: string | null
          cnpj: string | null
          criado_em: string
          email: string
          estado: string | null
          id: string
          instagram: string | null
          motivo_perda: string | null
          nome_empresa: string
          nome_pessoa: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["lead_origem"]
          sdr_responsavel_user_id: string | null
          status_funil: Database["public"]["Enums"]["lead_status_funil"]
          telefone: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          cidade?: string | null
          closer_responsavel_user_id?: string | null
          cnpj?: string | null
          criado_em?: string
          email: string
          estado?: string | null
          id?: string
          instagram?: string | null
          motivo_perda?: string | null
          nome_empresa: string
          nome_pessoa: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["lead_origem"]
          sdr_responsavel_user_id?: string | null
          status_funil?: Database["public"]["Enums"]["lead_status_funil"]
          telefone: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          cidade?: string | null
          closer_responsavel_user_id?: string | null
          cnpj?: string | null
          criado_em?: string
          email?: string
          estado?: string | null
          id?: string
          instagram?: string | null
          motivo_perda?: string | null
          nome_empresa?: string
          nome_pessoa?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["lead_origem"]
          sdr_responsavel_user_id?: string | null
          status_funil?: Database["public"]["Enums"]["lead_status_funil"]
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_closer_responsavel_user_id_fkey"
            columns: ["closer_responsavel_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sdr_responsavel_user_id_fkey"
            columns: ["sdr_responsavel_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      vendas: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          closer_user_id: string
          criado_em: string
          data_fechamento: string
          data_fim: string
          data_inicio: string
          detalhes_pagamento: string | null
          entrada_valor: number
          forma_pagamento: Database["public"]["Enums"]["venda_forma_pagamento"]
          id: string
          lead_id: string
          observacoes: string | null
          plano_nome: string
          status: Database["public"]["Enums"]["venda_status"]
          valor_total: number
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          closer_user_id: string
          criado_em?: string
          data_fechamento?: string
          data_fim: string
          data_inicio: string
          detalhes_pagamento?: string | null
          entrada_valor?: number
          forma_pagamento?: Database["public"]["Enums"]["venda_forma_pagamento"]
          id?: string
          lead_id: string
          observacoes?: string | null
          plano_nome: string
          status?: Database["public"]["Enums"]["venda_status"]
          valor_total: number
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          closer_user_id?: string
          criado_em?: string
          data_fechamento?: string
          data_fim?: string
          data_inicio?: string
          detalhes_pagamento?: string | null
          entrada_valor?: number
          forma_pagamento?: Database["public"]["Enums"]["venda_forma_pagamento"]
          id?: string
          lead_id?: string
          observacoes?: string | null
          plano_nome?: string
          status?: Database["public"]["Enums"]["venda_status"]
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
            foreignKeyName: "vendas_closer_user_id_fkey"
            columns: ["closer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_comercial: { Args: never; Returns: boolean }
    }
    Enums: {
      call_plataforma: "GoogleMeet" | "Zoom" | "Outro"
      call_status:
        | "Agendada"
        | "Realizada"
        | "No-show"
        | "Remarcada"
        | "Cancelada"
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
      call_plataforma: ["GoogleMeet", "Zoom", "Outro"],
      call_status: [
        "Agendada",
        "Realizada",
        "No-show",
        "Remarcada",
        "Cancelada",
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
