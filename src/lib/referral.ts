// Shared helpers for capturing a referral code (?ref=CODE) across all 3
// signup paths. Plain email/register and Google (client-side, no redirect)
// can just read the URL synchronously; GitHub's full-page redirect needs
// the code stashed somewhere that survives navigating away and back.
const GITHUB_REFERRAL_STASH_KEY = 'cloudops_pending_referral_code';

export function getReferralCodeFromUrl(): string | undefined {
  const code = new URLSearchParams(window.location.search).get('ref');
  return code || undefined;
}

export function stashReferralCodeForGitHub(code: string | undefined) {
  if (code) {
    localStorage.setItem(GITHUB_REFERRAL_STASH_KEY, code);
  }
}

export function consumeStashedGitHubReferralCode(): string | undefined {
  const code = localStorage.getItem(GITHUB_REFERRAL_STASH_KEY);
  if (code) {
    localStorage.removeItem(GITHUB_REFERRAL_STASH_KEY);
  }
  return code || undefined;
}
