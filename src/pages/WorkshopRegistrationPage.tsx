import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, CalendarDays, Clock, Video, MapPin, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, type PublicWorkshop } from '@/lib/apiClient';
import { toast } from 'sonner';

function formatDateRange(startAt: string, dailyCount: number): string {
  const start = new Date(startAt);
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' };
  if (dailyCount <= 1) return start.toLocaleDateString('en-US', opts);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (dailyCount - 1));
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

function formatTimeRange(startAt: string, endAt: string): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true };
  return `${new Date(startAt).toLocaleTimeString('en-US', opts)} - ${new Date(endAt).toLocaleTimeString('en-US', opts)} IST`;
}

export default function WorkshopRegistrationPage() {
  const [workshop, setWorkshop] = useState<PublicWorkshop | null | undefined>(undefined); // undefined = still loading
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    apiClient
      .getCurrentWorkshop()
      .then((data) => setWorkshop(data.workshop))
      .catch(() => setWorkshop(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshop) return;
    setSubmitting(true);
    try {
      const result = await apiClient.registerForWorkshop({
        workshopId: workshop.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      toast.success(result.message);
      setRegistered(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight">CloudOps <span className="text-muted-foreground font-normal">Sim</span></span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {workshop === undefined ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : workshop === null ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">No workshop scheduled right now</h1>
            <p className="text-sm text-muted-foreground">
              Check back soon, or follow CloudOps Simulator to hear about the next one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
                ✦ Free workshop · for students &amp; freshers
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
                {workshop.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
                {workshop.summary}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    DATES
                  </div>
                  <p className="font-mono font-bold text-sm">{formatDateRange(workshop.startAt, workshop.dailyCount)}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    TIME
                  </div>
                  <p className="font-mono font-bold text-sm">{formatTimeRange(workshop.startAt, workshop.endAt)}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    {workshop.isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    WHERE
                  </div>
                  <p className="font-mono font-bold text-sm">{workshop.isOnline ? 'Online' : 'In person'}</p>
                </div>
              </div>

              {workshop.highlights.length > 0 && (
                <div className="space-y-4">
                  {workshop.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground pt-1.5">{h}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              {registered ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">You're registered!</h2>
                  <p className="text-sm text-muted-foreground">
                    Check your email for the {workshop.isOnline ? 'meeting link' : 'location details'} and a calendar invite
                    {workshop.dailyCount > 1 ? ' covering every session' : ''} — accept it to add {workshop.dailyCount > 1 ? 'them' : 'it'} to your calendar automatically.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-1">Reserve your free spot</h2>
                  <p className="text-sm text-muted-foreground mb-6">Takes 10 seconds. You'll get a calendar invite by email.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="workshop-name">Name</Label>
                      <Input id="workshop-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="workshop-email">Email</Label>
                      <Input id="workshop-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="workshop-phone">Phone (optional)</Label>
                      <Input id="workshop-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For workshop reminders" />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {submitting ? 'Registering...' : 'Register free'}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
