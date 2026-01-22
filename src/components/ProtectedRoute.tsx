import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/leaderboard" replace />;
  }

  return <>{children}</>;
}
