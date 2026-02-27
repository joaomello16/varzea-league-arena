import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Trophy, X, Play, ExternalLink, Plus, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PlayerProfileModal } from '@/components/PlayerProfileModal';

// Tipos para as views do Supabase
interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

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
  season_id: string;
  season_name: string;
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
  season_id: string;
  season_name: string;
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
  season_id: string;
  season_name: string;
}

interface TournamentType {
  id: string;
  name: string;
}

interface PlayerOption {
  id: string;
  nick: string;
  avatar_url: string | null;
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
  onParticipantsAdded,
  onPlayerClick,
}: {
  tournamentId: string;
  onClose: () => void;
  onParticipantsAdded?: () => void;
  onPlayerClick: (player: { id: string; nick: string; avatar_url: string | null }) => void;
}) {
  const [tournamentInfo, setTournamentInfo] = useState<TournamentDetailRow | null>(null);
  const [podiumPlayers, setPodiumPlayers] = useState<TournamentPodiumPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fechar menus do header ao abrir modal
  useEffect(() => {
    window.dispatchEvent(new Event('closeAllMenus'));
  }, []);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      // Fetch tournament metadata from tournaments_list
      const { data: listData } = await supabase
        .from('tournaments_list')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      // Fetch vod_url from tournaments table
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('vod_url')
        .eq('id', tournamentId)
        .single();

      if (listData) {
        setTournamentInfo({
          ...listData,
          vod_url: tournamentData?.vod_url || null,
        });
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

  useEffect(() => {
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
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Temporada</p>
              <p className="text-sm font-semibold text-foreground">{tournamentInfo.season_name}</p>
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
              <button
                onClick={() => onPlayerClick({
                  id: tournamentInfo.mvp_player_id!,
                  nick: tournamentInfo.mvp_nick!,
                  avatar_url: tournamentInfo.mvp_avatar_url,
                })}
                className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <PlayerAvatar name={tournamentInfo.mvp_nick} avatarUrl={tournamentInfo.mvp_avatar_url} size="md" />
                <p className="text-sm font-heading font-semibold text-neon-yellow">{tournamentInfo.mvp_nick}</p>
              </button>
            </div>
          )}

          {/* Pódio */}
          {podiumPlayers.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-semibold">Pódio</p>
              <div className="space-y-3">
                {podiumPlayers.map((player) => (
                  <button
                    key={player.player_id}
                    onClick={() => onPlayerClick({
                      id: player.player_id,
                      nick: player.nick,
                      avatar_url: player.avatar_url,
                    })}
                    className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-3xl ${positionColors[player.position as 1 | 2 | 3]}`}>
                        {positionEmoji[player.position as 1 | 2 | 3]}
                      </span>
                      <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="md" />
                      <div className="text-left">
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
                  </button>
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

function CreateTournamentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = dados do torneio, 2 = participantes
  const [createdTournamentId, setCreatedTournamentId] = useState<string | null>(null);
  const [createdTournamentName, setCreatedTournamentName] = useState('');
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tournamentTypes, setTournamentTypes] = useState<TournamentType[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerOption[]>([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  
  // Form fields - Step 1
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('1');
  const [seasonId, setSeasonId] = useState('');
  const [tournamentTypeId, setTournamentTypeId] = useState('');
  const [mvpPlayerId, setMvpPlayerId] = useState('');
  const [vodUrl, setVodUrl] = useState('');
  const [finished, setFinished] = useState(false);
  
  // Form fields - Step 2 (Participantes)
  const [position1Players, setPosition1Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  const [position2Players, setPosition2Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  const [position3Players, setPosition3Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  const [position4Players, setPosition4Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  const [position5Players, setPosition5Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  
  const [position1Points, setPosition1Points] = useState(0);
  const [position2Points, setPosition2Points] = useState(0);
  const [position3Points, setPosition3Points] = useState(0);
  const [position4Points, setPosition4Points] = useState(0);
  const [position5Points, setPosition5Points] = useState(0);
  
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [searchTerm3, setSearchTerm3] = useState('');
  const [searchTerm4, setSearchTerm4] = useState('');
  const [searchTerm5, setSearchTerm5] = useState('');
  
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [showDropdown3, setShowDropdown3] = useState(false);
  const [showDropdown4, setShowDropdown4] = useState(false);
  const [showDropdown5, setShowDropdown5] = useState(false);

  // Fechar menus ao abrir modal
  useEffect(() => {
    window.dispatchEvent(new Event('closeAllMenus'));
  }, []);

  // Fetch seasons, tournament types, and players
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch seasons
        const { data: seasonsData } = await supabase
          .from('seasons')
          .select('*')
          .order('start_date', { ascending: false });
        if (seasonsData) setSeasons(seasonsData);

        // Fetch tournament types
        const { data: typesData } = await supabase
          .from('tournament_types')
          .select('id, name')
          .order('name');
        if (typesData) setTournamentTypes(typesData);

        // Fetch players
        const { data: playersData } = await supabase
          .from('players')
          .select('id, nick, avatar_url')
          .order('nick');
        if (playersData) {
          setPlayers(playersData);
          setFilteredPlayers(playersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter players based on search term
  useEffect(() => {
    if (playerSearchTerm.trim() === '') {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(player =>
        player.nick.toLowerCase().includes(playerSearchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [playerSearchTerm, players]);

  // Funções de gerenciamento de participantes
  const getFilteredPlayers = (searchTerm: string, excludeIds: string[]) => {
    if (!searchTerm) return [];
    return players
      .filter(p => 
        p.nick.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !excludeIds.includes(p.id)
      )
      .slice(0, 10);
  };

  const addPlayer = (position: number, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newEntry = { playerId, kills: 0 };
    
    if (position === 1) {
      setPosition1Players([...position1Players, newEntry]);
      setSearchTerm1('');
      setShowDropdown1(false);
    } else if (position === 2) {
      setPosition2Players([...position2Players, newEntry]);
      setSearchTerm2('');
      setShowDropdown2(false);
    } else if (position === 3) {
      setPosition3Players([...position3Players, newEntry]);
      setSearchTerm3('');
      setShowDropdown3(false);
    } else if (position === 4) {
      setPosition4Players([...position4Players, newEntry]);
      setSearchTerm4('');
      setShowDropdown4(false);
    } else if (position === 5) {
      setPosition5Players([...position5Players, newEntry]);
      setSearchTerm5('');
      setShowDropdown5(false);
    }
  };

  const removePlayer = (position: number, index: number) => {
    if (position === 1) {
      setPosition1Players(position1Players.filter((_, i) => i !== index));
    } else if (position === 2) {
      setPosition2Players(position2Players.filter((_, i) => i !== index));
    } else if (position === 3) {
      setPosition3Players(position3Players.filter((_, i) => i !== index));
    } else if (position === 4) {
      setPosition4Players(position4Players.filter((_, i) => i !== index));
    } else if (position === 5) {
      setPosition5Players(position5Players.filter((_, i) => i !== index));
    }
  };

  const updateKills = (position: number, index: number, kills: number) => {
    if (position === 1) {
      const updated = [...position1Players];
      updated[index].kills = kills;
      setPosition1Players(updated);
    } else if (position === 2) {
      const updated = [...position2Players];
      updated[index].kills = kills;
      setPosition2Players(updated);
    } else if (position === 3) {
      const updated = [...position3Players];
      updated[index].kills = kills;
      setPosition3Players(updated);
    } else if (position === 4) {
      const updated = [...position4Players];
      updated[index].kills = kills;
      setPosition4Players(updated);
    } else if (position === 5) {
      const updated = [...position5Players];
      updated[index].kills = kills;
      setPosition5Players(updated);
    }
  };

  // Step 1: Criar torneio
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !edition || !seasonId || !tournamentTypeId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name,
          edition: parseInt(edition),
          season_id: seasonId,
          tournament_type_id: tournamentTypeId,
          mvp_player_id: mvpPlayerId || null,
          vod_url: vodUrl || null,
          finished,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedTournamentId(data.id);
      setCreatedTournamentName(name);
      setStep(2);

      toast({
        title: 'Sucesso',
        description: 'Torneio criado! Agora adicione os participantes.',
      });
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar torneio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Adicionar participantes
  const handleAddParticipants = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allParticipants = [
      ...position1Players.map(p => ({ ...p, position: 1, position_points: position1Points })),
      ...position2Players.map(p => ({ ...p, position: 2, position_points: position2Points })),
      ...position3Players.map(p => ({ ...p, position: 3, position_points: position3Points })),
      ...position4Players.map(p => ({ ...p, position: 4, position_points: position4Points })),
      ...position5Players.map(p => ({ ...p, position: 5, position_points: position5Points })),
    ];

    if (allParticipants.length === 0) {
      // Permitir pular esta etapa
      toast({
        title: 'Concluído',
        description: 'Torneio criado sem participantes.',
      });
      onSuccess();
      onClose();
      return;
    }

    setLoading(true);
    try {
      const participantsToInsert = allParticipants.map(p => ({
        tournament_id: createdTournamentId,
        player_id: p.playerId,
        kills: p.kills,
        position: p.position,
        position_points: p.position_points,
        season_id: seasonId,
      }));

      const { error } = await supabase
        .from('tournament_participants')
        .insert(participantsToInsert);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Torneio e participantes adicionados com sucesso!',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding participants:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar participantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (step === 1) {
      handleCreateTournament(e);
    } else {
      handleAddParticipants(e);
    }
  };

  const renderPositionSection = (
    position: number,
    title: string,
    emoji: string,
    color: string,
    playersList: Array<{ playerId: string; kills: number }>,
    positionPoints: number,
    setPositionPoints: (val: number) => void,
    searchTerm: string,
    setSearchTerm: (val: string) => void,
    showDropdown: boolean,
    setShowDropdown: (val: boolean) => void
  ) => {
    const allSelectedIds = [
      ...position1Players.map(p => p.playerId),
      ...position2Players.map(p => p.playerId),
      ...position3Players.map(p => p.playerId),
      ...position4Players.map(p => p.playerId),
      ...position5Players.map(p => p.playerId),
    ];
    
    const filteredPlayers = getFilteredPlayers(searchTerm, allSelectedIds);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${color}`}>{emoji}</span>
            <h3 className="font-heading font-bold text-lg">{title}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor={`position-${position}-points`} className="text-sm font-medium whitespace-nowrap">
              Pontos de Posição:
            </Label>
            <Input
              id={`position-${position}-points`}
              type="number"
              min="0"
              value={positionPoints}
              onChange={(e) => setPositionPoints(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-24 h-9"
            />
          </div>
        </div>

        {/* Lista de jogadores adicionados */}
        {playersList.map((entry, index) => {
          const player = players.find(p => p.id === entry.playerId);
          if (!player) return null;

          return (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <span className={`text-xl ${color} w-8 text-center`}>{position}</span>
              <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="sm" />
              <span className="flex-1 text-sm font-semibold">{player.nick}</span>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={entry.kills}
                  onChange={(e) => updateKills(position, index, parseInt(e.target.value) || 0)}
                  placeholder="Kills"
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">kills</span>
              </div>

              <button
                type="button"
                onClick={() => removePlayer(position, index)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          );
        })}

        {/* Campo de busca para adicionar jogador */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar jogador para adicionar..."
              className="pl-10"
            />
          </div>

          {showDropdown && searchTerm && filteredPlayers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => addPlayer(position, player.id)}
                  className="w-full p-2 hover:bg-muted flex items-center gap-2 transition-colors text-left"
                >
                  <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="sm" />
                  <span className="text-sm">{player.nick}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedPlayer = players.find(p => p.id === mvpPlayerId);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="card-base max-w-4xl w-full max-h-[90vh] overflow-y-auto px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {step === 1 ? 'Criar Novo Torneio' : 'Adicionar Participantes'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 1 ? 'Passo 1 de 2: Dados do torneio' : `Passo 2 de 2: ${createdTournamentName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              {/* Step 1: Dados do Torneio */}
              {/* Nome */}
              <div>
                <Label htmlFor="name">Nome do Torneio *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Varzea League 5"
                  required
                />
              </div>

          {/* Edição */}
          <div>
            <Label htmlFor="edition">Edição *</Label>
            <Input
              id="edition"
              type="number"
              min="1"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              placeholder="1"
              required
            />
          </div>

          {/* Temporada */}
          <div>
            <Label htmlFor="season">Temporada *</Label>
            <Select value={seasonId} onValueChange={setSeasonId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} {season.active && '(Ativa)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Torneio */}
          <div>
            <Label htmlFor="type">Tipo de Torneio *</Label>
            <Select value={tournamentTypeId} onValueChange={setTournamentTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tournamentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MVP Player */}
          <div>
            <Label htmlFor="mvp">Jogador MVP (Opcional)</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="mvp-search"
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  placeholder="Buscar jogador por nick..."
                  className="pl-10"
                />
              </div>
              
              {selectedPlayer && (
                <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar name={selectedPlayer.nick} avatarUrl={selectedPlayer.avatar_url} size="sm" />
                    <span className="text-sm font-semibold">{selectedPlayer.nick}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMvpPlayerId('')}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
              )}

              {playerSearchTerm && !selectedPlayer && (
                <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.slice(0, 10).map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          setMvpPlayerId(player.id);
                          setPlayerSearchTerm('');
                        }}
                        className="w-full p-2 hover:bg-muted flex items-center gap-2 transition-colors text-left"
                      >
                        <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="sm" />
                        <span className="text-sm">{player.nick}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Nenhum jogador encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* VOD URL */}
          <div>
            <Label htmlFor="vod">URL da VOD (Opcional)</Label>
            <Input
              id="vod"
              type="url"
              value={vodUrl}
              onChange={(e) => setVodUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* Finalizado */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="finished"
              checked={finished}
              onChange={(e) => setFinished(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="finished" className="cursor-pointer">
              Torneio finalizado
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Próximo'}
            </Button>
          </div>
            </>
          ) : (
            <>
              {/* Step 2: Adicionar Participantes */}
              {/* Campeões - 1º Lugar */}
              {renderPositionSection(
                1,
                'Campeões',
                '🥇',
                'text-yellow-400',
                position1Players,
                position1Points,
                setPosition1Points,
                searchTerm1,
                setSearchTerm1,
                showDropdown1,
                setShowDropdown1
              )}

              <div className="border-t border-border pt-6" />

              {/* Vice Campeões - 2º Lugar */}
              {renderPositionSection(
                2,
                'Vice Campeões',
                '🥈',
                'text-slate-300',
                position2Players,
                position2Points,
                setPosition2Points,
                searchTerm2,
                setSearchTerm2,
                showDropdown2,
                setShowDropdown2
              )}

              <div className="border-t border-border pt-6" />

              {/* Terceiro Lugar */}
              {renderPositionSection(
                3,
                'Terceiro Lugar',
                '🥉',
                'text-orange-400',
                position3Players,
                position3Points,
                setPosition3Points,
                searchTerm3,
                setSearchTerm3,
                showDropdown3,
                setShowDropdown3
              )}

              <div className="border-t border-border pt-6" />

              {/* Quarto Lugar */}
              {renderPositionSection(
                4,
                'Quarto Lugar',
                '4️⃣',
                'text-blue-400',
                position4Players,
                position4Points,
                setPosition4Points,
                searchTerm4,
                setSearchTerm4,
                showDropdown4,
                setShowDropdown4
              )}

              <div className="border-t border-border pt-6" />

              {/* Quinto Lugar */}
              {renderPositionSection(
                5,
                'Quinto Lugar',
                '5️⃣',
                'text-green-400',
                position5Players,
                position5Points,
                setPosition5Points,
                searchTerm5,
                setSearchTerm5,
                showDropdown5,
                setShowDropdown5
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Finalizar'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function AddParticipantsModal({ 
  tournamentId, 
  tournamentName,
  seasonId,
  onClose, 
  onSuccess 
}: { 
  tournamentId: string;
  tournamentName: string;
  seasonId: string;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  
  // Participantes por posição
  const [position1Players, setPosition1Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  const [position2Players, setPosition2Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  const [position3Players, setPosition3Players] = useState<Array<{ playerId: string; kills: number }>>([]);
  
  // Busca de jogadores por posição
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [searchTerm3, setSearchTerm3] = useState('');
  
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [showDropdown3, setShowDropdown3] = useState(false);

  // Fechar menus ao abrir modal
  useEffect(() => {
    window.dispatchEvent(new Event('closeAllMenus'));
  }, []);

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data } = await supabase
          .from('players')
          .select('id, nick, avatar_url')
          .order('nick');
        if (data) setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
    fetchPlayers();
  }, []);

  const getFilteredPlayers = (searchTerm: string, excludeIds: string[]) => {
    if (!searchTerm) return [];
    return players
      .filter(p => 
        p.nick.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !excludeIds.includes(p.id)
      )
      .slice(0, 10);
  };

  const addPlayer = (position: number, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newEntry = { playerId, kills: 0 };
    
    if (position === 1) {
      setPosition1Players([...position1Players, newEntry]);
      setSearchTerm1('');
      setShowDropdown1(false);
    } else if (position === 2) {
      setPosition2Players([...position2Players, newEntry]);
      setSearchTerm2('');
      setShowDropdown2(false);
    } else if (position === 3) {
      setPosition3Players([...position3Players, newEntry]);
      setSearchTerm3('');
      setShowDropdown3(false);
    }
  };

  const removePlayer = (position: number, index: number) => {
    if (position === 1) {
      setPosition1Players(position1Players.filter((_, i) => i !== index));
    } else if (position === 2) {
      setPosition2Players(position2Players.filter((_, i) => i !== index));
    } else if (position === 3) {
      setPosition3Players(position3Players.filter((_, i) => i !== index));
    }
  };

  const updateKills = (position: number, index: number, kills: number) => {
    if (position === 1) {
      const updated = [...position1Players];
      updated[index].kills = kills;
      setPosition1Players(updated);
    } else if (position === 2) {
      const updated = [...position2Players];
      updated[index].kills = kills;
      setPosition2Players(updated);
    } else if (position === 3) {
      const updated = [...position3Players];
      updated[index].kills = kills;
      setPosition3Players(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allParticipants = [
      ...position1Players.map(p => ({ ...p, position: 1 })),
      ...position2Players.map(p => ({ ...p, position: 2 })),
      ...position3Players.map(p => ({ ...p, position: 3 })),
    ];

    if (allParticipants.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um participante',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const participantsToInsert = allParticipants.map(p => ({
        tournament_id: tournamentId,
        player_id: p.playerId,
        kills: p.kills,
        position: p.position,
        season_id: seasonId,
      }));

      const { error } = await supabase
        .from('tournament_participants')
        .insert(participantsToInsert);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Participantes adicionados com sucesso!',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding participants:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar participantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPositionSection = (
    position: number,
    title: string,
    emoji: string,
    color: string,
    playersList: Array<{ playerId: string; kills: number }>,
    searchTerm: string,
    setSearchTerm: (val: string) => void,
    showDropdown: boolean,
    setShowDropdown: (val: boolean) => void
  ) => {
    const allSelectedIds = [
      ...position1Players.map(p => p.playerId),
      ...position2Players.map(p => p.playerId),
      ...position3Players.map(p => p.playerId),
    ];
    
    const filteredPlayers = getFilteredPlayers(searchTerm, allSelectedIds);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${color}`}>{emoji}</span>
          <h3 className="font-heading font-bold text-lg">{title}</h3>
        </div>

        {/* Lista de jogadores adicionados */}
        {playersList.map((entry, index) => {
          const player = players.find(p => p.id === entry.playerId);
          if (!player) return null;

          return (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <span className={`text-xl ${color} w-8 text-center`}>{position}</span>
              <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="sm" />
              <span className="flex-1 text-sm font-semibold">{player.nick}</span>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={entry.kills}
                  onChange={(e) => updateKills(position, index, parseInt(e.target.value) || 0)}
                  placeholder="Kills"
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">kills</span>
              </div>

              <button
                type="button"
                onClick={() => removePlayer(position, index)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          );
        })}

        {/* Campo de busca para adicionar jogador */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar jogador para adicionar..."
              className="pl-10"
            />
          </div>

          {showDropdown && searchTerm && filteredPlayers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => addPlayer(position, player.id)}
                  className="w-full p-2 hover:bg-muted flex items-center gap-2 transition-colors text-left"
                >
                  <PlayerAvatar name={player.nick} avatarUrl={player.avatar_url} size="sm" />
                  <span className="text-sm">{player.nick}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="card-base max-w-4xl w-full max-h-[90vh] overflow-y-auto px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Adicionar Participantes
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tournamentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campeões - 1º Lugar */}
          {renderPositionSection(
            1,
            'Campeões',
            '🥇',
            'text-yellow-400',
            position1Players,
            searchTerm1,
            setSearchTerm1,
            showDropdown1,
            setShowDropdown1
          )}

          <div className="border-t border-border pt-6" />

          {/* Vice Campeões - 2º Lugar */}
          {renderPositionSection(
            2,
            'Vice Campeões',
            '🥈',
            'text-slate-300',
            position2Players,
            searchTerm2,
            setSearchTerm2,
            showDropdown2,
            setShowDropdown2
          )}

          <div className="border-t border-border pt-6" />

          {/* Terceiro Lugar */}
          {renderPositionSection(
            3,
            'Terceiro Lugar',
            '🥉',
            'text-orange-400',
            position3Players,
            searchTerm3,
            setSearchTerm3,
            showDropdown3,
            setShowDropdown3
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Participantes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Campeonatos() {
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentForDisplay[]>([]);
  const [allTournaments, setAllTournaments] = useState<TournamentForDisplay[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch seasons
        const { data: seasonsData, error: seasonsError } = await supabase
          .from('seasons')
          .select('*')
          .order('start_date', { ascending: false });

        if (seasonsError) {
          console.warn('Error fetching seasons:', seasonsError);
        } else if (seasonsData) {
          setSeasons(seasonsData);
        }

        await fetchTournaments();
      } catch (error) {
        console.warn('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchTournaments = async () => {
    try {
      // Fetch tournaments
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
            season_id: tournament.season_id,
            season_name: tournament.season_name,
          };
        });

        setAllTournaments(formattedTournaments);
        setTournaments(formattedTournaments);
      }
    } catch (error) {
      console.warn('Error fetching tournaments:', error);
    }
  };

  const handleTournamentCreated = () => {
    fetchTournaments();
  };

  // Handle player click - fetch full player data
  const handlePlayerClick = async (playerInfo: { id: string; nick: string; avatar_url: string | null }) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerInfo.id)
        .single();

      if (error) {
        console.error('Error fetching player data:', error);
        return;
      }

      if (data) {
        setSelectedPlayerForProfile(data);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
  };

  // Filter tournaments when season selection changes
  useEffect(() => {
    if (selectedSeasonId === 'all') {
      setTournaments(allTournaments);
    } else {
      const filtered = allTournaments.filter(t => t.season_id === selectedSeasonId);
      setTournaments(filtered);
    }
  }, [selectedSeasonId, allTournaments]);

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-blue">
              Campeonatos
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Acompanhe todos os campeonatos, resultados e MVPs da Verzea League.
            </p>
          </div>
          
          {isAdmin && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Novo Torneio
            </Button>
          )}
        </div>

        {/* Season Filter */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">
            Filtrar por Temporada:
          </label>
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma temporada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Temporadas</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} {season.active && '(Ativa)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            onPlayerClick={handlePlayerClick}
          />
        )}

        {showCreateModal && (
          <CreateTournamentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleTournamentCreated}
          />
        )}

        {selectedPlayerForProfile && (
          <PlayerProfileModal
            player={selectedPlayerForProfile as any}
            onClose={() => setSelectedPlayerForProfile(null)}
          />
        )}
      </div>
    </Layout>
  );
}
