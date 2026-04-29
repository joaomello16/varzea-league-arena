import { useState, useEffect, useRef } from 'react';
import { useAvailablePlayers } from '@/hooks/use-available-players';
import { Search, Check, AlertCircle, Users } from 'lucide-react';

interface PlayerSelectProps {
  selectedPlayerId: string | null;
  onSelect: (playerId: string | null, nick: string) => void;
}

export function PlayerSelect({ selectedPlayerId, onSelect }: PlayerSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { players, loading } = useAvailablePlayers(inputValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincronizar input quando o player for selecionado ou removido
  useEffect(() => {
    if (!selectedPlayerId && inputValue === '') return;
    
    if (selectedPlayerId) {
      // O hook já filtra localmente, então o nick estará disponível se o player existir
    }
  }, [selectedPlayerId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);
    
    onSelect(null, value);
  };

  const handleSelect = (playerId: string, nick: string) => {
    setInputValue(nick);
    onSelect(playerId, nick);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3 relative" ref={dropdownRef}>
      <label htmlFor="player-search" className="block text-sm font-medium text-foreground">
        Seu Nick no jogo:
      </label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Search size={18} />
        </div>
        <input
          id="player-search"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Busque seu nick da Varzea League..."
          className="input-base pl-10 w-full bg-background/50 border-primary/20 focus:border-primary/50 transition-all"
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown de Sugestões */}
      {isOpen && (inputValue.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {players.length > 0 ? (
            <div className="p-1">
              <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Players Disponíveis
              </p>
              {players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelect(player.id, player.nick)}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary/10 rounded-md transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {player.nick.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-foreground group-hover:text-primary transition-colors">{player.nick}</span>
                  </div>
                  {selectedPlayerId === player.id && (
                    <Check size={18} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="p-6 text-center">
                <Users size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum player encontrado com o nick <span className="text-foreground font-semibold">"{inputValue}"</span>.
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Você poderá criar um novo perfil com este nick abaixo.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {selectedPlayerId && (inputValue.length > 0) && (
        <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded-md text-success text-xs font-medium animate-in slide-in-from-left-2">
          <Check size={14} /> Nick da Varzea League vinculado!
        </div>
      )}
      
      {!selectedPlayerId && inputValue.length >= 3 && !isOpen && (
        <div className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-md text-amber-500 text-[11px] leading-tight">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>Você está usando um nick novo. Se você já tem histórico na liga, busque seu nick acima.</span>
        </div>
      )}
    </div>
  );
}
