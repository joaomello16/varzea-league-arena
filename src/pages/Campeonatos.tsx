import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Trophy, X, Play, ExternalLink } from 'lucide-react';

// Tipos para as views do Supabase
interface TournamentWinner {
  player_id: string;
  nick: string;
  avatar_url: string | null;
}

interface TournamentListItem {
  tournament_id: string;
  name: string;
  edition: number;
  finished: boolean;
  created_at: string;
  tournament_type: string;
  season_id?: string;
  mvp_player_id?: string;
  mvp_nick: string | null;
  mvp_avatar_url: string | null;
  winners: TournamentWinner[];
}

interface TournamentDetailRow {
  tournament_id: string;
  name: string;
  edition: number;
  tournament_type: string;
  finished: boolean;
  created_at: string;
  vod_url: string | null;
  mvp_player_id: string | null;
  mvp_nick: string | null;
  mvp_avatar_url: string | null;
}

interface TournamentPodiumPlayer {
  tournament_id: string;
  position: number;
  kills: number;
  player_id: string;
  nick: string;
  avatar_url: string | null;
}

interface TournamentForDisplay {
  id: string;
  name: string;
  edition: number;
  date: string;
  status: 'Em andamento' | 'Finalizado';
  type: string;
  winners: TournamentWinner[];
  mvp: { nick: string | null; avatar_url: string | null };
}

// Avatar com fallback
function PlayerAvatar({ name, avatarUrl, size = 'md' }: { name: string | null | undefined; avatarUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!name) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-neon-blue to-accent flex items-center justify-center font-heading font-bold text-white`}>
      {initials}
    </div>
  );
}

function TournamentCard({ tournament, onClick }: { tournament: TournamentForDisplay; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="card-interactive p-6 cursor-pointer hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground">
            {tournament.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Edição {tournament.edition} • {tournament.type}</p>
          <p className="text-xs text-muted-foreground mt-1">{tournament.date}</p>
        </div>
        <span
          className={
            tournament.status === 'Em andamento' ? 'badge-active' : 'badge-finished'
          }
        >
          {tournament.status}
        </span>
      </div>

      <div className="space-y-4 mt-6">
        {/* Winners */}
        {tournament.winners.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Campeões</p>
            <div className="flex flex-wrap gap-2">
              {tournament.winners.map((winner) => (
                <div key={winner.player_id} className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border border-yellow-400/30 px-2 py-1 rounded-lg">
                  <PlayerAvatar name={winner.nick} avatarUrl={winner.avatar_url} size="sm" />
                  <span className="text-xs font-semibold text-yellow-500">{winner.nick}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MVP */}
        {tournament.mvp.nick && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MVP</p>
            <div className="flex items-center gap-2">
              <PlayerAvatar name={tournament.mvp.nick} avatarUrl={tournament.mvp.avatar_url} size="sm" />
              <p className="text-sm font-heading font-semibold text-neon-yellow">{tournament.mvp.nick}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentDetailModal({
  tournamentId,
  onClose,
}: {
  tournamentId: string;
  onClose: () => void;
}) {
  const [tournamentInfo, setTournamentInfo] = useState<TournamentDetailRow | null>(null);
  const [podiumPlayers, setPodiumPlayers] = useState<TournamentPodiumPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fechar menus do header ao abrir modal
  useEffect(() => {
    window.dispatchEvent(new Event('closeAllMenus'));
  }, []);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);

        // Fetch tournament metadata
        const { data: infoData } = await supabase
          .from('tournament_details')
          .select('*')
          .eq('tournament_id', tournamentId)
          .single();

        if (infoData) {
          setTournamentInfo(infoData);
        }

        // Fetch podium players
        const { data: podiumData } = await supabase
          .from('tournament_podium')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('position', { ascending: true });

        if (podiumData) {
          setPodiumPlayers(podiumData);
        }
      } catch (error) {
        console.warn('Error fetching tournament details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="card-base p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
        </div>
      </div>
    );
  }

  if (!tournamentInfo) {
    return null;
  }

  const positionEmoji = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  } as const;

  const positionColors = {
    1: 'text-yellow-400',
    2: 'text-slate-300',
    3: 'text-orange-400',
  } as const;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="card-base max-w-2xl w-full max-h-[70vh] overflow-y-auto px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {tournamentInfo.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Edição {tournamentInfo.edition}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-6 pb-6">
          {/* Tournament Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tipo</p>
              <p className="text-sm font-semibold text-foreground capitalize">{tournamentInfo.tournament_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <span className={tournamentInfo.finished ? 'badge-finished' : 'badge-active'}>
                {tournamentInfo.finished ? 'Finalizado' : 'Em andamento'}
              </span>
            </div>
          </div>

          {/* MVP - Simples */}
          {tournamentInfo.mvp_nick && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">MVP</p>
              <div className="flex items-center gap-3">
                <PlayerAvatar name={tournamentInfo.mvp_nick} avatarUrl={tournamentInfo.mvp_avatar_url} size="md" />
                <p className="text-sm font-heading font-semibold text-neon-yellow">{tournamentInfo.mvp_nick}</p>
              </div>
            </div>
          )}

          {/* Pódio */}
          {podiumPlayers.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-semibold">Pódio</p>
              <div className="space-y-3">
                {podiumPlayers.map((player) => (
                  <div
                    key={player.player_id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-3xl ${positionColors[player.position as 1 | 2 | 3]}`}>
                        {positionEmoji[player.position as 1 | 2 | 3]}
                      </span>
                      <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="md" />
                      <div>
                        <p className="font-semibold text-foreground">{player.nick}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.position === 1
                            ? '1º lugar'
                            : player.position === 2
                              ? '2º lugar'
                              : '3º lugar'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{player.kills}</p>
                      <p className="text-xs text-muted-foreground">kills</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VOD */}
          {tournamentInfo.vod_url && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">VOD da Live:</p>
                <a
                  href={tournamentInfo.vod_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-neon-blue hover:text-neon-blue/80 transition-colors"
                >
                  <span className="text-sm font-semibold">Assistir</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Campeonatos() {
  const [tournaments, setTournaments] = useState<TournamentForDisplay[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tournaments_list')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching tournaments:', error);
          return;
        }

        if (data) {
          const formattedTournaments = data.map((tournament) => {
            const date = new Date(tournament.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            return {
              id: tournament.tournament_id,
              name: tournament.name,
              edition: tournament.edition,
              date: formattedDate,
              status: tournament.finished ? ('Finalizado' as const) : ('Em andamento' as const),
              type: tournament.tournament_type,
              winners: tournament.winners || [],
              mvp: {
                nick: tournament.mvp_nick,
                avatar_url: tournament.mvp_avatar_url,
              },
            };
          });

          setTournaments(formattedTournaments);
        }
      } catch (error) {
        console.warn('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-blue">
            Campeonatos
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Acompanhe todos os campeonatos, resultados e MVPs da Verzea League.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum campeonato disponível.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onClick={() => setSelectedTournamentId(tournament.id)}
              />
            ))}
          </div>
        )}

        {selectedTournamentId && (
          <TournamentDetailModal
            tournamentId={selectedTournamentId}
            onClose={() => setSelectedTournamentId(null)}
          />
        )}
      </div>
    </Layout>
  );
}
