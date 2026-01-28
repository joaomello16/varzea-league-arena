import { useState } from 'react';
import { useAvailablePlayers } from '@/hooks/use-available-players';

interface PlayerSelectProps {
  selectedPlayerId: string | null;
  onSelect: (playerId: string | null, nick: string) => void;
  onPlayerNotFound: () => void;
}

export function PlayerSelect({ selectedPlayerId, onSelect, onPlayerNotFound }: PlayerSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { players, loading, error } = useAvailablePlayers(searchTerm);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const handleSelect = (playerId: string, nick: string) => {
    onSelect(playerId, nick);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      <label htmlFor="player-select" className="block text-sm font-medium text-muted-foreground">
        Selecione seu nick 
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-base w-full text-left flex items-center justify-between"
          id="player-select"
        >
          <span className={selectedPlayer ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedPlayer?.nick || 'Escolher player...'}
          </span>
          <span className="text-muted-foreground">▼</span>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
            <input
              type="text"
              placeholder="Buscar por nick..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base m-2 w-[calc(100%-1rem)]"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto border-t border-border">
              {loading && (
                <div className="p-4 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {error && (
                <div className="p-4 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              {!loading && players.length === 0 && (
                <div className="p-4 text-muted-foreground text-sm text-center">
                  Nenhum player encontrado
                </div>
              )}

              {players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelect(player.id, player.nick)}
                  className={`w-full text-left px-4 py-2 hover:bg-accent transition-colors ${
                    selectedPlayerId === player.id ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  {player.nick}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div className="text-sm text-green-600 flex items-center gap-1">
          ✓ {selectedPlayer.nick} selecionado
        </div>
      )}

      <div className="pt-2 space-y-2">
        <p className="text-sm text-muted-foreground">
          Não encontrei meu player ou sou jogador novo
        </p>
        <button
          type="button"
          onClick={() => {
            onSelect(null, '');
            onPlayerNotFound();
          }}
          className="w-full p-2 text-sm text-primary border border-border rounded-md  transition-colors"
        >
          Não encontrei meu player
        </button>
      </div>
    </div>
  );
}
