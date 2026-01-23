import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, Player } from '@/lib/supabase';
import { Plus, User, Calendar, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PlayerProfileModal } from '@/components/PlayerProfileModal';
import { PlayerEditModal } from '@/components/PlayerEditModal';
import { useCanEditPlayer } from '@/hooks/use-can-edit-player';

function PlayerTableRow({
  player,
  formatDate,
  onSelectPlayer,
  onEditClick,
}: {
  player: Player;
  formatDate: (date: string) => string;
  onSelectPlayer: (player: Player) => void;
  onEditClick: (player: Player) => void;
}) {
  const canEdit = useCanEditPlayer(player);

  return (
    <tr 
      className="hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={() => onSelectPlayer(player)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                {player.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt={player.nick}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-muted-foreground" />
                )}
              </div>
              {player.cover_url && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                  <div className="w-3 h-2 bg-primary rounded-sm" />
                </div>
              )}
            </div>
            <span className="font-heading font-semibold text-foreground">
              {player.nick}
            </span>
          </div>
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(player);
              }}
              className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-primary"
              title="Editar perfil"
            >
              <Edit2 size={18} />
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={16} />
          <span className="text-sm">
            {formatDate(player.created_at)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            player.user_id
              ? 'bg-success/20 text-success'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {player.user_id ? 'Sim' : 'Não'}
        </span>
      </td>
    </tr>
  );
}

export default function AdminPlayers() {
  const { isAdmin } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nick, setNick] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchPlayers = async (page: number = 1) => {
    setLoading(true);
    const start = (page - 1) * itemsPerPage;
    
    const { data, error, count } = await supabase
      .from('players')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + itemsPerPage - 1);

    if (error) {
      setError(error.message);
    } else {
      // Se o player selecionado foi atualizado, atualizar o modal
      if (selectedPlayer) {
        const updatedPlayer = (data || []).find(p => p.id === selectedPlayer.id);
        if (updatedPlayer) {
          setSelectedPlayer(updatedPlayer);
        }
      }
      setPlayers(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers(1);
  }, []);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const { error } = await supabase.from('players').insert({
      nick: nick.trim(),
      user_id: null,
      avatar_url: null,
      cover_url: null,
      bio: null,
    });

    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMessage(`Player "${nick}" criado com sucesso!`);
      setNick('');
      setShowForm(false);
      fetchPlayers();
    }

    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    // Atualizar player na lista
    setPlayers(
      players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
    // Atualizar player selecionado se for o mesmo
    if (selectedPlayer?.id === updatedPlayer.id) {
      setSelectedPlayer(updatedPlayer);
    }
    setIsEditModalOpen(false);
    setSelectedPlayerForEdit(null);
  };

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-purple">
            Gerenciar Players
          </h1>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Novo Player</span>
            </button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="card-base p-4 border-success/50 bg-success/10 mb-6">
            <p className="text-success">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card-base p-4 border-destructive/50 bg-destructive/10 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && isAdmin && (
          <div className="card-base p-6 mb-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
              Criar Novo Player
            </h2>
            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div>
                <label
                  htmlFor="nick"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Nick do Player
                </label>
                <input
                  id="nick"
                  type="text"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  className="input-base max-w-md"
                  placeholder="NickDoPlayer"
                  required
                  minLength={3}
                />
              </div>

              {formError && (
                <p className="text-destructive text-sm">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Player'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNick('');
                    setFormError(null);
                  }}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Players List */}
        <div className="card-base overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando players...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center">
              <User size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum player cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Criado em
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Vinculado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {players.map((player) => (
                    <PlayerTableRow
                      key={player.id}
                      player={player}
                      formatDate={formatDate}
                      onSelectPlayer={setSelectedPlayer}
                      onEditClick={(p) => {
                        setSelectedPlayerForEdit(p);
                        setIsEditModalOpen(true);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && players.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {Math.ceil(totalCount / itemsPerPage)} 
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchPlayers(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => fetchPlayers(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Profile Modal */}
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onClaimSuccess={fetchPlayers}
        />

        {/* Player Edit Modal */}
        {isEditModalOpen && selectedPlayerForEdit && (
          <PlayerEditModal
            player={selectedPlayerForEdit}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPlayerForEdit(null);
            }}
            onSaveSuccess={handlePlayerUpdate}
          />
        )}
      </div>
    </Layout>
  );
}
