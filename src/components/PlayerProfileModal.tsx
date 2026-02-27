import { useState, useEffect } from 'react';
import { Player } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, User as UserIcon, Star, History } from 'lucide-react';
import { GiLaurelCrown, GiCrownedSkull, GiImperialCrown } from 'react-icons/gi';

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

// Tipos para tags
interface Tag {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
  placement?: number | null;
}

interface ProfileTag {
  tag_id: string;
  tag_name: string;
  category?: string | null;
  placement?: number | null;
}

interface PlayerProfileModalProps {
  player: Player | null;
  onClose: () => void;
  onClaimSuccess?: () => void;
}

export function PlayerProfileModal({ player, onClose, onClaimSuccess }: PlayerProfileModalProps) {
  const { user, isAdmin } = useAuth();
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
  
  // Estados para tags
  const [earnedTags, setEarnedTags] = useState<Tag[]>([]);
  const [profileTags, setProfileTags] = useState<string[]>([]); // IDs das tags exibidas
  const [displayTags, setDisplayTags] = useState<ProfileTag[]>([]); // Tags para exibir no perfil público
  const [showTagsEdit, setShowTagsEdit] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tempProfileTags, setTempProfileTags] = useState<string[]>([]); // Seleção temporária no modal
  const [isSavingTags, setIsSavingTags] = useState(false);
  
  const canEditTags = user && (player?.user_id === user.id || isAdmin);

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

  // Fetch overall stats (todas as temporadas)
  useEffect(() => {
    async function fetchOverallStats() {
      if (!player) {
        setSeasonStats(null);
        return;
      }

      try {
        // Buscar todas as estatísticas do player em todas as temporadas
        const { data: statsData } = await supabase
          .from('leaderboard_by_season')
          .select('rating, total_kills, total_position_points')
          .eq('player_id', player.id);

        if (statsData && statsData.length > 0) {
          // Somar estatísticas de todas as temporadas
          const totalStats = statsData.reduce(
            (acc, curr) => ({
              rating: acc.rating + (curr.rating || 0),
              total_kills: acc.total_kills + (curr.total_kills || 0),
              total_position_points: acc.total_position_points + (curr.total_position_points || 0),
            }),
            { rating: 0, total_kills: 0, total_position_points: 0 }
          );
          setSeasonStats(totalStats);
        } else {
          setSeasonStats(null);
        }
      } catch (err) {
        console.warn('Erro ao buscar estatísticas:', err);
        setSeasonStats(null);
      }
    }

    fetchOverallStats();
  }, [player?.id]);

  // Fetch tags do perfil (sempre)
  useEffect(() => {
    async function fetchProfileTags() {
      if (!player) {
        setDisplayTags([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('player_profile_tags')
          .select(`
            tag_id,
            tags!inner(name, category, placement)
          `)
          .eq('player_id', player.id);

        if (error) throw error;

        const tags = (data || []).map(item => ({
          tag_id: item.tag_id,
          tag_name: (item.tags as any).name,
          category: (item.tags as any).category,
          placement: (item.tags as any).placement
        }));
        
        setDisplayTags(tags);
      } catch (err) {
        console.warn('Erro ao buscar tags do perfil:', err);
        setDisplayTags([]);
      }
    }

    fetchProfileTags();
  }, [player?.id]);

  // Fetch tags conquistadas (apenas se pode editar)
  useEffect(() => {
    async function fetchEarnedTags() {
      if (!player || !canEditTags || !showTagsEdit) {
        return;
      }

      try {
        setTagsLoading(true);
        
        // Buscar tags conquistadas
        const { data: earnedData, error: earnedError } = await supabase
          .from('player_tags')
          .select(`
            tag_id,
            tags!inner(id, name, description, category, placement)
          `)
          .eq('player_id', player.id);

        if (earnedError) throw earnedError;

        const tags = (earnedData || []).map(item => ({
          id: (item.tags as any).id,
          name: (item.tags as any).name,
          description: (item.tags as any).description,
          category: (item.tags as any).category,
          placement: (item.tags as any).placement
        }));
        
        setEarnedTags(tags);

        // Buscar tags atualmente exibidas
        const { data: profileData, error: profileError } = await supabase
          .from('player_profile_tags')
          .select('tag_id')
          .eq('player_id', player.id);

        if (profileError) throw profileError;

        setProfileTags((profileData || []).map(item => item.tag_id));
      } catch (err) {
        console.warn('Erro ao buscar tags:', err);
      } finally {
        setTagsLoading(false);
      }
    }

    fetchEarnedTags();
  }, [player?.id, canEditTags, showTagsEdit]);

  // Inicializar seleção temporária quando o modal abrir
  useEffect(() => {
    if (showTagsEdit) {
      setTempProfileTags(profileTags);
    }
  }, [showTagsEdit, profileTags]);

  // Função para alternar seleção temporária de tag
  const toggleTempTag = (tagId: string) => {
    if (tempProfileTags.includes(tagId)) {
      setTempProfileTags([]);
    } else {
      setTempProfileTags([tagId]); // Substituir por apenas 1 tag
    }
  };

  // Função para salvar as tags selecionadas
  const handleSaveTags = async () => {
    if (!player) return;

    setIsSavingTags(true);
    try {
      // Determinar quais tags adicionar e remover
      const tagsToAdd = tempProfileTags.filter(id => !profileTags.includes(id));
      const tagsToRemove = profileTags.filter(id => !tempProfileTags.includes(id));

      // Remover tags desmarcadas
      if (tagsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('player_profile_tags')
          .delete()
          .eq('player_id', player.id)
          .in('tag_id', tagsToRemove);

        if (removeError) throw removeError;
      }

      // Adicionar novas tags
      if (tagsToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('player_profile_tags')
          .insert(tagsToAdd.map(tagId => ({ player_id: player.id, tag_id: tagId })));

        if (addError) throw addError;
      }

      // Atualizar estados locais
      setProfileTags(tempProfileTags);
      
      // Atualizar displayTags
      const newDisplayTags: ProfileTag[] = [];
      for (const tagId of tempProfileTags) {
        const tag = earnedTags.find(t => t.id === tagId);
        if (tag) {
          newDisplayTags.push({
            tag_id: tagId,
            tag_name: tag.name,
            category: tag.category,
            placement: tag.placement
          });
        }
      }
      
      setDisplayTags(newDisplayTags);

      // Fechar modal
      setShowTagsEdit(false);
    } catch (err: any) {
      console.error('Erro ao salvar tags:', err);
      alert(err.message || 'Erro ao salvar tags');
    } finally {
      setIsSavingTags(false);
    }
  };

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4" onClick={onClose}>
      <div className="card-base w-full max-w-md relative overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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

            {/* Tags do Perfil */}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {displayTags.map((tag) => {
                  // Define ícone baseado na categoria
                  let TagIcon = null;
                  if (tag.category === 'kills') {
                    TagIcon = GiCrownedSkull;
                  } else if (tag.category === 'position points') {
                    TagIcon = GiLaurelCrown;
                  } else if (tag.category === 'rating') {
                    TagIcon = GiImperialCrown;
                  }

                  // Define cor baseada no placement
                  let colorClasses = 'text-cyan-300';
                  if (tag.placement === 1) {
                    colorClasses = 'text-yellow-300/90';
                  } else if (tag.placement === 2) {
                    colorClasses = 'text-cyan-200/80';
                  } else if (tag.placement === 3) {
                    colorClasses = 'text-slate-300';
                  }

                  return (
                    <span
                      key={tag.tag_id}
                      className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${colorClasses}`}
                    >
                      {TagIcon && <TagIcon size={18} />}
                      {tag.tag_name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-accent" />
              <span className="font-heading font-semibold text-foreground">
                {seasonStats?.rating ?? player.rating ?? 0}
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

            {/* Main Titles */}
            <div className="w-full mb-6">
              <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Títulos Principais
              </h3>
              {(() => {
                // Filtrar títulos: prioridade para campeões, depois vice
                const champions = titles.filter((t) => t.position === 1);
                const runners = titles.filter((t) => t.position === 2);
                const mainTitles = champions.length > 0 ? champions : runners.length > 0 ? runners : [];

                if (mainTitles.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      -
                    </p>
                  );
                }

                return (
                  <div className="space-y-2">
                    {mainTitles.map((title, i) => {
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
                );
              })()}
            </div>

            {/* Botão Histórico */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
            >
              <History size={18} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Histórico de Participações'}
            </button>

            {/* Botão Gerenciar Tags */}
            {canEditTags && (
              <button
                onClick={() => setShowTagsEdit(true)}
                className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
              >
                <Star size={18} />
                Gerenciar Tags
              </button>
            )}

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

        {/* Modal de Edição de Tags */}
        {showTagsEdit && canEditTags && (
          <div
            className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-20"
            onClick={() => {
              setShowTagsEdit(false);
              setTempProfileTags(profileTags); // Restaurar seleção original ao fechar
            }}
          >
            <div
              className="card-base w-full max-w-md max-h-[80vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-bold text-neon-blue">
                  Gerenciar Tags
                </h3>
                <button
                  onClick={() => {
                    setShowTagsEdit(false);
                    setTempProfileTags(profileTags); // Restaurar seleção original ao fechar
                  }}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Selecione 1 tag para exibir no seu perfil:
              </p>

              {/* Max tags warning */}
              {tempProfileTags.length >= 1 && (
                <div className="card-base p-3 bg-yellow-500/10 border-yellow-500/30 mb-4">
                  <p className="text-xs text-yellow-400">
                    ⚠️ Máximo de 1 tag atingido. Remova a tag para adicionar outra.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {tagsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando tags...</p>
                  </div>
                ) : earnedTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Você ainda não conquistou nenhuma tag.
                  </p>
                ) : (
                  earnedTags.map((tag) => {
                    const isSelected = tempProfileTags.includes(tag.id);
                    
                    // Define ícone baseado na categoria
                    let TagIcon = null;
                    if (tag.category === 'kills') {
                      TagIcon = GiCrownedSkull;
                    } else if (tag.category === 'position points') {
                      TagIcon = GiLaurelCrown;
                    } else if (tag.category === 'rating') {
                      TagIcon = GiImperialCrown;
                    }

                    // Define cor baseada no placement
                    let colorClasses = 'text-cyan-300 border-cyan-400/50';
                    if (tag.placement === 1) {
                      colorClasses = 'text-yellow-300/90 border-yellow-400/50';
                    } else if (tag.placement === 2) {
                      colorClasses = 'text-cyan-200/80 border-cyan-400/50';
                    } else if (tag.placement === 3) {
                      colorClasses = 'text-slate-300 border-slate-400/50';
                    }

                    return (
                      <div
                        key={tag.id}
                        className={`card-base p-3 cursor-pointer transition-all ${
                          isSelected
                            ? `bg-opacity-20 ${colorClasses.split(' ')[1]}`
                            : 'hover:border-muted'
                        }`}
                        onClick={() => toggleTempTag(tag.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            {TagIcon && (
                              <span className={colorClasses.split(' ')[0]}>
                                <TagIcon size={20} />
                              </span>
                            )}
                            <div className="flex-1">
                              <p className={`font-semibold mb-1 ${colorClasses.split(' ')[0]}`}>
                                {tag.name}
                              </p>
                              {tag.description && (
                                <p className="text-xs text-muted-foreground">
                                  {tag.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled by parent div click
                              className="w-5 h-5 rounded border-border"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveTags}
                disabled={isSavingTags}
                className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingTags ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;
}
