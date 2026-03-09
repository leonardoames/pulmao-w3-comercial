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
      almoxarifado_itens: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string
          criado_em: string
          criado_por: string
          estoque_maximo: number
          estoque_minimo: number
          fornecedor_habitual: string | null
          id: string
          nome: string
          observacoes: string | null
          quantidade_atual: number
          ultimo_preco: number
          unidade_medida: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          criado_por: string
          estoque_maximo?: number
          estoque_minimo?: number
          fornecedor_habitual?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          quantidade_atual?: number
          ultimo_preco?: number
          unidade_medida?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          criado_por?: string
          estoque_maximo?: number
          estoque_minimo?: number
          fornecedor_habitual?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          quantidade_atual?: number
          ultimo_preco?: number
          unidade_medida?: string
        }
        Relationships: []
      }
      almoxarifado_movimentacoes: {
        Row: {
          criado_em: string
          data_movimentacao: string
          id: string
          item_id: string
          observacao: string | null
          quantidade: number
          responsavel_user_id: string
          tipo: string
          valor_unitario: number | null
        }
        Insert: {
          criado_em?: string
          data_movimentacao?: string
          id?: string
          item_id: string
          observacao?: string | null
          quantidade: number
          responsavel_user_id: string
          tipo: string
          valor_unitario?: number | null
        }
        Update: {
          criado_em?: string
          data_movimentacao?: string
          id?: string
          item_id?: string
          observacao?: string | null
          quantidade?: number
          responsavel_user_id?: string
          tipo?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "almoxarifado_movimentacoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "almoxarifado_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      content_daily_logs: {
        Row: {
          created_at: string
          date: string
          followers_gained: number
          followers_leo: number
          followers_w3: number
          id: string
          notes: string | null
          posts_published_count: number
          posts_scheduled_count: number
          responsible_name: string
          responsible_user_id: string
          stories_done_count: number
          updated_at: string
          youtube_videos_published_count: number
        }
        Insert: {
          created_at?: string
          date: string
          followers_gained?: number
          followers_leo?: number
          followers_w3?: number
          id?: string
          notes?: string | null
          posts_published_count?: number
          posts_scheduled_count?: number
          responsible_name?: string
          responsible_user_id: string
          stories_done_count?: number
          updated_at?: string
          youtube_videos_published_count?: number
        }
        Update: {
          created_at?: string
          date?: string
          followers_gained?: number
          followers_leo?: number
          followers_w3?: number
          id?: string
          notes?: string | null
          posts_published_count?: number
          posts_scheduled_count?: number
          responsible_name?: string
          responsible_user_id?: string
          stories_done_count?: number
          updated_at?: string
          youtube_videos_published_count?: number
        }
        Relationships: []
      }
      content_post_items: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          is_required: boolean
          label: string
          platform: Database["public"]["Enums"]["content_item_platform"]
          status: Database["public"]["Enums"]["content_item_status"]
          type: Database["public"]["Enums"]["content_item_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          is_required?: boolean
          label?: string
          platform?: Database["public"]["Enums"]["content_item_platform"]
          status?: Database["public"]["Enums"]["content_item_status"]
          type?: Database["public"]["Enums"]["content_item_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          is_required?: boolean
          label?: string
          platform?: Database["public"]["Enums"]["content_item_platform"]
          status?: Database["public"]["Enums"]["content_item_status"]
          type?: Database["public"]["Enums"]["content_item_type"]
          updated_at?: string
        }
        Relationships: []
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
          reagendado: number
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
          reagendado?: number
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
          reagendado?: number
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
      marketplace_clientes: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          data_entrada: string | null
          dia_cobranca: number | null
          faixas_percentual: Json | null
          faturamento_ao_entrar: number | null
          gestor_user_id: string | null
          id: string
          marketplaces: string[] | null
          modelo_cobranca: Database["public"]["Enums"]["billing_model"]
          nicho: string | null
          nome_ecommerce: string
          observacoes: string | null
          site: string | null
          status: Database["public"]["Enums"]["client_status"]
          valor_fixo: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          data_entrada?: string | null
          dia_cobranca?: number | null
          faixas_percentual?: Json | null
          faturamento_ao_entrar?: number | null
          gestor_user_id?: string | null
          id?: string
          marketplaces?: string[] | null
          modelo_cobranca?: Database["public"]["Enums"]["billing_model"]
          nicho?: string | null
          nome_ecommerce: string
          observacoes?: string | null
          site?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          valor_fixo?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          data_entrada?: string | null
          dia_cobranca?: number | null
          faixas_percentual?: Json | null
          faturamento_ao_entrar?: number | null
          gestor_user_id?: string | null
          id?: string
          marketplaces?: string[] | null
          modelo_cobranca?: Database["public"]["Enums"]["billing_model"]
          nicho?: string | null
          nome_ecommerce?: string
          observacoes?: string | null
          site?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          valor_fixo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_clientes_gestor_user_id_fkey"
            columns: ["gestor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_clientes_gestor_user_id_fkey"
            columns: ["gestor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_registros: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          criado_por: string
          faturamento_informado: number | null
          fixo_cobrado: number | null
          id: string
          mes_ano: string
          observacao: string | null
          percentual_aplicado: number | null
          status_pagamento: Database["public"]["Enums"]["payment_status"]
          total_a_receber: number | null
          valor_variavel: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          criado_por: string
          faturamento_informado?: number | null
          fixo_cobrado?: number | null
          id?: string
          mes_ano: string
          observacao?: string | null
          percentual_aplicado?: number | null
          status_pagamento?: Database["public"]["Enums"]["payment_status"]
          total_a_receber?: number | null
          valor_variavel?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          criado_por?: string
          faturamento_informado?: number | null
          fixo_cobrado?: number | null
          id?: string
          mes_ano?: string
          observacao?: string | null
          percentual_aplicado?: number | null
          status_pagamento?: Database["public"]["Enums"]["payment_status"]
          total_a_receber?: number | null
          valor_variavel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_registros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "marketplace_clientes"
            referencedColumns: ["id"]
          },
        ]
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
      patrimonio_ambientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      patrimonio_bens: {
        Row: {
          ambiente_id: string | null
          atualizado_em: string
          categoria: string
          criado_em: string
          criado_por: string
          data_aquisicao: string
          depreciacao_anual: number
          descricao: string
          estado_conservacao: string
          fornecedor: string | null
          foto_url: string | null
          id: string
          marca_modelo: string | null
          nota_fiscal: string | null
          numero_serie: string | null
          observacoes_manutencao: string | null
          responsavel_user_id: string | null
          status: string
          tombamento: string
          valor_compra: number
          valor_residual_pct: number
          vida_util_anos: number
        }
        Insert: {
          ambiente_id?: string | null
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          criado_por: string
          data_aquisicao?: string
          depreciacao_anual?: number
          descricao: string
          estado_conservacao?: string
          fornecedor?: string | null
          foto_url?: string | null
          id?: string
          marca_modelo?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          observacoes_manutencao?: string | null
          responsavel_user_id?: string | null
          status?: string
          tombamento: string
          valor_compra?: number
          valor_residual_pct?: number
          vida_util_anos?: number
        }
        Update: {
          ambiente_id?: string | null
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          criado_por?: string
          data_aquisicao?: string
          depreciacao_anual?: number
          descricao?: string
          estado_conservacao?: string
          fornecedor?: string | null
          foto_url?: string | null
          id?: string
          marca_modelo?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          observacoes_manutencao?: string | null
          responsavel_user_id?: string | null
          status?: string
          tombamento?: string
          valor_compra?: number
          valor_residual_pct?: number
          vida_util_anos?: number
        }
        Relationships: [
          {
            foreignKeyName: "patrimonio_bens_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "patrimonio_ambientes"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio_manutencoes: {
        Row: {
          bem_id: string
          criado_em: string
          data_manutencao: string
          descricao: string
          id: string
          registrado_por: string
        }
        Insert: {
          bem_id: string
          criado_em?: string
          data_manutencao?: string
          descricao?: string
          id?: string
          registrado_por: string
        }
        Update: {
          bem_id?: string
          criado_em?: string
          data_manutencao?: string
          descricao?: string
          id?: string
          registrado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrimonio_manutencoes_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "patrimonio_bens"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio_transferencias: {
        Row: {
          bem_id: string
          criado_em: string
          data_transferencia: string
          de_ambiente_id: string | null
          de_responsavel_user_id: string | null
          id: string
          observacao: string | null
          para_ambiente_id: string | null
          para_responsavel_user_id: string | null
          transferido_por: string
        }
        Insert: {
          bem_id: string
          criado_em?: string
          data_transferencia?: string
          de_ambiente_id?: string | null
          de_responsavel_user_id?: string | null
          id?: string
          observacao?: string | null
          para_ambiente_id?: string | null
          para_responsavel_user_id?: string | null
          transferido_por: string
        }
        Update: {
          bem_id?: string
          criado_em?: string
          data_transferencia?: string
          de_ambiente_id?: string | null
          de_responsavel_user_id?: string | null
          id?: string
          observacao?: string | null
          para_ambiente_id?: string | null
          para_responsavel_user_id?: string | null
          transferido_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrimonio_transferencias_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "patrimonio_bens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrimonio_transferencias_de_ambiente_id_fkey"
            columns: ["de_ambiente_id"]
            isOneToOne: false
            referencedRelation: "patrimonio_ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrimonio_transferencias_para_ambiente_id_fkey"
            columns: ["para_ambiente_id"]
            isOneToOne: false
            referencedRelation: "patrimonio_ambientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: Database["public"]["Enums"]["user_area"]
          ativo: boolean
          atualizado_em: string
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      rh_avaliacoes: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          comentario_geral: string | null
          created_at: string | null
          id: string
          nota_atitude: number | null
          nota_colaboracao: number | null
          nota_desenvolvimento: number | null
          nota_resultado: number | null
          pontos_fortes: string | null
          pontos_melhoria: string | null
          status: string | null
          tipo_avaliador: string | null
          updated_at: string | null
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          comentario_geral?: string | null
          created_at?: string | null
          id?: string
          nota_atitude?: number | null
          nota_colaboracao?: number | null
          nota_desenvolvimento?: number | null
          nota_resultado?: number | null
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          status?: string | null
          tipo_avaliador?: string | null
          updated_at?: string | null
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          ciclo_id?: string
          comentario_geral?: string | null
          created_at?: string | null
          id?: string
          nota_atitude?: number | null
          nota_colaboracao?: number | null
          nota_desenvolvimento?: number | null
          nota_resultado?: number | null
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          status?: string | null
          tipo_avaliador?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_avaliacoes_avaliado_id_fkey"
            columns: ["avaliado_id"]
            isOneToOne: false
            referencedRelation: "rh_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_avaliacoes_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "rh_ciclos_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_ciclos_avaliacao: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          periodo: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          periodo?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          periodo?: string | null
          status?: string | null
        }
        Relationships: []
      }
      rh_colaboradores: {
        Row: {
          aniversario: string | null
          cargo: string | null
          centro_custo: string[] | null
          chave_pix: string | null
          closer_id: string | null
          cpf_cnpj: string | null
          created_at: string | null
          data_entrada: string | null
          data_termino: string | null
          email: string | null
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          ote_comissao: string | null
          responsavel_id: string | null
          salario: number | null
          setor: string | null
          status: string | null
          telefone: string | null
          tipo_contrato: string | null
          updated_at: string | null
        }
        Insert: {
          aniversario?: string | null
          cargo?: string | null
          centro_custo?: string[] | null
          chave_pix?: string | null
          closer_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_entrada?: string | null
          data_termino?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          ote_comissao?: string | null
          responsavel_id?: string | null
          salario?: number | null
          setor?: string | null
          status?: string | null
          telefone?: string | null
          tipo_contrato?: string | null
          updated_at?: string | null
        }
        Update: {
          aniversario?: string | null
          cargo?: string | null
          centro_custo?: string[] | null
          chave_pix?: string | null
          closer_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_entrada?: string | null
          data_termino?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          ote_comissao?: string | null
          responsavel_id?: string | null
          salario?: number | null
          setor?: string | null
          status?: string | null
          telefone?: string | null
          tipo_contrato?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_colaboradores_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "rh_colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_feedbacks: {
        Row: {
          autor_id: string
          colaborador_id: string
          conteudo: string
          created_at: string | null
          id: string
          tipo: string | null
          titulo: string | null
          visibilidade: string | null
        }
        Insert: {
          autor_id: string
          colaborador_id: string
          conteudo: string
          created_at?: string | null
          id?: string
          tipo?: string | null
          titulo?: string | null
          visibilidade?: string | null
        }
        Update: {
          autor_id?: string
          colaborador_id?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          tipo?: string | null
          titulo?: string | null
          visibilidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_feedbacks_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "rh_colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_organograma_positions: {
        Row: {
          colaborador_id: string
          id: string
          layout_mode: string
          node_position_x: number
          node_position_y: number
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          id?: string
          layout_mode?: string
          node_position_x?: number
          node_position_y?: number
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          id?: string
          layout_mode?: string
          node_position_x?: number
          node_position_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_organograma_positions_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "rh_colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_setores_config: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          icone: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          resource_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          resource_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
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
      trafego_pago_clientes: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          data_entrada: string | null
          dia_cobranca: number | null
          faturamento_ao_entrar: number | null
          gestor_user_id: string | null
          id: string
          nicho: string | null
          nome_ecommerce: string
          observacoes: string | null
          plataformas: string[] | null
          site: string | null
          status: Database["public"]["Enums"]["client_status"]
          tabela_precos: string | null
          valor_mrr: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          data_entrada?: string | null
          dia_cobranca?: number | null
          faturamento_ao_entrar?: number | null
          gestor_user_id?: string | null
          id?: string
          nicho?: string | null
          nome_ecommerce: string
          observacoes?: string | null
          plataformas?: string[] | null
          site?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tabela_precos?: string | null
          valor_mrr?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          data_entrada?: string | null
          dia_cobranca?: number | null
          faturamento_ao_entrar?: number | null
          gestor_user_id?: string | null
          id?: string
          nicho?: string | null
          nome_ecommerce?: string
          observacoes?: string | null
          plataformas?: string[] | null
          site?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tabela_precos?: string | null
          valor_mrr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trafego_pago_clientes_gestor_user_id_fkey"
            columns: ["gestor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trafego_pago_clientes_gestor_user_id_fkey"
            columns: ["gestor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      trafego_pago_registros: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          criado_por: string
          id: string
          investimento_gerenciado: number | null
          mes_ano: string
          observacao: string | null
          roas_entregue: number | null
          status_pagamento: Database["public"]["Enums"]["payment_status"]
          valor_pago: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          criado_por: string
          id?: string
          investimento_gerenciado?: number | null
          mes_ano: string
          observacao?: string | null
          roas_entregue?: number | null
          status_pagamento?: Database["public"]["Enums"]["payment_status"]
          valor_pago?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          criado_por?: string
          id?: string
          investimento_gerenciado?: number | null
          mes_ano?: string
          observacao?: string | null
          roas_entregue?: number | null
          status_pagamento?: Database["public"]["Enums"]["payment_status"]
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trafego_pago_registros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "trafego_pago_clientes"
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
          motivo_reembolso: string | null
          nome_empresa: string
          nome_lead: string
          observacoes: string | null
          origem_lead: string | null
          pago: boolean
          quantidade_parcelas_boleto: number
          reembolsado_em: string | null
          reembolsado_por: string | null
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
          motivo_reembolso?: string | null
          nome_empresa?: string
          nome_lead?: string
          observacoes?: string | null
          origem_lead?: string | null
          pago?: boolean
          quantidade_parcelas_boleto?: number
          reembolsado_em?: string | null
          reembolsado_por?: string | null
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
          motivo_reembolso?: string | null
          nome_empresa?: string
          nome_lead?: string
          observacoes?: string | null
          origem_lead?: string | null
          pago?: boolean
          quantidade_parcelas_boleto?: number
          reembolsado_em?: string | null
          reembolsado_por?: string | null
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
          {
            foreignKeyName: "vendas_reembolsado_por_fkey"
            columns: ["reembolsado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_reembolsado_por_fkey"
            columns: ["reembolsado_por"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          ambiente: string
          ativo: boolean
          atualizado_em: string
          criado_em: string
          criado_por: string
          evento: string
          id: string
          nome: string
          url: string
        }
        Insert: {
          ambiente?: string
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          evento?: string
          id?: string
          nome?: string
          url: string
        }
        Update: {
          ambiente?: string
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          evento?: string
          id?: string
          nome?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_criado_por_fkey"
            columns: ["criado_por"]
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
      can_edit_administrativo: { Args: never; Returns: boolean }
      can_edit_any_fechamento: { Args: never; Returns: boolean }
      can_edit_comercial: { Args: never; Returns: boolean }
      can_edit_content: { Args: never; Returns: boolean }
      can_edit_rh: { Args: never; Returns: boolean }
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
        | "SDR"
        | "ANALISTA_CONTEUDO"
        | "GESTOR_TRAFEGO"
        | "GESTOR_MARKETPLACE"
        | "ADMINISTRATIVO"
      billing_model: "percentual_faixas" | "fixo_percentual" | "somente_fixo"
      call_plataforma: "GoogleMeet" | "Zoom" | "Outro"
      call_status:
        | "Agendada"
        | "Realizada"
        | "No-show"
        | "Remarcada"
        | "Cancelada"
      client_status: "Ativo" | "Pausado" | "Cancelado" | "Trial"
      content_item_platform: "instagram" | "tiktok" | "youtube" | "other"
      content_item_status: "pendente" | "feito" | "agendado"
      content_item_type: "reels" | "feed" | "stories" | "youtube" | "other"
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
      payment_status: "Pago" | "Pendente" | "Atrasado"
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
      venda_status:
        | "Ativo"
        | "Congelado"
        | "Cancelado"
        | "Finalizado"
        | "Reembolsado"
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
        "SDR",
        "ANALISTA_CONTEUDO",
        "GESTOR_TRAFEGO",
        "GESTOR_MARKETPLACE",
        "ADMINISTRATIVO",
      ],
      billing_model: ["percentual_faixas", "fixo_percentual", "somente_fixo"],
      call_plataforma: ["GoogleMeet", "Zoom", "Outro"],
      call_status: [
        "Agendada",
        "Realizada",
        "No-show",
        "Remarcada",
        "Cancelada",
      ],
      client_status: ["Ativo", "Pausado", "Cancelado", "Trial"],
      content_item_platform: ["instagram", "tiktok", "youtube", "other"],
      content_item_status: ["pendente", "feito", "agendado"],
      content_item_type: ["reels", "feed", "stories", "youtube", "other"],
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
      payment_status: ["Pago", "Pendente", "Atrasado"],
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
      venda_status: [
        "Ativo",
        "Congelado",
        "Cancelado",
        "Finalizado",
        "Reembolsado",
      ],
    },
  },
} as const
