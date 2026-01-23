import { ReactNode } from 'react';
import { Header } from './Header';
import blizzard from '@/assets/blizzard5.png';
import raven from '@/assets/vi5.png';

interface LayoutProps {
  children: ReactNode;
  showCharacters?: boolean;
}

export function Layout({ children, showCharacters = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Characters - Desktop Only */}
      {showCharacters && (
        <>
          <img
            src={blizzard}
            alt=""
            className="character-bg hidden lg:block left-0 bottom-0 h-[80vh] max-h-[800px]"
          />
          <img
            src={raven}
            alt=""
            className="character-bg hidden lg:block right-0 bottom-0 h-[80vh] max-h-[800px]"
          />
        </>
      )}
      
      <Header />
      
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
