import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Loader2, Zap, Trophy, GraduationCap, Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/apiClient';

const MODULE_LABELS: Record<string, string> = {
  terraform: 'Terraform Lab',
  ansible: 'Ansible Lab',
  vault: 'Vault Lab',
  gitops: 'GitOps Lab',
  kubectl: 'kubectl Lab',
  monitoring: 'Monitoring Lab',
};

interface PublicProfile {
  displayName: string;
  institute: string | null;
  occupation: string | null;
  memberSince: string;
  score: number;
  moduleProgress: { module: string; current: number; target: number; completed: boolean }[];
  certificates: { module: string; code: string; issuedAt: string }[];
}

export default function PublicProfilePage() {
  const { token } = useParams<{ token: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiClient
      .getPublicProfile(token)
      .then(setProfile)
      .catch((err) => setError(err.message || 'This share link is invalid or was revoked'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight">CloudOps <span className="text-muted-foreground font-normal">Sim</span></span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !profile ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">{error || 'Profile not found'}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h1 className="text-2xl font-bold mb-1">{profile.displayName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profile.occupation && (
                  <span className="flex items-center gap-1.5">
                    {profile.occupation === 'student' ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                    {profile.occupation}
                  </span>
                )}
                {profile.institute && <span>{profile.institute}</span>}
                <span>Member since {new Date(profile.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Trophy className="w-4 h-4" />
                {profile.score.toLocaleString()} points
              </div>
            </div>

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Module progress</h2>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {profile.moduleProgress.map((m) => (
                  <div key={m.module} className="flex items-center gap-4 px-4 py-3 bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium">{MODULE_LABELS[m.module] ?? m.module}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{Math.min(m.current, m.target)}/{m.target}</p>
                      </div>
                      <Progress value={Math.min(100, (m.current / m.target) * 100)} />
                    </div>
                    {m.completed && <Award className="w-5 h-5 text-amber-500 shrink-0" />}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Certificates</h2>
              {profile.certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border">
                  No certificates earned yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.certificates.map((c) => (
                    <div key={c.code} className="rounded-xl border border-border bg-card p-4">
                      <Award className="w-6 h-6 text-amber-500 mb-2" />
                      <p className="font-semibold text-sm">{MODULE_LABELS[c.module] ?? c.module}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued {new Date(c.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="text-center pt-4">
              <Link to="/register" className="text-sm text-primary hover:underline">
                Build your own DevOps profile on CloudOps Simulator →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
