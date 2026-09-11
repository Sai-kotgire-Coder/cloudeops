import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

// Central handler for the 'auth:unauthorized' event apiClient dispatches
// whenever an authenticated request comes back 401 -- almost always because
// the token's version was revoked elsewhere (a password change/reset, or an
// explicit "log out of all devices" from My Account). Without this, every
// other open tab/device would just keep failing request by request instead
// of being cleanly signed out.
export const SessionGuard = () => {
  const handledRef = useRef(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (handledRef.current) return;
      if (!useAuthStore.getState().isAuthenticated) return;
      handledRef.current = true;

      useAuthStore.getState().logout();
      toast.error('Your session has ended', {
        description: 'This can happen after a password change or "log out of all devices" elsewhere. Please sign in again.',
      });
      window.location.href = '/login';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return null;
};
