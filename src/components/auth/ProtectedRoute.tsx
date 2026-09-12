import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import LandingPage from '@/pages/LandingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // The root path is the one exception to the login redirect -- a
    // logged-out visitor hitting "/" sees the public landing page instead
    // of being bounced straight to /login. Every other protected path
    // (a bookmarked deep link, etc.) keeps the existing redirect.
    if (location.pathname === '/') {
      return <LandingPage />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
