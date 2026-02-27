import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, Player } from '@/lib/supabase';
import { Trophy, Star, User, Edit2 } from 'lucide-react';
import { GiLaurelCrown, GiCrownedSkull, GiImperialCrown } from 'react-icons/gi';
import { IoTrophySharp } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useCanEditPlayer } from '@/hooks/use-can-edit-player';
import { PlayerEditModal } from '@/components/PlayerEditModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import bannerAlter from '../assets/banner-alter.JPG';

// Tipos para season
interface Season {
  id: string;
  name: string;
  active: boolean;
  start_date: string;
  end_date: string | null;
}

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

// Tipos para tags
interface PlayerTag {
  tag_name: string;
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

  // Verifica se o nick contém números
  const hasNumbers = /\d/.test(player.nick);

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
    <div className="card-base overflow-hidden bg-gradient-to-br from-blue-900/35 via-black via-30% to-black shadow-[0_8px_32px_rgba(0,0,0,0.6)] border-slate-700/40">
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
          {rank === 1 && <Trophy size={24} className="text-accent" />}
          <span className="text-muted-foreground font-heading">#{rank}</span>
        </div>

        {/* Nick */}
        <h2 className="text-2xl font-bold text-neon-blue mb-2" style={hasNumbers ? {} : { fontFamily: 'Anaphora', fontVariantLigatures: 'none', fontFeatureSettings: 'normal' }}>
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
  tags = [],
}: {
  player: Player;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  activeTab: 'rating' | 'kills' | 'position';
  tags?: PlayerTag[];
}) {
  const isTop3 = rank <= 3;
  
  // Verifica se o nick contém números
  const hasNumbers = /\d/.test(player.nick);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all bg-gradient-to-l from-blue-950/25 via-black via-25% to-black border ${rank === 1
          ? 'border-yellow-500/40'
          : isSelected
          ? 'border-slate-600/60'
          : 'border-slate-700/40 hover:border-slate-600/50'
        }`}
    >
      {/* Rank with Diamond Shape */}
      <div className="relative flex items-center justify-center w-14 h-14">
        {/* Diamond/Losango Background */}
        <div
          className={`absolute w-9 h-9 rotate-45 ${rank === 1
              ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 border-2 border-yellow-500/40 shadow-[0_4px_12px_rgba(234,179,8,0.4)]'
              : rank === 2
                ? 'bg-gradient-to-br from-cyan-400/25 to-cyan-500/15 border-2 border-cyan-400/30 shadow-[0_4px_12px_rgba(34,211,238,0.3)]'
                : rank === 3
                  ? 'bg-gradient-to-br from-slate-400/25 to-slate-500/15 border-2 border-slate-400/30 shadow-[0_4px_12px_rgba(148,163,184,0.3)]'
                  : 'bg-gradient-to-br from-slate-700/30 to-slate-800/20 border-2 border-slate-600/30 shadow-[0_4px_10px_rgba(0,0,0,0.5)]'
            } shadow-lg`}
        ></div>
        {/* Icon or Number */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Rating Icons */}
          {activeTab === 'rating' && rank === 1 && <GiImperialCrown size={24} className="text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)]" />}
          {activeTab === 'rating' && rank === 2 && <GiImperialCrown size={22} className="text-cyan-200 drop-shadow-[0_2px_8px_rgba(165,243,252,0.8)]" />}
          {activeTab === 'rating' && rank === 3 && <GiImperialCrown size={22} className="text-slate-300 drop-shadow-[0_2px_8px_rgba(203,213,225,0.8)]" />}
          
          {/* Kills Icons */}
          {activeTab === 'kills' && rank === 1 && <GiCrownedSkull size={24} className="text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)]" />}
          {activeTab === 'kills' && rank === 2 && <GiCrownedSkull size={22} className="text-cyan-200 drop-shadow-[0_2px_8px_rgba(165,243,252,0.8)]" />}
          {activeTab === 'kills' && rank === 3 && <GiCrownedSkull size={22} className="text-slate-300 drop-shadow-[0_2px_8px_rgba(203,213,225,0.8)]" />}
          
          {/* Position Icons */}
          {activeTab === 'position' && rank === 1 && <GiLaurelCrown size={24} className="text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)]" />}
          {activeTab === 'position' && rank === 2 && <GiLaurelCrown size={22} className="text-cyan-200 drop-shadow-[0_2px_8px_rgba(165,243,252,0.8)]" />}
          {activeTab === 'position' && rank === 3 && <GiLaurelCrown size={22} className="text-slate-300 drop-shadow-[0_2px_8px_rgba(203,213,225,0.8)]" />}
          
          {rank > 3 && <span className="font-heading font-bold text-muted-foreground">{rank}</span>}
        </div>
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
          style={hasNumbers ? {} : { fontFamily: 'Anaphora', fontVariantLigatures: 'none', fontFeatureSettings: 'normal' }}
        >
          {player.nick}
        </p>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full text-xs font-semibold text-cyan-300"
              >
                {tag.tag_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Value - Dynamic based on active tab */}
      <div className="text-right">
        <p className={`font-semibold text-primary ${rank === 1 ? '[text-shadow:0_2px_8px_rgba(234,179,8,0.6)]' : ''}`}>
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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlayerTitles, setSelectedPlayerTitles] = useState<PlayerTitle[]>([]);
  const [activeTab, setActiveTab] = useState<'rating' | 'kills' | 'position'>('rating');
  const [seasonInfo, setSeasonInfo] = useState<{ name: string; endDate: string | null; active: boolean } | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [playerTags, setPlayerTags] = useState<Map<string, PlayerTag[]>>(new Map());
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleTabChange = (tab: 'rating' | 'kills' | 'position') => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setPage(1);
  };

  // Calcular dias restantes da temporada
  const daysRemaining = seasonInfo?.endDate 
    ? Math.ceil((new Date(seasonInfo.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Buscar todas as temporadas ao carregar
  useEffect(() => {
    async function fetchSeasons() {
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, name, active, start_date, end_date')
        .order('start_date', { ascending: false });

      if (seasonsError) {
        console.warn('Erro ao buscar temporadas:', seasonsError);
        return;
      }

      if (seasonsData) {
        setSeasons(seasonsData);
        // Definir a temporada ativa como padrão
        const activeSeason = seasonsData.find((s) => s.active);
        if (activeSeason) {
          setSelectedSeasonId(activeSeason.id);
        } else if (seasonsData.length > 0) {
          // Se não houver temporada ativa, usar a primeira
          setSelectedSeasonId(seasonsData[0].id);
        }
      }
    }

    fetchSeasons();
  }, []);

  // Fechar menu mobile quando abrir o modal
  useEffect(() => {
    if (isMobileModalOpen) {
      // Dispatch evento customizado para fechar o menu mobile
      window.dispatchEvent(new CustomEvent('closeAllMenus'));
    }
  }, [isMobileModalOpen]);

  useEffect(() => {
    async function fetchPlayers() {
      // Aguardar selectedSeasonId ser definido
      if (!selectedSeasonId) {
        return;
      }

      try {
        // 1. Buscar informações da temporada selecionada
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('id, name, end_date, active')
          .eq('id', selectedSeasonId)
          .single();

        if (seasonError) {
          console.warn('Erro ao buscar temporada:', seasonError);
          setError('Erro ao buscar temporada');
          setLoading(false);
          return;
        }

        const seasonId = seasonData?.id;
        
        // Guardar informações da temporada
        if (seasonData) {
          setSeasonInfo({
            name: seasonData.name,
            endDate: seasonData.end_date,
            active: seasonData.active,
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

        // 6. Buscar tags dos jogadores
        if (leaderboardPlayerIds.length > 0) {
          const { data: tagsData } = await supabase
            .from('player_profile_tags')
            .select(`
              player_id,
              tags!inner(name)
            `)
            .in('player_id', leaderboardPlayerIds);

          if (tagsData) {
            const tagsMap = new Map<string, PlayerTag[]>();
            tagsData.forEach((item) => {
              const playerId = item.player_id;
              if (!tagsMap.has(playerId)) {
                tagsMap.set(playerId, []);
              }
              tagsMap.get(playerId)!.push({
                tag_name: (item.tags as any).name
              });
            });
            setPlayerTags(tagsMap);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, [page, activeTab, selectedSeasonId]);

  // Fetch titles quando selectedPlayer ou selectedSeasonId mudar
  useEffect(() => {
    async function fetchTitles() {
      if (!selectedPlayer || !selectedSeasonId) {
        setSelectedPlayerTitles([]);
        return;
      }

      try {
        const { data: titlesData, error: titlesError } = await supabase
          .from('player_titles')
          .select('*')
          .eq('player_id', selectedPlayer.id)
          .eq('season_id', selectedSeasonId)
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
  }, [selectedPlayer?.id, selectedSeasonId]);

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
      <div className="bg-black to-98% min-h-screen">
        {/* Banner com Imagem */}
        <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
          {/* Imagem de Fundo */}
          <img
            src={bannerAlter}
            alt="Banner Placar de Líderes"
            className="absolute inset-0 w-full h-full object-cover object-[75%_center] md:object-center"
          />
          
          {/* Overlay escuro para melhor legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          
          {/* Conteúdo do Banner */}
          <div className="relative h-full flex flex-col justify-between p-6 md:p-12">
            {/* Título - Posicionado na área da fumaça azul, à esquerda */}
            <div className="mt-8 md:mt-16">
              <h1 className="text-3xl md:text-6xl lg:text-7xl font-heading font-bold text-neon-blue drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-4">
                Placar De Líderes
              </h1>
            </div>
            
            {/* Texto descritivo - Abaixo da fumaça, à esquerda */}
            <div className="mb-8 md:mb-8">
              <p className="text-sm md:text-xl text-muted-foreground max-w-[70%] md:max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-snug md:leading-relaxed">
                Acompanhe os 20 melhores jogadores da temporada e veja quem domina a Varzea League.
              </p>
            </div>
          </div>
        </div>

        {/* Container com padding para o conteúdo abaixo do banner */}
        <div className="container-main py-8">
          {/* Season Info - Abaixo do Banner */}
          {seasonInfo && (
            <div className="card-base p-4 mb-8 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 border border-cyan-500/30 shadow-[0_4px_16px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-cyan-400">
                    {seasonInfo.name}
                  </h3>
                  {seasonInfo.active && (
                    <span className="text-sm text-muted-foreground">em andamento</span>
                  )}
                </div>
                {seasonInfo.active && daysRemaining !== null && daysRemaining > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tempo restante:</span>
                    <span className="font-heading font-bold text-lg text-cyan-400">
                      {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                )}
                {!seasonInfo.active && (
                  <div className="px-3 py-1.5 bg-muted/30 border border-muted rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Temporada Encerrada
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filtro de Temporadas */}
          {seasons.length > 1 && (
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">
                Filtrar por Temporada:
              </label>
              <Select value={selectedSeasonId || ''} onValueChange={handleSeasonChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecione uma temporada" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name} {season.active && '(Atual)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    tags={playerTags.get(player.id) || []}
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

        {/* Botão de Informações */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Trophy size={18} />
            + Informações sobre o Leaderboard
          </button>
        </div>

        {/* Modal de Informações */}
        {isInfoModalOpen && (
          <div 
            className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center px-4 overflow-y-auto py-8"
            onClick={() => setIsInfoModalOpen(false)}
          >
            <div 
              className="relative w-full max-w-3xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="absolute -top-4 -right-4 bg-background rounded-full p-2 shadow-lg z-10 hover:bg-muted transition-colors"
              >
                ✕
              </button>

              {/* Modal Content */}
              <div className="card-base p-8 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Trophy size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-neon-blue">
                    Como funciona o Leaderboard?
                  </h2>
                </div>

                {/* Introdução */}
                <div className="mb-8">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    O leaderboard consolida todas as estatísticas dos campeonatos de uma determinada temporada, reunindo os dados em um ranking geral dos <span className="text-foreground font-semibold">20 melhores jogadores da temporada</span>.
                  </p>
                  
                  <div className="card-base p-4 bg-muted/30 border border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Ao final de cada temporada:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>O ranking é resetado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>Uma nova temporada é iniciada do zero</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      🔎 Rankings de temporadas anteriores continuam disponíveis e podem ser consultados através do filtro de temporadas.
                    </p>
                  </div>
                </div>

                {/* Como é calculado o Rating */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Como é calculado o Rating?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    O rating é calculado pela <span className="text-foreground font-semibold">soma total</span> de:
                  </p>
                  <div className="card-base p-4 bg-primary/10 border border-primary/30 mb-4">
                    <p className="text-center font-bold text-lg text-foreground">
                      Pontos por posição + kills individuais
                    </p>
                    <p className="text-center text-sm text-muted-foreground mt-1">
                      em todos os campeonatos que o jogador disputou durante a temporada.
                    </p>
                  </div>

                  {/* Multiplicadores */}
                  <div className="space-y-3">
                    <p className="font-semibold text-foreground text-sm mb-2">
                      Multiplicadores por tipo de campeonato:
                    </p>
                    <div className="grid gap-3">
                      <div className="card-base p-4 bg-gradient-to-r from-blue-950/30 to-transparent border-l-4 border-blue-500">
                        <p className="font-bold text-foreground mb-1">
                          Edição Varzea League
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pontos por posição com multiplicador <span className="text-cyan-400 font-bold">1x</span>
                        </p>
                      </div>
                      <div className="card-base p-4 bg-gradient-to-r from-cyan-950/30 to-transparent border-l-4 border-cyan-500">
                        <p className="font-bold text-foreground mb-1">
                          Campeonato Varzea League
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pontos por posição com multiplicador <span className="text-cyan-400 font-bold">1,5x</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* De onde vêm os pontos por posição */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    De onde vêm os pontos por posição?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Os pontos por posição são calculados a partir de:
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold mt-0.5">•</span>
                      <span className="text-muted-foreground">Pontuação total do time na sala</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold mt-0.5">•</span>
                      <span className="text-muted-foreground">Bônus de colocação, aplicado apenas aos três primeiros colocados</span>
                    </li>
                  </ul>

                  {/* Bônus de colocação */}
                  <div className="card-base p-4 bg-muted/30 border border-border mb-4">
                    <p className="font-semibold text-foreground text-sm mb-3">
                      Bônus de colocação:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥇</span>
                        <span className="text-sm text-muted-foreground">
                          1º lugar: <span className="text-yellow-400 font-bold">+25 pontos</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥈</span>
                        <span className="text-sm text-muted-foreground">
                          2º lugar: <span className="text-cyan-400 font-bold">+10 pontos</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥉</span>
                        <span className="text-sm text-muted-foreground">
                          3º lugar: <span className="text-slate-400 font-bold">+5 pontos</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      Do 4º lugar em diante, não há bônus de colocação — o time recebe apenas a pontuação obtida na sala.
                    </p>
                  </div>
                </div>

                {/* Exemplo prático */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Exemplo prático
                  </h3>
                  <div className="space-y-3">
                    <div className="card-base p-4 bg-gradient-to-r from-yellow-950/20 to-transparent border-l-4 border-yellow-500">
                      <p className="font-bold text-foreground mb-2">
                        Um time fez 60 pontos na sala e terminou em 1º lugar:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground mb-2">
                        <li>Pontos da sala: <span className="text-foreground font-semibold">60</span></li>
                        <li>Bônus de colocação: <span className="text-yellow-400 font-semibold">+25</span></li>
                      </ul>
                      <p className="text-sm font-bold text-foreground pt-2 border-t border-border/50">
                        Total: <span className="text-yellow-400">85 pontos</span>
                      </p>
                    </div>

                    <div className="card-base p-4 bg-gradient-to-r from-slate-950/20 to-transparent border-l-4 border-slate-500">
                      <p className="font-bold text-foreground mb-2">
                        Um time que ficou em 4º ou 5º lugar:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Recebe somente os pontos da sala, sem bônus adicional.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </Layout>
  );
}
