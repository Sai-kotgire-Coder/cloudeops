import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReferralCodeFromUrl, stashReferralCodeForGitHub } from '@/lib/referral';

// Unlike Google, GitHub has no embeddable "sign in" widget -- this is a
// plain button that kicks off GitHub's standard redirect-based OAuth flow.
// Renders nothing if VITE_GITHUB_CLIENT_ID isn't configured.
export const GitHubSignInButton = () => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;

  if (!clientId) return null;

  const handleClick = () => {
    stashReferralCodeForGitHub(getReferralCodeFromUrl());
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  return (
    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleClick}>
      <Github className="w-4 h-4" />
      Continue with GitHub
    </Button>
  );
};
