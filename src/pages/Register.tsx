import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PlayerSelect } from '@/components/PlayerSelect';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, User, Users } from 'lucide-react';
import logo from '@/assets/varzealogo.png';

export default function Register() {
  const { session, signUp, user, loading, registerUserWithPlayer } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nick, setNick] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerNick, setSelectedPlayerNick] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState<'player' | 'visitor' | null>(null);
  const [step, setStep] = useState<'type' | 'account' | 'player_link'>('type');
  const [accountCreated, setAccountCreated] = useState(false);


  if (loading) {
    return null;
  }

  // Se já tem sessão, usuário carregado, tipo visitor OU tipo player com player_id, redireciona
  if (session && user && (user.type === 'visitor' || user.player_id)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se já tem conta criada mas é player e falta o player_id, fica no step player_link
  const showPlayerLinkStep = (session || accountCreated) && userType === 'player' && (!user || !user.player_id);

  const handleSubmitAccount = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    const { error: signUpError } = await signUp(email, password, nick);
    
    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
    } else {
      setAccountCreated(true);
      if (userType === 'player') {
        setStep('player_link');
      }
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingPlayer = async (playerId: string) => {
    if (!session?.user?.id) return;
    setIsSubmitting(true);
    setError(null);

    const { error: rpcError } = await registerUserWithPlayer(session.user.id, playerId);
    
    if (rpcError) {
      setError(rpcError.message);
    } else {
      navigate('/dashboard');
    }
    setIsSubmitting(false);
  };

  const handleCreateNewPlayer = async (gameNick: string) => {
    if (!session?.user?.id) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Criar o player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert([{ nick: gameNick, user_id: session.user.id }])
        .select()
        .single();

      if (playerError) throw playerError;

      // 2. Vincular ao user
      const { error: userError } = await supabase
        .from('users')
        .update({ player_id: playerData.id })
        .eq('id', session.user.id);

      if (userError) throw userError;

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar perfil de jogador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserTypeSelect = (type: 'player' | 'visitor') => {
    setUserType(type);
    setStep('account');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Varzea League" className="h-32 w-auto" />
        </div>
        
        <div className="card-base p-8">
          {step === 'type' && (
            <>
              <h1 className="text-2xl font-heading font-bold text-center mb-6 text-neon-blue">
                Criar Conta
              </h1>
              
              <p className="text-center text-muted-foreground mb-6">
                Escolha como deseja se registrar:
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleUserTypeSelect('player')}
                  className="w-full p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all bg-card hover:bg-muted/50 flex flex-col items-center gap-3 group"
                >
                  <Users size={48} className="text-neon-blue group-hover:text-primary transition-colors" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Sou jogador de Bullet Echo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Participe de torneios e acumule pontos
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleUserTypeSelect('visitor')}
                  className="w-full p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all bg-card hover:bg-muted/50 flex flex-col items-center gap-3 group"
                >
                  <User size={48} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Sou visitante
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Acompanhe as notícias e os rankings
                    </p>
                  </div>
                </button>
              </div>

            </>
          )}

          {step === 'account' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-heading font-bold text-neon-blue">
                  {userType === 'player' ? '1. Dados da Conta' : 'Criar Conta - Visitante'}
                </h1>
                <button
                  onClick={() => {
                    setStep('type');
                    setUserType(null);
                    setError(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar
                </button>
              </div>
          
              <form onSubmit={handleSubmitAccount} className="space-y-4">
                <div>
                  <label htmlFor="nick" className="block text-sm font-medium text-muted-foreground mb-2">
                    Nome de Usuário
                  </label>
                  <input
                    id="nick"
                    type="text"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    className="input-base"
                    placeholder="Usuário para o site"
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
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-base pr-10"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-base pr-10"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
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
                      Processando...
                    </>
                  ) : (
                    userType === 'player' ? 'Próximo Passo' : 'Criar Conta'
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'player_link' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-heading font-bold text-neon-blue mb-2">
                  2. Perfil de Jogador
                </h1>
                <p className="text-sm text-muted-foreground">
                  Vincule sua conta ao seu nick do Bullet Echo ou crie um novo perfil.
                </p>
              </div>

              <div className="space-y-6">
                <PlayerSelect
                  selectedPlayerId={selectedPlayerId}
                  onSelect={(id, n) => {
                    setSelectedPlayerId(id);
                    setSelectedPlayerNick(n);
                  }}
                  onPlayerNotFound={() => {}} // Agora handled internamente no PlayerSelect
                />

                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}

                <div className="flex flex-col gap-3">
                  {selectedPlayerId ? (
                    <button
                      onClick={() => handleLinkExistingPlayer(selectedPlayerId)}
                      disabled={isSubmitting}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Vinculando...' : 'Sim, este sou eu (Vincular)'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCreateNewPlayer(selectedPlayerNick || nick)}
                      disabled={isSubmitting || (selectedPlayerNick && selectedPlayerNick.length < 3)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Criando...' : `Criar perfil como "${selectedPlayerNick || nick}"`}
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="btn-ghost text-xs"
                  >
                    Vincular depois
                  </button>
                </div>
              </div>
            </>
          )}
          {step !== 'player_link' && (
            <p className="text-center text-muted-foreground mt-6">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

