import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/Loader';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (session) {
    return <Navigate to="/leaderboard" replace />;
  }

  return <Navigate to="/login" replace />;
}
