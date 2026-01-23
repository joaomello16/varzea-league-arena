import { useState } from 'react';
import { Player } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, User as UserIcon, Star } from 'lucide-react';

// Mock titles for display
const mockTitles: Record<string, string[]> = {
  default: [
    'Varzea League S2 – Campeão',
    'Varzea League S1 – Vice-campeão',
  ],
};

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

  // Verificar se é meu próprio player
  const isMyPlayer = user && user.player_id === player.id;

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-md relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Content */}
        <div>
          {/* Cover */}
          {player.cover_url && (
            <img
              src={player.cover_url}
              alt="Cover"
              className="w-full h-32 object-cover"
            />
          )}

          <div className={`flex flex-col items-center text-center ${player.cover_url ? 'pt-4' : 'pt-6'} px-6 pb-6`}>
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-primary/30 overflow-hidden ${player.cover_url ? '-mt-12 border-4 border-card' : 'mb-4'}`}>
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.nick}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={48} className="text-muted-foreground" />
              )}
            </div>

            {player.cover_url && <div className="mb-2" />}

            {/* Nick */}
            <h2 className="text-2xl font-heading font-bold text-neon-blue mb-2">
              {player.nick}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-accent" />
              <span className="font-heading font-semibold text-foreground">
                {player.rating ?? 1000} pts
              </span>
            </div>

            {/* Bio */}
            {player.bio && (
              <p className="text-muted-foreground text-sm mb-6">
                {player.bio}
              </p>
            )}

            {/* Titles */}
            <div className="w-full mb-6">
              <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Títulos
              </h3>
              <div className="space-y-2">
                {(mockTitles[player.id] || mockTitles.default).map((title, i) => (
                  <div
                    key={i}
                    className="bg-muted/50 rounded px-3 py-2 text-sm text-foreground"
                  >
                    {title}
                  </div>
                ))}
              </div>
            </div>

            {/* Vinculação Info */}
            {isMyPlayer && (
              <div className="card-base p-3 bg-success/10 border border-success/30 mb-4 w-full">
                <p className="text-sm text-success text-center">
                  ✓ Este é o seu player
                </p>
              </div>
            )}

            {!shouldShowClaimButton && player.user_id !== null && !isMyPlayer && (
              <div className="card-base p-3 bg-muted/30 mb-4 w-full">
                <p className="text-sm text-muted-foreground text-center">
                  Este player já está vinculado a uma conta
                </p>
              </div>
            )}



            {/* Messages */}
            {claimMessage && (
              <div className="card-base p-4 border-success/50 bg-success/10 mb-4 w-full">
                <p className="text-success text-sm">{claimMessage}</p>
              </div>
            )}

            {claimError && (
              <div className="card-base p-4 border-destructive/50 bg-destructive/10 mb-4 w-full">
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
    </div>
  );
}
