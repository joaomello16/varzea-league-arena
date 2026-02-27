import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Player } from '@/lib/supabase';
import { User, Mail, Shield, Calendar, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PlayerEditModal } from '@/components/PlayerEditModal';
import { useCanEditPlayer } from '@/hooks/use-can-edit-player';

export default function Profile() {
  const { user, session } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [seasonStats, setSeasonStats] = useState<{
    rating: number;
    total_kills: number;
    total_position_points: number;
  } | null>(null);
  const canEditPlayer = useCanEditPlayer(player);

  useEffect(() => {
    if (user?.player_id) {
      const fetchPlayer = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('id', user.player_id)
          .single();
        setPlayer(data as Player);
        setLoading(false);
      };
      fetchPlayer();
    }
  }, [user?.player_id]);

  // Fetch season stats
  useEffect(() => {
    async function fetchSeasonStats() {
      if (!user?.player_id) {
        setSeasonStats(null);
        return;
      }

      try {
        // Buscar temporada ativa
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('id')
          .eq('active', true)
          .single();

        if (!seasonData) {
          setSeasonStats(null);
          return;
        }

        // Buscar stats do player na temporada ativa
        const { data: statsData } = await supabase
          .from('leaderboard_by_season')
          .select('rating, total_kills, total_position_points')
          .eq('player_id', user.player_id)
          .eq('season_id', seasonData.id)
          .single();

        if (statsData) {
          setSeasonStats(statsData);
        } else {
          setSeasonStats(null);
        }
      } catch (err) {
        console.warn('Erro ao buscar estatísticas:', err);
        setSeasonStats(null);
      }
    }

    fetchSeasonStats();
  }, [user?.player_id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    setPlayer(updatedPlayer);
    setIsEditModalOpen(false);
  };

  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-blue mb-8">
          Meu Perfil
        </h1>

        <div className="max-w-2xl mx-auto">
          <div className="card-base p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-2 border-primary/30 overflow-hidden">
                {player?.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt={player.nick}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-primary" />
                )}
              </div>

              {/* Título principal: Nick do player se vinculado, senão nome da conta */}
              <h2 className="text-2xl font-heading font-bold text-foreground">
                {player?.nick || user?.nick}
              </h2>

              {/* Type badge */}
              <span
                className={`mt-2 px-3 py-1 rounded-full text-sm font-heading font-semibold ${
                  user?.type === 'admin'
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}
              >
                {user?.type === 'admin' ? 'Administrador' : 'Usuário'}
              </span>

              {/* Bio do player */}
              {player?.bio && (
                <p className="mt-3 text-muted-foreground text-sm max-w-xs text-center">
                  {player.bio}
                </p>
              )}
            </div>

            {/* Season Stats */}
            {player && (
              <div className="mb-8">
                <h3 className="text-lg font-heading font-bold text-foreground mb-4 text-center">
                  Estatísticas Gerais
                </h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-blue">
                      {seasonStats?.rating ?? 0}
                    </div>
                    <div className="text-sm text-gray-400">Rating</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {seasonStats?.total_kills ?? 0}
                    </div>
                    <div className="text-sm text-gray-400">Kills</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {seasonStats?.total_position_points ?? 0}
                    </div>
                    <div className="text-sm text-gray-400">Pontos Pos.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Mail size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Shield size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Conta</p>
                  <p className="font-medium text-foreground capitalize">
                    {user?.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Calendar size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                  <p className="font-medium text-foreground">
                    {user?.created_at ? formatDate(user.created_at) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Player Link Info */}
            {user?.player_id ? (
              <div className="mt-8 space-y-4">
                {loading ? (
                  <div className="p-4 bg-muted/30 border border-border rounded-lg">
                    <p className="text-muted-foreground text-sm">Carregando perfil do jogador...</p>
                  </div>
                ) : player ? (
                  <>
                    <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                      <p className="text-success text-sm mb-2">
                        ✓ Sua conta está vinculada a um perfil de player
                      </p>
                      <p className="text-foreground font-medium">{player.nick}</p>
                    </div>

                    {/* Edit Button */}
                    {canEditPlayer && (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Editar Perfil de Jogador
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
                <p className="text-muted-foreground text-sm">
                  Sua conta ainda não está vinculada a um perfil de player
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && player && (
        <PlayerEditModal
          player={player}
          onClose={() => setIsEditModalOpen(false)}
          onSaveSuccess={handlePlayerUpdate}
        />
      )}
    </Layout>
  );
}
