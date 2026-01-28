import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PlayerSelect } from '@/components/PlayerSelect';
import { PlayerRequestModal } from '@/components/PlayerRequestModal';
import logo from '@/assets/varzealogo.png';

export default function Register() {
  const { session, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nick, setNick] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerNick, setSelectedPlayerNick] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayerRequestOpen, setIsPlayerRequestOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  if (loading) {
    return null;
  }

  if (session) {
    return <Navigate to="/leaderboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (nick.length < 3) {
      setError('O nick deve ter pelo menos 3 caracteres');
      return;
    }

    if (!selectedPlayerId && !requestSent) {
      setError('Selecione um player ou envie uma solicitação');
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(email, password, nick, selectedPlayerId || undefined);
    
    if (error) {
      setError(error.message);
    }
    
    setIsSubmitting(false);
  };

  const handlePlayerSelect = (playerId: string, playerNick: string) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerNick(playerNick);
    setRequestSent(false);
  };

  const handlePlayerRequestSuccess = () => {
    setIsPlayerRequestOpen(false);
    setRequestSent(true);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Varzea League" className="h-32 w-auto" />
        </div>
        
        <div className="card-base p-8">
          <h1 className="text-2xl font-heading font-bold text-center mb-6 text-neon-blue">
            Criar Conta
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nick" className="block text-sm font-medium text-muted-foreground mb-2">
                Nome de Usuario
              </label>
              <input
                id="nick"
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="input-base"
                placeholder="Usuario para o site"
                required
                minLength={3}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-base"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-md border border-border">
              <PlayerSelect
                selectedPlayerId={selectedPlayerId}
                onSelect={handlePlayerSelect}
                onPlayerNotFound={() => setIsPlayerRequestOpen(true)}
              />

              {requestSent && (
                <div className="mt-3 p-2 bg-green-900/20 border border-green-900/30 rounded text-sm text-green-600 flex items-center gap-2">
                  ✓ Solicitação enviada com sucesso
                </div>
              )}
            </div>
            
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>
          
          <p className="text-center text-muted-foreground mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <PlayerRequestModal
        isOpen={isPlayerRequestOpen}
        onClose={() => setIsPlayerRequestOpen(false)}
        onSuccess={handlePlayerRequestSuccess}
      />
    </div>
  );
}

