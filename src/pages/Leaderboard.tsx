import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase, Player } from '@/lib/supabase';
import { Trophy, Star, User } from 'lucide-react';

// Mock titles for display
const mockTitles: Record<string, string[]> = {
  default: [
    'Varzea League S2 – Campeão',
    'Varzea League S1 – Vice-campeão',
  ],
};

function PlayerCard({ player, rank }: { player: Player; rank: number }) {
  return (
    <div className="card-base p-6 h-full">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 border-2 border-primary/30">
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.nick}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={48} className="text-muted-foreground" />
          )}
        </div>
        
        {/* Rank Badge */}
        <div className="flex items-center gap-2 mb-2">
          {rank === 1 && <Trophy size={20} className="text-accent" />}
          <span className="text-muted-foreground font-heading">#{rank}</span>
        </div>
        
        {/* Nick */}
        <h2 className="text-2xl font-heading font-bold text-neon-blue mb-2">
          {player.nick}
        </h2>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-accent" />
          <span className="font-heading font-semibold text-foreground">
            {player.rating ?? 1000} pts
          </span>
        </div>
        
        {/* Bio */}
        <p className="text-muted-foreground text-sm mb-6">
          {player.bio || '—'}
        </p>
        
        {/* Titles */}
        <div className="w-full">
          <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Títulos
          </h3>
          <div className="space-y-2">
            {(mockTitles[player.id] || mockTitles.default).map((title, i) => (
              <div
                key={i}
                className="bg-muted/50 rounded px-3 py-2 text-sm text-foreground"
              >
                {title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingRow({
  player,
  rank,
  isSelected,
  onClick,
}: {
  player: Player;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isTop3 = rank <= 3;
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${
        isSelected
          ? 'card-highlight animate-pulse-glow'
          : 'card-interactive hover:border-primary/30'
      } ${rank === 1 ? 'border-accent/50' : ''}`}
    >
      {/* Rank */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold ${
          rank === 1
            ? 'bg-accent text-accent-foreground'
            : rank === 2
            ? 'bg-muted-foreground/30 text-foreground'
            : rank === 3
            ? 'bg-orange-700/30 text-orange-400'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isTop3 ? <Trophy size={18} /> : rank}
      </div>
      
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.nick}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User size={24} className="text-muted-foreground" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 text-left">
        <p
          className={`font-heading font-semibold ${
            rank === 1 ? 'text-neon-yellow' : 'text-foreground'
          }`}
        >
          {player.nick}
        </p>
      </div>
      
      {/* Rating */}
      <div className="text-right">
        <p className="font-heading font-semibold text-primary">
          {player.rating ?? 1000}
        </p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 card-base">
      <div className="w-10 h-10 skeleton rounded-full" />
      <div className="w-12 h-12 skeleton rounded-full" />
      <div className="flex-1">
        <div className="h-5 w-32 skeleton rounded" />
      </div>
      <div className="text-right">
        <div className="h-5 w-16 skeleton rounded" />
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        setError(error.message);
      } else {
        setPlayers(data || []);
        if (data && data.length > 0) {
          setSelectedPlayer(data[0]);
        }
      }
      setLoading(false);
    }

    fetchPlayers();
  }, []);

  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-neon-blue mb-8">
          Leaderboard
        </h1>

        {error && (
          <div className="card-base p-4 border-destructive/50 bg-destructive/10 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Player Card - Desktop Only */}
          <div className="hidden lg:block lg:w-[30%]">
            {loading ? (
              <div className="card-base p-6 h-96 skeleton-shimmer" />
            ) : selectedPlayer ? (
              <PlayerCard
                player={selectedPlayer}
                rank={players.findIndex((p) => p.id === selectedPlayer.id) + 1}
              />
            ) : null}
          </div>

          {/* Ranking List */}
          <div className="flex-1">
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : players.length === 0 ? (
                <div className="card-base p-8 text-center">
                  <User size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum player cadastrado ainda
                  </p>
                </div>
              ) : (
                players.map((player, index) => (
                  <RankingRow
                    key={player.id}
                    player={player}
                    rank={index + 1}
                    isSelected={selectedPlayer?.id === player.id}
                    onClick={() => setSelectedPlayer(player)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Player Modal */}
        {selectedPlayer && (
          <div className="lg:hidden fixed inset-0 z-50 hidden" id="player-modal">
            {/* Modal content would go here for mobile */}
          </div>
        )}
      </div>
    </Layout>
  );
}
