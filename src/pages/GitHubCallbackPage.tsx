import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { consumeStashedGitHubReferralCode } from '@/lib/referral';

// Public route -- the user lands here unauthenticated, straight off
// GitHub's redirect, with a one-time authorization code in the query
// string. Exchanges it for our own session the same way any other login
// does, then redirects to the dashboard.
export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuthState = useAuthStore((s) => s.setAuthState);
  const [error, setError] = useState('');
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get('code');
    if (!code) {
      setError('No authorization code was returned by GitHub.');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/github/callback`;

    apiClient
      .githubLogin(code, redirectUri, consumeStashedGitHubReferralCode())
      .then(async (result) => {
        localStorage.setItem('auth_token', result.token);
        await setAuthState(result.user, result.token);
        navigate('/');
      })
      .catch((err) => setError(err.message || 'GitHub sign-in failed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-sm">
        {error ? (
          <>
            <TriangleAlert className="h-10 w-10 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Sign-in failed</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Link to="/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Signing you in with GitHub...</p>
          </>
        )}
      </div>
    </div>
  );
}
