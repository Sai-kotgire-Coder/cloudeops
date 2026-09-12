import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { getReferralCodeFromUrl } from '@/lib/referral';

declare global {
  interface Window {
    google?: any;
  }
}

let gsiScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.body.appendChild(script);
  });
  return gsiScriptPromise;
}

// Renders Google's own "Continue with Google" button (via Google Identity
// Services) and wires its credential response through to our backend,
// which verifies the token and issues our own app JWT the same way a
// normal login does. Renders nothing if VITE_GOOGLE_CLIENT_ID isn't
// configured, so the rest of the auth pages work fine without it set up.
export const GoogleSignInButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuthState = useAuthStore((s) => s.setAuthState);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const handleCredentialResponse = async (response: { credential: string }) => {
      try {
        const result = await apiClient.googleLogin(response.credential, getReferralCodeFromUrl());
        localStorage.setItem('auth_token', result.token);
        await setAuthState(result.user, result.token);
        toast({ title: 'Welcome!', description: 'Signed in with Google.' });
        navigate('/');
      } catch (err: any) {
        toast({
          title: 'Google Sign-In failed',
          description: err.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        // Google's button only accepts a literal pixel width (no "100%"),
        // so match the container's actual rendered width to keep it aligned
        // with the full-width GitHub button below it.
        const measuredWidth = containerRef.current.getBoundingClientRect().width;
        const width = Math.round(Math.min(400, Math.max(200, measuredWidth || 320)));
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width,
          text: 'continue_with',
        });
      })
      .catch((err) => console.error('Google Sign-In script failed to load:', err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return <div ref={containerRef} className="flex justify-center" />;
};
