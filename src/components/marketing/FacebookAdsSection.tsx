import { useState, useEffect } from "react";

// Interface que define o formato dos dados retornados para o componente
export interface FacebookAdsData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  conversions: number;
}

export interface FacebookAdsResult {
  status: "success" | "error" | "not_configured" | "token_expired" | "loading";
  data: FacebookAdsData;
  message?: string;
}

// Interface auxiliar para tipar a resposta crua da API do Facebook
interface MetaInsightAction {
  action_type: string;
  value: string;
}

interface MetaInsightResponse {
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  actions?: MetaInsightAction[]; // Campo crucial onde ficam os eventos customizados
  conversions?: MetaInsightAction[];
}

export function useFacebookAdsInsights() {
  const [result, setResult] = useState<FacebookAdsResult>({
    status: "loading",
    data: { spend: 0, impressions: 0, clicks: 0, ctr: 0, leads: 0, conversions: 0 },
  });

  const [isLoading, setIsLoading] = useState(true);

  // Função auxiliar para encontrar o valor de um evento específico
  const getEventValue = (actions: MetaInsightAction[] | undefined, eventName: string): number => {
    if (!actions || !Array.isArray(actions)) return 0;

    // Procura por correspondência exata ou variações comuns de eventos customizados
    const action = actions.find(
      (item) =>
        item.action_type === eventName ||
        item.action_type === `custom_event:${eventName}` ||
        item.action_type === `offsite_conversion.custom.${eventName}`,
    );

    return action ? parseFloat(action.value) : 0;
  };

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);

        // AQUI: Substitua pela sua chamada real à API (seja via Route Handler ou direta)
        // O importante é garantir que o parâmetro 'fields' inclua 'actions'
        const response = await fetch("/api/facebook/insights");

        if (!response.ok) {
          const errorData = await response.json();

          if (response.status === 401 || errorData.code === 190) {
            setResult((prev) => ({ ...prev, status: "token_expired" }));
            return;
          }

          throw new Error(errorData.message || "Erro ao buscar dados");
        }

        const json = await response.json();

        // Supondo que a API retorna um array de dados ou um objeto raiz
        // Ajuste 'json.data[0]' conforme a estrutura exata do seu retorno
        const rawData: MetaInsightResponse = Array.isArray(json.data) ? json.data[0] : json;

        if (!rawData) {
          setResult({
            status: "success", // Retorna sucesso mas zerado se não tiver dados
            data: { spend: 0, impressions: 0, clicks: 0, ctr: 0, leads: 0, conversions: 0 },
          });
          return;
        }

        // --- LÓGICA DE CORREÇÃO DOS LEADS ---
        // Aqui buscamos explicitamente o evento ScheduledCG
        const leadsCount = getEventValue(rawData.actions, "ScheduledCG");
        // ------------------------------------

        setResult({
          status: "success",
          data: {
            spend: parseFloat(rawData.spend || "0"),
            impressions: parseInt(rawData.impressions || "0"),
            clicks: parseInt(rawData.clicks || "0"),
            ctr: parseFloat(rawData.ctr || "0"),
            leads: leadsCount, // Valor corrigido
            conversions: parseInt(rawData.conversions ? rawData.conversions[0]?.value : "0"), // Ajuste conforme necessário
          },
        });
      } catch (error: any) {
        console.error("Erro Facebook Ads:", error);
        setResult((prev) => ({
          ...prev,
          status: "error",
          message: error.message,
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return { result, isLoading };
}
