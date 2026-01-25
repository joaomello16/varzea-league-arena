import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, PlayerClaimPending } from '@/lib/supabase';
import { usePlayerRequestNotifications } from '@/hooks/use-player-request-notifications';
import { Check, X, User, Calendar, Trash2 } from 'lucide-react';

export default function Requests() {
  const [requests, setRequests] = useState<PlayerClaimPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  
  // Player request notifications
  const { notifications, loading: notificationsLoading, deleteNotification } = usePlayerRequestNotifications();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('v_player_claims_pending')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setRequests(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (claimId: string) => {
    setApproveId(claimId);

    try {
      const { error } = await supabase
        .from('player_claims')
        .update({ status: 'approved' })
        .eq('id', claimId);

      if (error) {
        setError(error.message);
      } else {
        await fetchRequests();
      }
    } catch (err) {
      setError('Erro ao aprovar solicitação');
    } finally {
      setApproveId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    setRejectId(claimId);

    try {
      const { error } = await supabase
        .from('player_claims')
        .update({ status: 'rejected' })
        .eq('id', claimId);

      if (error) {
        setError(error.message);
      } else {
        await fetchRequests();
      }
    } catch (err) {
      setError('Erro ao rejeitar solicitação');
    } finally {
      setRejectId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasContent = requests.length > 0 || notifications.length > 0;


  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-purple mb-8">
          Solicitações Pendentes
        </h1>

        {/* Error Message */}
        {error && (
          <div className="card-base p-4 border-destructive/50 bg-destructive/10 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {loading || notificationsLoading ? (
            <div className="card-base p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando solicitações...</p>
            </div>
          ) : !hasContent ? (
            <div className="card-base p-8 text-center">
              <Check size={48} className="mx-auto text-success mb-4" />
              <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <>
              {/* Player Claim Requests */}
              {requests.length > 0 && (
                <>
                  <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
                    Solicitações de Reivindicação de Player
                  </h2>
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="card-base p-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                        {/* Player Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {request.player_avatar_url ? (
                              <img
                                src={request.player_avatar_url}
                                alt={request.player_nick}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={24} className="text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="mb-3">
                              <p className="text-sm text-muted-foreground">Jogador solicitado:</p>
                              <p className="text-lg font-heading font-semibold text-foreground">
                                {request.player_nick}
                              </p>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm text-muted-foreground">Solicitado por:</p>
                              <p className="font-heading font-semibold text-foreground">
                                {request.user_nick}
                              </p>
                              <p className="text-sm text-muted-foreground">{request.user_email}</p>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Calendar size={16} />
                              <span>{formatDate(request.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 w-full md:w-auto md:flex-col lg:flex-row">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={approveId === request.id || rejectId === request.id}
                            className="flex-1 md:flex-none lg:flex-1 btn-primary flex items-center justify-center gap-2 bg-success/90 hover:bg-success disabled:opacity-50"
                          >
                            {approveId === request.id ? (
                              <>
                                <span className="w-4 h-4 border-2 border-success-foreground border-t-transparent rounded-full animate-spin" />
                                Aprovando...
                              </>
                            ) : (
                              <>
                                <Check size={18} />
                                <span className="hidden sm:inline">Aprovar</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={approveId === request.id || rejectId === request.id}
                            className="flex-1 md:flex-none lg:flex-1 btn-primary flex items-center justify-center gap-2 bg-destructive/90 hover:bg-destructive disabled:opacity-50"
                          >
                            {rejectId === request.id ? (
                              <>
                                <span className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                                Rejeitando...
                              </>
                            ) : (
                              <>
                                <X size={18} />
                                <span className="hidden sm:inline">Reprovar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Player Request Notifications */}
              {notifications.length > 0 && (
                <>
                  <h2 className="text-xl font-heading font-semibold text-foreground mb-4 mt-8">
                    Solicitações de Novo Player
                  </h2>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="card-base p-6 hover:bg-muted/30 transition-colors border-l-4 border-l-neon-blue"
                    >
                      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                        {/* Request Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                            <User size={24} className="text-neon-blue" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground mb-1">{notification.title}</p>
                            <p className="text-foreground font-medium break-words">
                              {notification.message}
                            </p>

                            <div className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
                              <Calendar size={16} />
                              <span>{formatDate(notification.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete Action */}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex-shrink-0 p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                          title="Remover solicitação"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
