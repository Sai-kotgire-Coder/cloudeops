import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

// Sits inside ProtectedRoute (so isAuthenticated is already guaranteed) --
// this only adds the isAdmin check on top, redirecting a non-admin back to
// the dashboard rather than exposing even the empty admin shell to them.
export function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((s) => s.user);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
