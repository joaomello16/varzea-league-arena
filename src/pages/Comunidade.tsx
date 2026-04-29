import { Layout } from '@/components/Layout';
import { MessageCircle, Users, Youtube, MessageSquare, ExternalLink } from 'lucide-react';

export default function Comunidade() {
  const communityLinks = [
    {
      title: 'Contato WhatsApp',
      description: 'Fale diretamente com o suporte da liga.',
      href: 'https://wa.me/554896601449',
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Grupo da Liga',
      description: 'Entre no nosso grupo oficial do WhatsApp.',
      href: 'https://chat.whatsapp.com/Fe7Xe9jBbbw17XGJPBEHv1',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Canal do YouTube',
      description: 'Assista as lives e melhores momentos.',
      href: 'https://www.youtube.com/@VarzeaLeagueBE',
      icon: Youtube,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Discord da Liga',
      description: 'Junte-se ao nosso servidor oficial no Discord.',
      href: 'https://discord.gg/kyYeaMJZM',
      icon: MessageSquare,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <Layout>
      <div className="container-main py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-neon-purple mb-4">
              Nossa Comunidade
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Conecte-se com outros jogadores, acompanhe as novidades e participe das discussões nos nossos canais oficiais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communityLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-6 hover:border-primary/50 transition-all group flex items-start gap-5"
              >
                <div className={`w-14 h-14 rounded-2xl ${link.bgColor} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <link.icon className={`w-8 h-8 ${link.color}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <ExternalLink size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-16 card-base p-8 text-center bg-muted/30">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              Por que participar?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Fazer parte da comunidade da Varzea League garante que você nunca perca o anúncio de um torneio, 
              possa encontrar parceiros de equipe e acompanhe em tempo real os resultados da liga.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
