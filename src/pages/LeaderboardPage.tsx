import { useEffect, useState } from 'react';
import { Trophy, Loader2, Medal, Users2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  isYou: boolean;
}

const MEDAL_COLORS = ['text-amber-400', 'text-gray-400', 'text-amber-700'];

export default function LeaderboardPage() {
  const [view, setView] = useState<'all' | 'cohort'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [cohortTotal, setCohortTotal] = useState<number | null>(null);

  useEffect(() => {
    // Best-effort: backfills the link between this account and a workshop
    // registration made with the same email before/without logging in.
    // Silently ignored either way -- the cohort tab just shows fewer/no
    // entries if there's nothing to link.
    apiClient.linkWorkshopRegistration().catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const request = view === 'all' ? apiClient.getLeaderboard() : apiClient.getWorkshopCohort();
    request
      .then((data) => {
        if (view === 'all') {
          setEntries(data.leaderboard);
          setYourRank(data.yourRank);
        } else {
          setEntries(data.cohort);
          setYourRank(data.yourRank);
          setCohortTotal(data.totalLinked);
        }
      })
      .catch((err) => toast.error(err.message || 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [view]);

  const youAreInTop = entries.some((e) => e.isYou);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <Trophy className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg sm:text-xl">Leaderboard</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Ranked by simulator score</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Tabs value={view} onValueChange={(v) => setView(v as 'all' | 'cohort')}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5"><Trophy className="w-3.5 h-3.5" /> All users</TabsTrigger>
              <TabsTrigger value="cohort" className="gap-1.5"><Users2 className="w-3.5 h-3.5" /> Workshop cohort</TabsTrigger>
            </TabsList>
          </Tabs>

          {view === 'cohort' && !loading && (
            <p className="text-xs text-muted-foreground">
              {cohortTotal === 0
                ? "No workshop registrants with a CloudOps account yet — register with the same email you signed up with."
                : `${cohortTotal} workshop registrant${cohortTotal === 1 ? '' : 's'} with a CloudOps account.`}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No scores yet — start the simulator to appear on the leaderboard.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-border overflow-hidden">
                {entries.map((e) => (
                  <div
                    key={e.userId}
                    className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 ${
                      e.isYou ? 'bg-primary/5' : 'bg-card'
                    }`}
                  >
                    <div className="w-8 text-center font-mono font-bold text-muted-foreground">
                      {e.rank <= 3 ? (
                        <Medal className={`w-5 h-5 mx-auto ${MEDAL_COLORS[e.rank - 1]}`} />
                      ) : (
                        e.rank
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {e.displayName}
                        {e.isYou && <span className="ml-2 text-xs text-primary font-semibold">(You)</span>}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-sm tabular-nums">{e.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {!youAreInTop && yourRank && (
                <div className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 flex items-center gap-4">
                  <div className="w-8 text-center font-mono font-bold text-muted-foreground">{yourRank.rank}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {yourRank.displayName} <span className="text-xs text-primary font-semibold">(You)</span>
                    </p>
                  </div>
                  <div className="font-mono font-bold text-sm tabular-nums">{yourRank.score.toLocaleString()}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
