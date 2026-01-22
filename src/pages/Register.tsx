import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/varzealogo.png';

export default function Register() {
  const { session, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nick, setNick] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    const { error } = await signUp(email, password, nick);
    
    if (error) {
      setError(error.message);
    }
    
    setIsSubmitting(false);
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
                Nick
              </label>
              <input
                id="nick"
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="input-base"
                placeholder="SeuNickGamer"
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
    </div>
  );
}
