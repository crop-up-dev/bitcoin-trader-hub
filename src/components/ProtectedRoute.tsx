import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly }: ProtectedRouteProps) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/landing" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
