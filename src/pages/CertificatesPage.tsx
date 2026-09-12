import { useEffect, useState } from 'react';
import { Award, GraduationCap, Loader2, Printer } from 'lucide-react';
import { useProgressStore } from '@/store/progressStore';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const MODULE_LABELS: Record<string, string> = {
  terraform: 'Terraform Lab',
  ansible: 'Ansible Lab',
  vault: 'Vault Lab',
  gitops: 'GitOps Lab',
  kubectl: 'kubectl Lab',
  monitoring: 'Monitoring Lab'
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CertificatesPage() {
  const { summary, certificates, fetchSummary, fetchCertificates } = useProgressStore();
  const fullName = useProfileStore((s) => s.fullName);
  const email = useAuthStore((s) => s.user?.email);
  const [loading, setLoading] = useState(true);
  const [openCode, setOpenCode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchCertificates()]).finally(() => setLoading(false));
  }, [fetchSummary, fetchCertificates]);

  const openCert = certificates.find((c) => c.code === openCode);
  const recipientName = fullName?.trim() || email?.split('@')[0] || 'Simulator User';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <GraduationCap className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg sm:text-xl">Progress & Certificates</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Track module progress and view earned certificates</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Module progress</h2>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {summary.map((m) => (
                    <div key={m.module} className="flex items-center gap-4 px-4 py-3 bg-card">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium">{MODULE_LABELS[m.module] ?? m.module}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {Math.min(m.current, m.target)}/{m.target}
                          </p>
                        </div>
                        <Progress value={Math.min(100, (m.current / m.target) * 100)} />
                      </div>
                      {m.completed && <Award className="w-5 h-5 text-amber-500 shrink-0" />}
                    </div>
                  ))}
                  {summary.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Start using a lab module to begin tracking progress.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Earned certificates</h2>
                {certificates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center rounded-xl border border-dashed border-border">
                    Complete a module's progress above to earn your first certificate.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certificates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setOpenCode(c.code)}
                        className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                      >
                        <Award className="w-6 h-6 text-amber-500 mb-2" />
                        <p className="font-semibold text-sm">{MODULE_LABELS[c.module] ?? c.module}</p>
                        <p className="text-xs text-muted-foreground mt-1">Issued {formatDate(c.issuedAt)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!openCert} onOpenChange={(open) => !open && setOpenCode(null)}>
        <DialogContent className="max-w-xl print:max-w-none print:border-none print:shadow-none">
          {openCert && (
            <div id="certificate-print-area" className="text-center py-6 px-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">CloudOps Simulator</p>
              <Award className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <DialogTitle className="text-2xl font-bold mb-1">Certificate of Completion</DialogTitle>
              <p className="text-sm text-muted-foreground mb-6">This certifies that</p>
              <p className="text-xl font-semibold mb-6">{recipientName}</p>
              <p className="text-sm text-muted-foreground mb-1">has successfully completed the</p>
              <p className="text-lg font-bold text-primary mb-6">{MODULE_LABELS[openCert.module] ?? openCert.module}</p>
              <p className="text-xs text-muted-foreground mb-6">Issued on {formatDate(openCert.issuedAt)}</p>
              <p className="text-[10px] font-mono text-muted-foreground">Certificate code: {openCert.code}</p>

              <div className="mt-6 print:hidden">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
