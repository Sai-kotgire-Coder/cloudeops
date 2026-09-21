import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, CalendarDays, Clock, Video, CheckCircle2, Loader2, Layers, Terminal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

const HIGHLIGHTS = [
  { icon: Layers, text: 'What DevOps & SRE actually are, beyond the job-title buzzwords' },
  { icon: Terminal, text: 'Hands-on time inside CloudOps Simulator, not slides' },
  { icon: Users, text: 'Career guidance beyond SDE — mapping paths into DevOps, SRE & platform roles' },
];

export default function WorkshopRegistrationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await apiClient.registerForWorkshop({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              ✦ Free weekend workshop · for students &amp; freshers
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              The Other Side<br />of <span className="text-primary">Software.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
              Every app you use stays online because of people most students never hear about. A hands-on weekend
              into DevOps &amp; SRE — and how to actually build a career in it.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  DATES
                </div>
                <p className="font-mono font-bold text-sm">Oct 3–4, 2026</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  TIME
                </div>
                <p className="font-mono font-bold text-sm">4:00–6:00 PM IST</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Video className="w-3.5 h-3.5" />
                  WHERE
                </div>
                <p className="font-mono font-bold text-sm">Google Meet</p>
              </div>
            </div>

            <div className="space-y-4">
              {HIGHLIGHTS.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                    <h.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground pt-1.5">{h.text}</p>
                </div>
              ))}
            </div>
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
                  Check your email for the Google Meet link and a calendar invite covering both sessions —
                  accept it to add them to your calendar automatically.
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
      </div>
    </div>
  );
}
