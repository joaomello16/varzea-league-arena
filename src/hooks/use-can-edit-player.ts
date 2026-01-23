import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/lib/supabase';

/**
 * Hook para verificar se o usuário logado pode editar um player.
 * Retorna true se:
 * - O usuário é admin, OR
 * - O usuário está vinculado ao player (user.id === player.user_id)
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

    // Usuário não-admin pode editar apenas seu próprio player
    return user.id === player.user_id;
  }, [player, user, isAdmin]);
}
