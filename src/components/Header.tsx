import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/varzealogo.png';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';

export function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/campeonatos', label: 'Campeonatos' },
    ...(isAdmin ? [{ path: '/admin/players', label: 'Admin' }] : []),
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/leaderboard" className="flex items-center">
            <img src={logo} alt="Varzea League" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-heading font-semibold text-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-primary text-neon-blue'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <span className="hidden md:block font-heading font-semibold text-foreground">
                {user?.nick}
              </span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 card-base py-2 shadow-lg">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-heading font-semibold text-foreground">{user?.nick}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user?.type}</p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                >
                  <User size={18} className="text-muted-foreground" />
                  <span className="text-foreground">Meu Perfil</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-2 w-full hover:bg-muted transition-colors text-destructive"
                >
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-4 font-heading font-semibold text-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-primary bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
