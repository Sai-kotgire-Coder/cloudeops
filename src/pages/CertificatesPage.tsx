import { useEffect, useState } from 'react';
import { Award, GraduationCap, Loader2, Printer, Share2, Check, Link2Off } from 'lucide-react';
import { useProgressStore } from '@/store/progressStore';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { printElementInNewWindow } from '@/lib/printIsolated';
import { RecommendationCard } from '@/components/learning/RecommendationCard';
import { QuizModal } from '@/components/learning/QuizModal';
import { toast } from 'sonner';

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
  const { summary, certificates, recommendation, fetchSummary, fetchCertificates } = useProgressStore();
  const [quizModule, setQuizModule] = useState<string | null>(null);
  const fullName = useProfileStore((s) => s.fullName);
  const email = useAuthStore((s) => s.user?.email);
  const [loading, setLoading] = useState(true);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchCertificates()]).finally(() => setLoading(false));
  }, [fetchSummary, fetchCertificates]);

  const shareUrl = shareToken ? `${window.location.origin}/u/${shareToken}` : null;

  const handleShare = async () => {
    setSharing(true);
    try {
      const { shareToken: token } = await apiClient.createProfileShareLink();
      setShareToken(token);
      await navigator.clipboard.writeText(`${window.location.origin}/u/${token}`);
      setJustCopied(true);
      toast.success('Link copied — anyone with it can view your progress and certificates.');
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create share link');
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await apiClient.revokeProfileShareLink();
      setShareToken(null);
      toast.success('Share link revoked');
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke share link');
    }
  };

  const openCert = certificates.find((c) => c.code === openCode);
  const recipientName = fullName?.trim() || email?.split('@')[0] || 'Simulator User';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <GraduationCap className="w-6 h-6 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-lg sm:text-xl">Progress & Certificates</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Track module progress and view earned certificates</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {shareToken ? (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleRevoke}>
              <Link2Off className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Revoke share link</span>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" disabled={sharing} onClick={handleShare}>
              {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : justCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{justCopied ? 'Copied!' : 'Share my profile'}</span>
            </Button>
          )}
        </div>
      </header>
      {shareUrl && (
        <div className="px-4 sm:px-6 py-2 bg-primary/5 border-b border-border text-xs flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground">Public link:</span>
          <code className="font-mono truncate">{shareUrl}</code>
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <RecommendationCard recommendation={recommendation} />

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
                      {m.certificateEarned ? (
                        <Award className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : m.completed ? (
                        <Button size="sm" className="shrink-0" onClick={() => setQuizModule(m.module)}>Take quiz</Button>
                      ) : null}
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

      <QuizModal
        moduleId={quizModule ?? ''}
        moduleLabel={quizModule ? (MODULE_LABELS[quizModule] ?? quizModule) : ''}
        open={!!quizModule}
        onClose={() => setQuizModule(null)}
        onCertificateAwarded={() => { fetchSummary(); fetchCertificates(); }}
      />

      <Dialog open={!!openCert} onOpenChange={(open) => !open && setOpenCode(null)}>
        <DialogContent className="max-w-3xl print:max-w-none print:border-none print:shadow-none print:bg-transparent bg-transparent border-none shadow-none p-0">
          {/* DialogContent needs a title in the DOM for screen readers even
              though this certificate has its own visual "Certificate of
              Completion" heading below -- kept visually hidden, not removed. */}
          <DialogTitle className="sr-only">Certificate of Completion</DialogTitle>
          {openCert && (
            <div>
              <div
                id="certificate-print-area"
                className="relative mx-auto w-full aspect-[1.414/1] p-3 sm:p-4"
                style={{ background: '#f6f1e4', color: '#1f2937' }}
              >
                {/* Outer + inner rule, the classic double-line certificate border */}
                <div className="absolute inset-3 sm:inset-4 border-[3px]" style={{ borderColor: '#b8862f' }} />
                <div className="absolute inset-[18px] sm:inset-6 border" style={{ borderColor: '#b8862f' }} />

                <div className="relative h-full flex flex-col items-center justify-between text-center px-6 sm:px-14 pt-6 sm:pt-10 pb-8 sm:pb-12">
                  <div className="flex flex-col items-center">
                    <p
                      className="text-[10px] sm:text-xs uppercase tracking-[0.4em]"
                      style={{ color: '#b8862f', fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      CloudOps Simulator
                    </p>
                    <h2
                      className="mt-3 sm:mt-4 text-2xl sm:text-4xl"
                      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1f2937' }}
                    >
                      Certificate of Completion
                    </h2>
                    <div className="mt-3 h-px w-24 sm:w-32" style={{ background: '#b8862f' }} />
                  </div>

                  <div className="flex flex-col items-center">
                    <p
                      className="text-sm sm:text-base italic"
                      style={{ fontFamily: "'Cormorant Garamond', serif", color: '#57534e' }}
                    >
                      This certifies that
                    </p>
                    <p
                      className="mt-2 sm:mt-3 text-3xl sm:text-5xl"
                      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, color: '#1f2937' }}
                    >
                      {recipientName}
                    </p>
                    <p
                      className="mt-4 sm:mt-6 text-sm sm:base"
                      style={{ fontFamily: "'Cormorant Garamond', serif", color: '#57534e' }}
                    >
                      has successfully completed the
                    </p>
                    <p
                      className="mt-1 text-xl sm:text-2xl font-semibold"
                      style={{ color: '#8a5a1d', fontFamily: "'Playfair Display', serif" }}
                    >
                      {MODULE_LABELS[openCert.module] ?? openCert.module}
                    </p>
                  </div>

                  <div className="w-full flex items-end justify-between gap-4">
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-medium" style={{ borderTop: '1px solid #a8a29e', paddingTop: 4, minWidth: 140 }}>
                        {formatDate(openCert.issuedAt)}
                      </p>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest mt-0.5" style={{ color: '#78716c' }}>
                        Date Issued
                      </p>
                    </div>

                    {/* Wax-seal style badge, the traditional certificate authenticity mark */}
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-full flex items-center justify-center" style={{ background: '#b8862f' }}>
                      <div className="absolute inset-1.5 rounded-full border" style={{ borderColor: '#f6f1e4' }} />
                      <Award className="w-6 h-6 sm:w-9 sm:h-9" style={{ color: '#f6f1e4' }} />
                    </div>

                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-mono font-medium" style={{ borderTop: '1px solid #a8a29e', paddingTop: 4, minWidth: 140 }}>
                        {openCert.code}
                      </p>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest mt-0.5" style={{ color: '#78716c' }}>
                        Certificate No.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => printElementInNewWindow('certificate-print-area', `Certificate - ${MODULE_LABELS[openCert.module] ?? openCert.module}`)}
                >
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
