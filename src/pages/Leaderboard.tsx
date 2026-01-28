import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, Player } from '@/lib/supabase';
import { Trophy, Star, User, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCanEditPlayer } from '@/hooks/use-can-edit-player';
import { PlayerEditModal } from '@/components/PlayerEditModal';

// Tipos para leaderboard
interface LeaderboardEntry {
  season_id: string;
  player_id: string;
  rating: number;
  total_kills: number;
  total_position_points: number;
}

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

function PlayerCard({
  player,
  rank,
  titles = [],
  onEditClick,
  activeTab,
}: {
  player: Player;
  rank: number;
  titles?: PlayerTitle[];
  onEditClick?: () => void;
  activeTab: 'rating' | 'kills' | 'position';
}) {
  const canEdit = useCanEditPlayer(player);

  // Define qual valor e label mostrar baseado na aba ativa
  const displayValue = activeTab === 'rating' 
    ? (player.rating ?? 1000)
    : activeTab === 'kills'
    ? (player.total_kills ?? 0)
    : (player.total_position_points ?? 0);
  
  const displayLabel = activeTab === 'rating' 
    ? 'Rating'
    : activeTab === 'kills'
    ? 'Kills'
    : 'Pontos de Posição';

  return (
    <div className="card-base overflow-hidden">
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
            <User size={48} className="text-muted-foreground" />
          )}
        </div>

        {player.cover_url && <div className="mb-2" />}

        {/* Rank Badge */}
        <div className="flex items-center gap-2 mb-2">
          {rank === 1 && <Trophy size={20} className="text-accent" />}
          <span className="text-muted-foreground font-heading">#{rank}</span>
        </div>

        {/* Nick */}
        <h2 className="text-2xl font-bold text-neon-blue mb-2">
          {player.nick}
        </h2>

        {/* Rating/Kills/Pontos - Dynamic */}
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-accent" />
          <span className="font-semibold text-foreground">
            {displayValue} {displayLabel}
          </span>
        </div>

        {/* Bio */}
        <p className="text-muted-foreground text-sm mb-6">
          {player.bio || '—'}
        </p>

        {/* Titles */}
        <div className="w-full mb-6">
          <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Títulos Da temporada
          </h3>
          {titles.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              -
            </p>
          ) : (
            <div className="space-y-2">
              {titles.map((title, i) => {
                const colorClasses = {
  // 💎 Campeão — Diamante
  1: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',

  // 🟦 Vice — Platina
  2: 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/40',

  // 🟨 Terceiro — Ouro
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

        {/* Edit Button */}
        {canEdit && (
          <button
            onClick={onEditClick}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Edit2 size={16} />
            Editar Perfil
          </button>
        )}
      </div>
    </div>
  );
}

function RankingRow({
  player,
  rank,
  isSelected,
  onClick,
  activeTab,
}: {
  player: Player;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  activeTab: 'rating' | 'kills' | 'position';
}) {
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${isSelected
          ? 'card-highlight animate-pulse-glow'
          : 'card-interactive hover:border-primary/30'
        } ${rank === 1 ? 'border-accent/50' : ''}`}
    >
      {/* Rank */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold ${rank === 1
            ? 'bg-accent text-accent-foreground'
            : rank === 2
              ? 'bg-muted-foreground/30 text-foreground'
              : rank === 3
                ? 'bg-orange-700/30 text-orange-400'
                : 'bg-muted text-muted-foreground'
          }`}
      >
        {isTop3 ? <Trophy size={18} /> : rank}
      </div>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.nick}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User size={24} className="text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <p
          className={`font-semibold ${rank === 1 ? 'text-neon-yellow' : 'text-foreground'
            }`}
        >
          {player.nick}
        </p>
      </div>

      {/* Value - Dynamic based on active tab */}
      <div className="text-right">
        <p className="font-semibold text-primary">
          {activeTab === 'rating' 
            ? (player.rating ?? 1000)
            : activeTab === 'kills'
            ? (player.total_kills ?? 0)
            : (player.total_position_points ?? 0)
          }
        </p>
        <p className="text-xs text-muted-foreground">
          {activeTab === 'rating' ? 'Rating' : activeTab === 'kills' ? 'Kills' : 'Pontos'}
        </p>
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 card-base">
      <div className="w-10 h-10 skeleton rounded-full" />
      <div className="w-12 h-12 skeleton rounded-full" />
      <div className="flex-1">
        <div className="h-5 w-32 skeleton rounded" />
      </div>
      <div className="text-right">
        <div className="h-5 w-16 skeleton rounded" />
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlayerTitles, setSelectedPlayerTitles] = useState<PlayerTitle[]>([]);
  const [activeTab, setActiveTab] = useState<'rating' | 'kills' | 'position'>('rating');
  const [seasonInfo, setSeasonInfo] = useState<{ name: string; endDate: string | null } | null>(null);
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleTabChange = (tab: 'rating' | 'kills' | 'position') => {
    setActiveTab(tab);
    setPage(1);
  };

  // Calcular dias restantes da temporada
  const daysRemaining = seasonInfo?.endDate 
    ? Math.ceil((new Date(seasonInfo.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Fechar menu mobile quando abrir o modal
  useEffect(() => {
    if (isMobileModalOpen) {
      // Dispatch evento customizado para fechar o menu mobile
      window.dispatchEvent(new CustomEvent('closeAllMenus'));
    }
  }, [isMobileModalOpen]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        // 1. Buscar temporada ativa
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('id, name, end_date')
          .eq('active', true)
          .limit(1)
          .single();

        if (seasonError) {
          console.warn('Erro ao buscar temporada ativa:', seasonError);
          setError('Erro ao buscar temporada ativa');
          setLoading(false);
          return;
        }

        const seasonId = seasonData?.id;
        
        // Guardar informações da temporada
        if (seasonData) {
          setSeasonInfo({
            name: seasonData.name,
            endDate: seasonData.end_date,
          });
        }

        // 2. Buscar leaderboard da temporada ativa com paginação (limitado aos 20 melhores)
        const leaderboardMap = new Map<string, LeaderboardEntry>();
        let leaderboardPlayerIds: string[] = [];
        if (seasonId) {
          // Define qual coluna ordenar baseado na aba ativa
          const orderColumn = activeTab === 'rating' ? 'rating' : activeTab === 'kills' ? 'total_kills' : 'total_position_points';
          
          const { data: leaderboardData, error: leaderboardError } = await supabase
            .from('leaderboard_by_season')
            .select('*')
            .eq('season_id', seasonId)
            .order(orderColumn, { ascending: false })
            .limit(20);

          if (leaderboardError) {
            console.warn('Erro ao buscar leaderboard:', leaderboardError);
          } else {
            // Define total como 20 no máximo
            const allEntries = leaderboardData || [];
            setTotalCount(Math.min(allEntries.length, 20));
            
            // Aplica paginação manualmente nos 20 resultados
            const paginatedEntries = allEntries.slice(from, to + 1);
            paginatedEntries.forEach((entry: LeaderboardEntry) => {
              leaderboardMap.set(entry.player_id, entry);
              leaderboardPlayerIds.push(entry.player_id);
            });
          }
        }

        // 3. Buscar apenas os players da página atual
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .in('id', leaderboardPlayerIds.length > 0 ? leaderboardPlayerIds : ['']);

        if (playersError) {
          setError(playersError.message);
          setLoading(false);
          return;
        }

        // 4. Merge: combinar dados de players com leaderboard
        const enrichedPlayers: Player[] = (playersData || [])
          .map((player) => {
            const leaderboardEntry = leaderboardMap.get(player.id);
            return {
              ...player,
              rating: leaderboardEntry?.rating ?? 0,
              total_kills: leaderboardEntry?.total_kills ?? 0,
              total_position_points: leaderboardEntry?.total_position_points ?? 0,
            };
          })
          // 5. Manter ordem do leaderboard
          .sort((a, b) => {
            const indexA = leaderboardPlayerIds.indexOf(a.id);
            const indexB = leaderboardPlayerIds.indexOf(b.id);
            return indexA - indexB;
          });

        setPlayers(enrichedPlayers);
        if (enrichedPlayers.length > 0) {
          setSelectedPlayer(enrichedPlayers[0]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, [page, activeTab]);

  // Fetch titles quando selectedPlayer mudar
  useEffect(() => {
    async function fetchTitles() {
      if (!selectedPlayer) {
        setSelectedPlayerTitles([]);
        return;
      }

      try {
        const { data: titlesData, error: titlesError } = await supabase
          .from('player_titles')
          .select('*')
          .eq('player_id', selectedPlayer.id)
          .order('season_name', { ascending: false });

        if (titlesError) {
          console.warn('Erro ao buscar títulos:', titlesError);
          setSelectedPlayerTitles([]);
        } else {
          setSelectedPlayerTitles((titlesData as PlayerTitle[]) || []);
        }
      } catch (err) {
        console.warn('Erro ao buscar títulos:', err);
        setSelectedPlayerTitles([]);
      }
    }

    fetchTitles();
  }, [selectedPlayer?.id]);

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    setPlayers(
      players.map((p) =>
        p.id === updatedPlayer.id
          ? {
              ...p,               // mantém rating da view
              ...updatedPlayer,   // atualiza avatar, bio, nick, etc
              rating: p.rating,   // blinda explicitamente
            }
          : p
      )
    );

    setSelectedPlayer((prev) =>
      prev?.id === updatedPlayer.id
        ? {
            ...prev,
            ...updatedPlayer,
            rating: prev.rating,
          }
        : prev
    );

    setIsEditModalOpen(false);
  };

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-blue mb-2">
            Placar De Líderes
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Acompanhe os 20 melhores jogadores da temporada e veja quem domina a Varzea League
          </p>
        </div>

        {/* Season Info */}
        {seasonInfo && (
          <div className="card-base p-4 mb-8 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-neon-blue mb-1">
                  {seasonInfo.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Temporada atual em andamento
                </p>
              </div>
              {daysRemaining !== null && daysRemaining > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Tempo restante
                    </p>
                    <p className="font-heading font-bold text-2xl text-neon-blue">
                      {daysRemaining}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {daysRemaining === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                </div>
              )}
              {daysRemaining !== null && daysRemaining <= 0 && (
                <div className="px-4 py-2 bg-destructive/20 border border-destructive/30 rounded-lg">
                  <p className="text-sm font-semibold text-destructive">
                    Temporada Encerrada
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => handleTabChange('rating')}
            className={`px-6 py-3 font-heading font-bold text-lg transition-all ${
              activeTab === 'rating'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            RATING
          </button>
          <button
            onClick={() => handleTabChange('kills')}
            className={`px-6 py-3 font-heading font-bold text-lg transition-all ${
              activeTab === 'kills'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            KILLS
          </button>
          <button
            onClick={() => handleTabChange('position')}
            className={`px-6 py-3 font-heading font-bold text-lg transition-all ${
              activeTab === 'position'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            PONTOS DE POSIÇÃO
          </button>
        </div>

        {error && (
          <div className="card-base p-4 border-destructive/50 bg-destructive/10 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Player Card - Desktop Only */}
          <div className="hidden lg:block lg:w-[30%]">
            {loading ? (
              <div className="card-base p-6 h-96 skeleton-shimmer" />
            ) : selectedPlayer ? (
              <PlayerCard
                player={selectedPlayer}
                rank={players.findIndex((p) => p.id === selectedPlayer.id) + (page - 1) * pageSize + 1}                titles={selectedPlayerTitles}
                activeTab={activeTab}
                onEditClick={() => setIsEditModalOpen(true)}
              />
            ) : null}
          </div>

          {/* Ranking List */}
          <div className="flex-1">
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : players.length === 0 ? (
                <div className="card-base p-8 text-center">
                  <User size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum player cadastrado ainda
                  </p>
                </div>
              ) : (
                players.map((player, index) => (
                  <RankingRow
                    key={player.id}
                    player={player}
                    rank={(page - 1) * pageSize + index + 1}
                    isSelected={selectedPlayer?.id === player.id}
                    activeTab={activeTab}
                    onClick={() => {
                      setSelectedPlayer(player);
                      setIsMobileModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {!loading && players.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">← Anterior</span>
                  <span className="sm:hidden">←</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-heading font-semibold transition-all ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'card-interactive hover:border-primary/30'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Próxima →</span>
                  <span className="sm:hidden">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {user && user.player_id === null && (
  <div className="mt-10">
    <div className="card-base p-5 bg-muted/30 border border-border">
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        <span className="block font-heading font-semibold text-foreground mb-1">
          Quer editar seu perfil de jogador?
        </span>
        Para reivindicar um player, acesse a aba{' '}
        <span className="font-semibold text-foreground">Players</span>, solicite a
        vinculação ao perfil desejado e aguarde a aprovação de um administrador.
      </p>
    </div>
  </div>
)}

        {/* Mobile Player Modal */}
        {isMobileModalOpen && selectedPlayer && (
          <div 
            className="lg:hidden fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4"
            onClick={() => setIsMobileModalOpen(false)}
          >
            <div 
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setIsMobileModalOpen(false)}
                className="absolute -top-4 -right-4 bg-background rounded-full p-2 shadow-lg z-10"
              >
                ✕
              </button>

              <PlayerCard
                player={selectedPlayer}
                rank={players.findIndex((p) => p.id === selectedPlayer.id) + (page - 1) * pageSize + 1}
                titles={selectedPlayerTitles}
                activeTab={activeTab}
                onEditClick={() => {
                  setIsMobileModalOpen(false);
                  setIsEditModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedPlayer && (
          <PlayerEditModal
            player={selectedPlayer}
            onClose={() => setIsEditModalOpen(false)}
            onSaveSuccess={handlePlayerUpdate}
          />
        )}

        {/* Card de Explicação do Rating */}
        <div className="card-base p-6 mt-12 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Trophy size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold text-neon-blue mb-3">
                Como é Calculado o Rating?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O rating é calculado pela <span className="text-foreground font-semibold">soma dos pontos por posição + kills individuais</span> de todos os campeonatos que o player participou.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">•</span>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-semibold">Edição Varzea League:</span> Pontos por posição com multiplicador <span className="text-cyan-400 font-bold">1x</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold mt-0.5">•</span>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-semibold">Campeonato Varzea League:</span> Pontos por posição com multiplicador <span className="text-cyan-400 font-bold">1,5x</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
