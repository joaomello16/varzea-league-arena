import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChevronRight } from 'lucide-react';
import { GiTrophy, GiSwordsPower, GiCrown } from 'react-icons/gi';
import bannerMobile from '@/assets/image (1).png';

export default function Dashboard() {
  const cards = [
    {
      title: 'PLACAR DE LÍDERES',
      description: 'Veja o ranking dos melhores jogadores da temporada',
      icon: GiTrophy,
      path: '/leaderboard',
      accentColor: 'from-yellow-600/80 to-amber-800/80',
      glowColor: 'shadow-amber-500/30',
    },
    {
      title: 'CAMPEONATOS',
      description: 'Acompanhe os campeonatos ativos e resultados',
      icon: GiCrown,
      path: '/campeonatos',
      accentColor: 'from-sky-700/80 to-blue-900/80',
      glowColor: 'shadow-sky-500/25',
    },
    {
      title: 'VISUALIZAR PLAYERS',
      description: 'Explore o perfil e estatísticas de todos os jogadores',
      icon: GiSwordsPower,
      path: '/players',
      accentColor: 'from-violet-700/80 to-fuchsia-900/80',
      glowColor: 'shadow-violet-500/25',
    },
  ];

  return (
    <Layout showCharacters={false}>
      <div className="space-y-0">
        {/* Hero Banner Section */}
        <div className="relative w-full mb-12">
          <div className="relative h-[300px] md:h-[400px] overflow-hidden">
            {/* Banner Image */}
            <img
              src={bannerMobile}
              alt="Varzea League Banner"
              className="w-full h-full object-cover"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background"></div>
            
            {/* Hero Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-4xl md:text-6xl font-heading font-black text-white mb-4 tracking-tight uppercase
                drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                Bem-vindo à<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                  Varzea League
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl">
                Acompanhe as estatísticas, rankings e campeonatos da liga mais competitiva
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.path}
                  to={card.path}
                  className="group relative"
                >
                  {/* Card Container */}
                  <div className={`
                    relative overflow-hidden
                    bg-gradient-to-br from-card/80 to-card/40
                    backdrop-blur-sm
                    border border-border/50
                    rounded-lg
                    p-6 md:p-8
                    transition-all duration-300
                    hover:border-primary/50
                    hover:shadow-2xl hover:${card.glowColor}
                    hover:-translate-y-2
                  `}>
                    {/* Accent Line */}
                    <div className={`
                      absolute top-0 left-0 right-0 h-1
                      bg-gradient-to-r ${card.accentColor}
                      opacity-60 group-hover:opacity-100 transition-opacity
                    `}></div>

                    {/* Background Glow Effect */}
                    <div className={`
                      absolute -top-20 -right-20 w-40 h-40
                      bg-gradient-to-br ${card.accentColor}
                      opacity-0 group-hover:opacity-10
                      blur-3xl rounded-full
                      transition-opacity duration-500
                    `}></div>

                    {/* Icon Section */}
                    <div className="relative mb-6">
                      <div className={`
                        w-16 h-16 md:w-20 md:h-20
                        rounded-xl
                        bg-gradient-to-br ${card.accentColor}
                        flex items-center justify-center
                        shadow-lg
                        group-hover:scale-110
                        transition-transform duration-300
                      `}>
                        <Icon size={36} className="text-white" strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative space-y-3">
                      <h2 className="text-xl md:text-2xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        {card.title}
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Arrow CTA */}
                    <div className="relative mt-6 flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                      <span className="text-sm uppercase tracking-wider">Acessar</span>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="mt-12 text-center space-y-2 pb-8">
            <p className="text-muted-foreground text-sm md:text-base">
              Acompanhe suas estatísticas em tempo real
            </p>
            <p className="text-xs text-muted-foreground/60">
              Conecte-se, compete e evolua no ranking
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
