import { useEffect, useState } from 'react';
import { Gift, Copy, Check, Loader2, Users } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  totalPointsEarned: number;
  referredUsers: { emailMasked: string; joinedAt: string; rewarded: boolean }[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient
      .getMyReferral()
      .then(setData)
      .catch((err) => toast.error(err.message || 'Failed to load referral info'))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <Gift className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg sm:text-xl">Refer & Earn</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Invite friends, earn points when they get started</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {loading || !data ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold mb-3">Your referral link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-xs sm:text-sm bg-muted rounded-md px-3 py-2 font-mono">
                    {data.referralLink}
                  </code>
                  <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Both of you earn <span className="font-semibold text-foreground">50 points</span> once they finish setting up their account.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xl font-bold">{data.totalReferred}</p>
                  <p className="text-xs text-muted-foreground">Friends referred</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xl font-bold">{data.totalPointsEarned}</p>
                  <p className="text-xs text-muted-foreground">Points earned</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Referred friends</p>
                {data.referredUsers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-10 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Share your link to get started.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {data.referredUsers.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 bg-card">
                        <div>
                          <p className="text-sm font-medium">{r.emailMasked}</p>
                          <p className="text-xs text-muted-foreground">Joined {formatDate(r.joinedAt)}</p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            r.rewarded ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.rewarded ? 'Rewarded' : 'Setting up...'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
