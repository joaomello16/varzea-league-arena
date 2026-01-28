import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PlayerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlayerRequestModal({ isOpen, onClose, onSuccess }: PlayerRequestModalProps) {
  const [requestedNick, setRequestedNick] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requestedNick.trim()) {
      setError('Digite o nick do player');
      return;
    }

    if (!whatsapp.trim()) {
      setError('Digite o número de WhatsApp');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: err } = await supabase.from('notifications').insert([
        {
          type: 'player_request',
          title: 'Solicitação de novo player',
          message: `Jogador: '${requestedNick}' Número: '${whatsapp}'`,
          metadata: {
            requested_nick: `${requestedNick} - WhatsApp: ${whatsapp}`,
          },
        },
      ]);

      if (err) throw err;

      setRequestedNick('');
      setWhatsapp('');
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
              Digite seu nick:
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

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-muted-foreground mb-2">
              Número de WhatsApp:
            </label>
            <input
              id="whatsapp"
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="input-base w-full"
              placeholder="(11) 99999-9999"
              disabled={isSubmitting}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Sua solicitação será enviada para os administradores. <br /><br />
            OBS: é possivel criar conta sem ter um player vinculado, voce só nao conseguira editar seu perfil até que um administrador aprove sua solicitação. 
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
