import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Player } from '@/lib/supabase';
import logo from '@/assets/logo1-removebg-preview.png';
import { Menu, X, User, LogOut, ChevronDown, Bell } from 'lucide-react';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;


  useEffect(() => {
    if (!user?.id) return;

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setNotifications(data || []);
      }
    }

    fetchNotifications();
  }, [user?.id]);

  // Fetch player avatar
  useEffect(() => {
    if (!user?.player_id) {
      setPlayerAvatar(null);
      return;
    }

    async function fetchPlayerAvatar() {
      const { data } = await supabase
        .from('players')
        .select('avatar_url')
        .eq('id', user.player_id)
        .single();
      
      if (data?.avatar_url) {
        setPlayerAvatar(data.avatar_url);
      } else {
        setPlayerAvatar(null);
      }
    }

    fetchPlayerAvatar();
  }, [user?.player_id]);


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

  const markAsRead = async (id: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listener para fechar menus quando modais forem abertos
  useEffect(() => {
    function handleCloseMenus() {
      setMobileMenuOpen(false);
      setProfileDropdownOpen(false);
      setNotificationsOpen(false);
    }

    window.addEventListener('closeAllMenus', handleCloseMenus);
    return () => window.removeEventListener('closeAllMenus', handleCloseMenus);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Início' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/campeonatos', label: 'Campeonatos' },
    { path: '/players', label: 'Players' },
    ...(isAdmin ? [{ path: '/admin/requests', label: 'Solicitações' }] : []),
  ];

  return (
    <header className="  sticky top-0 z-50
  bg-gradient-to-r from-background via-card to-background
  backdrop-blur-md
  border-b border-border/50">
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
          <Link
            to="/dashboard"
            className="
    absolute left-1/2 -translate-x-1/2
    md:static md:translate-x-0
    flex items-center
  "
          >
            <img
              src={logo}
              alt="Varzea League"
              className="
      h-9 md:h-10 w-auto
    drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]
    "
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-heading font-semibold text-lg transition-colors ${isActive(item.path)
                  ? 'text-primary text-neon-blue'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell size={22} className="text-muted-foreground" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="
     fixed md:absolute 
     right-4 md:right-0 
     mt-2
     w-[calc(100vw-2rem)] sm:w-80
     max-w-sm
     max-h-[70vh]
     card-base shadow-lg z-50
    ">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-heading font-semibold">Notificações</p>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      Nenhuma notificação
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`px-4 py-3 text-sm border-b border-border cursor-pointer transition-colors
                ${!n.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted'}
              `}
                          onClick={() => markAsRead(n.id)}
                        >
                          <p className="font-heading font-semibold text-foreground">
                            {n.title}
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {n.message}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>


            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {playerAvatar ? (
                    <img
                      src={playerAvatar}
                      alt={user?.nick}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-primary" />
                  )}
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

        </div>


        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-4 font-heading font-semibold text-lg transition-colors ${isActive(item.path)
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
