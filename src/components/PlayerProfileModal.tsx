import { useState, useEffect } from 'react';
import { Player } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, User as UserIcon, Star, History } from 'lucide-react';

// Tipos para títulos
interface PlayerTitle {
  player_id: string;
  tournament_id: string;
  tournament_name: string;
  edition: string;
  season_id: string;
  season_name: string;
  position: 1 | 2 | 3;
  title_label: string;
}

// Tipos para histórico de torneios
interface TournamentHistory {
  id: string;
  player_id: string;
  tournament_id: string;
  kills: number;
  position: number;
  position_points: number;
  created_at: string;
  tournament_name: string;
  edition: number;
  finished: boolean;
  season_id: string;
  season_name: string;
}

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
  const [titles, setTitles] = useState<PlayerTitle[]>([]);
  const [seasonStats, setSeasonStats] = useState<{
    rating: number;
    total_kills: number;
    total_position_points: number;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch titles quando o player mudar
  useEffect(() => {
    async function fetchTitles() {
      if (!player) {
        setTitles([]);
        return;
      }

      try {
        const { data: titlesData, error: titlesError } = await supabase
          .from('player_titles')
          .select('*')
          .eq('player_id', player.id)
          .order('season_name', { ascending: false });

        if (titlesError) {
          console.warn('Erro ao buscar títulos:', titlesError);
          setTitles([]);
        } else {
          setTitles((titlesData as PlayerTitle[]) || []);
        }
      } catch (err) {
        console.warn('Erro ao buscar títulos:', err);
        setTitles([]);
      }
    }

    fetchTitles();
  }, [player?.id]);

  // Fetch season stats
  useEffect(() => {
    async function fetchSeasonStats() {
      if (!player) {
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
          .eq('player_id', player.id)
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
  }, [player?.id]);

  // Fetch tournament history quando showHistory mudar
  useEffect(() => {
    async function fetchHistory() {
      if (!player || !showHistory) {
        return;
      }

      setHistoryLoading(true);
      try {
        const { data: historyData } = await supabase
          .from('player_tournament_history')
          .select('*')
          .eq('player_id', player.id)
          .order('created_at', { ascending: false });

        if (historyData) {
          setTournamentHistory(historyData as TournamentHistory[]);
        }
      } catch (err) {
        console.warn('Erro ao buscar histórico:', err);
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchHistory();
  }, [player?.id, showHistory]);

  // Verificar se é meu próprio player
  const isMyPlayer = player && user && user.player_id === player.id;

  // Agrupar histórico por temporada
  const historyBySeason = tournamentHistory.reduce((acc, tournament) => {
    const seasonName = tournament.season_name;
    if (!acc[seasonName]) {
      acc[seasonName] = [];
    }
    acc[seasonName].push(tournament);
    return acc;
  }, {} as Record<string, TournamentHistory[]>);

  // Verificar se o botão "Este player sou eu" deve aparecer
  const shouldShowClaimButton =
    player &&
    player.user_id === null &&
    user &&
    user.player_id === null &&
    !claimed;

  const handleClaimPlayer = async () => {
    if (!user || !player) return;

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

  return player ? (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-md relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Content with Scroll */}
        <div className="overflow-y-auto">{/* Cover */}
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
                {seasonStats?.rating ?? player.rating ?? 0} pts
              </span>
            </div>

            {/* Season Stats */}
            <div className="grid grid-cols-3 gap-4 w-full mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-blue">
                  {seasonStats?.rating ?? 0}
                </div>
                <div className="text-xs text-gray-400">Rating</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {seasonStats?.total_kills ?? 0}
                </div>
                <div className="text-xs text-gray-400">Kills</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {seasonStats?.total_position_points ?? 0}
                </div>
                <div className="text-xs text-gray-400">Pontos Pos.</div>
              </div>
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
              {titles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  -
                </p>
              ) : (
                <div className="space-y-2">
                  {titles.map((title, i) => {
                    const colorClasses = {
                      1: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
                      2: 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/40',
                      3: 'bg-slate-400/20 text-slate-300 border border-slate-400/30',
                    };

                    return (
                      <div
                        key={i}
                        className={`rounded px-3 py-2 text-sm ${colorClasses[title.position]}`}
                      >
                        {title.tournament_name} – {title.title_label}
                      </div>
                    );
                  })}
                </div>
              )}
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



            {/* Botão Histórico */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
            >
              <History size={18} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Histórico de Participações'}
            </button>

            {/* Histórico de Participações */}
            {showHistory && (
              <div className="w-full mb-6">
                <div className="card-base p-4 bg-muted/30 border border-border">
                  {historyLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                    </div>
                  ) : tournamentHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma participação em campeonatos registrada.
                    </p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto pr-2">
                      {Object.entries(historyBySeason).map(([seasonName, tournaments]) => (
                        <div key={seasonName} className="mb-6 last:mb-0">
                          <h4 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
                            {seasonName}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                    Torneio
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                                    Kills
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                                    Posição
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {tournaments.map((tournament) => (
                                  <tr key={tournament.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-3 py-2 text-left">
                                      <span className="text-foreground font-medium">
                                        {tournament.tournament_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        Ed. {tournament.edition}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className="text-green-400 font-semibold">
                                        {tournament.kills}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`font-semibold ${
                                        tournament.position === 1 ? 'text-yellow-400' :
                                        tournament.position === 2 ? 'text-cyan-400' :
                                        tournament.position === 3 ? 'text-slate-400' :
                                        'text-muted-foreground'
                                      }`}>
                                        {tournament.position}º
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
  ) : null;
}
