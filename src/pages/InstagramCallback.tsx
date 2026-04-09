import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Status = 'loading' | 'success' | 'error';

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // account_label passado via state

    if (error) {
      setStatus('error');
      setMessage('Autorização cancelada ou negada pelo Instagram.');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Código de autorização não encontrado.');
      return;
    }

    const redirectUri = `${window.location.origin}/instagram/callback`;

    supabase.functions
      .invoke('instagram-exchange-token', {
        body: { code, redirect_uri: redirectUri, account_label: state || '' },
      })
      .then(({ data, error: fnError }) => {
        if (fnError || data?.error) {
          setStatus('error');
          setMessage(data?.error || fnError?.message || 'Erro ao conectar conta.');
        } else {
          setStatus('success');
          setMessage(`Conta @${data.username} conectada com sucesso!`);
        }
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Conectando conta Instagram...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="text-lg font-semibold">{message}</h2>
            <p className="text-sm text-muted-foreground">
              As métricas serão sincronizadas automaticamente.
            </p>
            <Button onClick={() => navigate('/painel-admin')}>
              Voltar ao painel admin
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Erro na conexão</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" onClick={() => navigate('/painel-admin')}>
              Voltar ao painel admin
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
