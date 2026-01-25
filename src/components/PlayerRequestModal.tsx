import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PlayerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlayerRequestModal({ isOpen, onClose, onSuccess }: PlayerRequestModalProps) {
  const [requestedNick, setRequestedNick] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requestedNick.trim()) {
      setError('Digite o nick do player');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: err } = await supabase.from('notifications').insert([
        {
          type: 'player_request',
          title: 'Solicitação de novo player',
          message: `Usuário não encontrou seu player na listagem: ${requestedNick}`,
          metadata: {
            requested_nick: requestedNick,
          },
        },
      ]);

      if (err) throw err;

      setRequestedNick('');
      onSuccess();
    } catch (err) {
      console.error('Error creating player request:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card-base w-full max-w-md p-6">
        <h2 className="text-lg font-heading font-bold mb-4">Solicitar novo player</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="requested-nick" className="block text-sm font-medium text-muted-foreground mb-2">
              Qual é o nick do seu player?
            </label>
            <input
              id="requested-nick"
              type="text"
              value={requestedNick}
              onChange={(e) => setRequestedNick(e.target.value)}
              className="input-base w-full"
              placeholder="Digite seu nick no jogo"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Sua solicitação será enviada para os administradores. Eles verificarão se o player existe no sistema.
          </p>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting && <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
              Enviar Solicitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
