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

        let query = supabase
          .from('players')
          .select('id, nick')
          .is('user_id', null)
          .order('nick');

        if (searchTerm.trim()) {
          query = query.ilike('nick', `%${searchTerm}%`);
        }

        const { data, error: err } = await query;

        if (err) throw err;

        setPlayers(data || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar players');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return { players, loading, error };
}
