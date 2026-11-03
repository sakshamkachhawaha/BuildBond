import { Navigate } from 'react-router';
import { useAuth } from '../auth.jsx';

/**
 * @param {{role?: 'CLIENT'|'CONTRACTOR', children: import('react').ReactNode}} props
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="muted">Checking your session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
