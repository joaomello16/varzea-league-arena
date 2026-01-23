import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/lib/supabase';

/**
 * Hook para verificar se o usuário logado pode editar um player.
 * Retorna true se:
 * - O usuário é admin, OR
 * - O usuário está vinculado ao player (user.player_id === player.id)
 * 
 * A segurança real é aplicada no backend via RLS.
 * Este hook é apenas para UX (mostrar/esconder botões).
 */
export function useCanEditPlayer(player: Player | null): boolean {
  const { user, isAdmin } = useAuth();

  return useMemo(() => {
    if (!player || !user) return false;

    // Admin pode editar qualquer player
    if (isAdmin) return true;

    // Usuário não-admin pode editar apenas o player vinculado a ele
    return user.player_id === player.id;
  }, [player, user, isAdmin]);
}
