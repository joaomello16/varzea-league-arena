import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AvailablePlayer {
  id: string;
  nick: string;
}

export function useAvailablePlayers(searchTerm: string = '') {
  const [players, setPlayers] = useState<AvailablePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar todos os players sem vínculo (são poucos, podemos filtrar localmente para ser mais rápido)
        const { data, error: err } = await supabase
          .from('players')
          .select('id, nick')
          .is('user_id', null)
          .order('nick');

        if (err) throw err;

        setPlayers(data || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter(player => 
    player.nick.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return { players: filteredPlayers, loading, error };
}
