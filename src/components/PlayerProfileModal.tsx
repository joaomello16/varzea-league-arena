import { useState } from 'react';
import { Player } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, User as UserIcon } from 'lucide-react';

interface PlayerProfileModalProps {
  player: Player | null;
  onClose: () => void;
  onClaimSuccess?: () => void;
}

export function PlayerProfileModal({ player, onClose, onClaimSuccess }: PlayerProfileModalProps) {
  const { user } = useAuth();
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  if (!player) return null;

  // Verificar se o botão "Este player sou eu" deve aparecer
  const shouldShowClaimButton =
    player.user_id === null &&
    user &&
    user.player_id === null &&
    !claimed;

  const handleClaimPlayer = async () => {
    if (!user) return;

    setClaimLoading(true);
    setClaimError(null);
    setClaimMessage(null);

    try {
      const { error } = await supabase.from('player_claims').insert({
        user_id: user.id,
        player_id: player.id,
      });

      if (error) {
        setClaimError(error.message);
      } else {
        setClaimMessage('Solicitação enviada para aprovação');
        setClaimed(true);
        onClaimSuccess?.();
      }
    } catch (err) {
      setClaimError('Erro ao enviar solicitação');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.nick}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={40} className="text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Nick */}
          <h2 className="text-2xl font-heading font-bold text-center text-foreground mb-4">
            {player.nick}
          </h2>

          {/* Bio */}
          {player.bio && (
            <p className="text-center text-muted-foreground mb-6">
              {player.bio}
            </p>
          )}

          {/* Claim Status */}
          {!shouldShowClaimButton && player.user_id !== null && (
            <div className="card-base p-4 bg-muted/30 mb-4">
              <p className="text-sm text-muted-foreground text-center">
                Este player já está vinculado a uma conta
              </p>
            </div>
          )}

          {!shouldShowClaimButton && user && user.player_id !== null && (
            <div className="card-base p-4 bg-muted/30 mb-4">
              <p className="text-sm text-muted-foreground text-center">
                Você já possui um player vinculado
              </p>
            </div>
          )}

          {/* Messages */}
          {claimMessage && (
            <div className="card-base p-4 border-success/50 bg-success/10 mb-4">
              <p className="text-success text-sm">{claimMessage}</p>
            </div>
          )}

          {claimError && (
            <div className="card-base p-4 border-destructive/50 bg-destructive/10 mb-4">
              <p className="text-destructive text-sm">{claimError}</p>
            </div>
          )}

          {/* Claim Button */}
          {shouldShowClaimButton && (
            <button
              onClick={handleClaimPlayer}
              disabled={claimLoading}
              className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
            >
              {claimLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                'Este player sou eu'
              )}
            </button>
          )}

          {/* Close Button */}
          <button onClick={onClose} className="btn-ghost w-full">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
