import { Layout } from '@/components/Layout';
import { Trophy, Users, Calendar } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  date: string;
  status: 'Em andamento' | 'Finalizado';
  winner: string | null;
  participants: number;
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Varzea League Season 5',
    date: 'Janeiro 2026',
    status: 'Em andamento',
    winner: null,
    participants: 16,
  },
  {
    id: '2',
    name: 'Varzea League Season 2',
    date: 'Outubro 2025',
    status: 'Finalizado',
    winner: 'Anarchy',
    participants: 12,
  },
  {
    id: '3',
    name: 'Varzea League Season 1',
    date: 'Julho 2025',
    status: 'Finalizado',
    winner: 'WAR',
    participants: 8,
  },
  {
    id: '4',
    name: 'Varzea League Season 3',
    date: 'Maio 2025',
    status: 'Finalizado',
    winner: 'Midnight',
    participants: 15,
  },
  {
    id: '5',
    name: 'Varzea League Season 4',
    date: 'Março 2025',
    status: 'Finalizado',
    winner: 'Aura',
    participants: 15,
  },
  {
    id: '6',
    name: 'Camp Varzea League',
    date: 'Fevereiro 2026',
    status: 'Finalizado',
    winner: 'Bullet School',
    participants: 15,
  },
];

function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <div className="card-interactive p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-heading font-bold text-foreground">
          {tournament.name}
        </h3>
        <span
          className={
            tournament.status === 'Em andamento' ? 'badge-active' : 'badge-finished'
          }
        >
          {tournament.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={16} />
          <span className="text-sm">{tournament.date}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Users size={16} />
          <span className="text-sm">{tournament.participants} participantes</span>
        </div>

        {tournament.winner && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <Trophy size={18} className="text-accent" />
            <span className="text-sm text-muted-foreground">Vencedor:</span>
            <span className="font-heading font-semibold text-neon-yellow">
              {tournament.winner}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Campeonatos() {
  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-blue mb-8">
          Campeonatos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
