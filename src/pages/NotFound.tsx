import { Link } from 'react-router-dom';
import logo from '@/assets/varzealogo.png';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <img src={logo} alt="Varzea League" className="h-24 w-auto mx-auto mb-8" />
        
        <h1 className="text-6xl font-heading font-bold text-neon-blue mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Página não encontrada
        </p>
        
        <Link to="/" className="btn-primary inline-block">
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
