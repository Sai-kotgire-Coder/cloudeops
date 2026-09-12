import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, ArrowRight, FileCode, ScrollText, Lock, Boxes, GitMerge, LineChart,
  Container, GitBranch, Award, Trophy, Gift, Shield, Terminal as TerminalIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MODULE_CATALOG } from '@/data/moduleCatalog';

const TERMINAL_LINES = [
  '$ kubectl scale deployment web --replicas=5',
  'deployment.apps/web scaled',
  '$ terraform apply',
  '+ 3 resources to add, 0 to change, 0 to destroy',
];

function TerminalWindow() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (lineIndex >= TERMINAL_LINES.length) {
      const resetTimer = setTimeout(() => {
        setLines([]);
        setLineIndex(0);
        setCharIndex(0);
      }, 2200);
      return () => clearTimeout(resetTimer);
    }

    const current = TERMINAL_LINES[lineIndex];
    if (charIndex <= current.length) {
      const typingTimer = setTimeout(() => setCharIndex((c) => c + 1), 28);
      return () => clearTimeout(typingTimer);
    }

    const nextLineTimer = setTimeout(() => {
      setLines((prev) => [...prev, current]);
      setLineIndex((i) => i + 1);
      setCharIndex(0);
    }, 500);
    return () => clearTimeout(nextLineTimer);
  }, [lineIndex, charIndex]);

  const currentPartial = lineIndex < TERMINAL_LINES.length ? TERMINAL_LINES[lineIndex].slice(0, charIndex) : '';

  return (
    <div className="rounded-xl border border-border bg-[#0a0e17] shadow-2xl overflow-hidden">
      <div className="h-9 bg-[#151b28] border-b border-white/5 flex items-center px-4 gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-amber-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-white/40 font-mono">cloudops-sim — kubectl</span>
      </div>
      <div className="p-5 font-mono text-[13px] leading-relaxed min-h-[180px]">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith('$') ? 'text-white/90' : 'text-green-400/90'}>
            {l}
          </div>
        ))}
        <div className={currentPartial.startsWith('$') || !currentPartial ? 'text-white/90' : 'text-green-400/90'}>
          {currentPartial}
          <span className="inline-block w-2 h-4 bg-primary align-middle ml-0.5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

const HIGHLIGHT_MODULE_IDS = ['terraform', 'ansible', 'vault', 'kubectl', 'gitops', 'monitoring', 'containers', 'cicd'];
const HIGHLIGHT_ICONS: Record<string, typeof FileCode> = {
  terraform: FileCode, ansible: ScrollText, vault: Lock, kubectl: Boxes,
  gitops: GitMerge, monitoring: LineChart, containers: Container, cicd: GitBranch,
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  const highlightModules = MODULE_CATALOG.filter((m) => HIGHLIGHT_MODULE_IDS.includes(m.id));

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight">CloudOps <span className="text-muted-foreground font-normal">Sim</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/register">
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <TerminalIcon className="w-3.5 h-3.5" />
              17 hands-on labs, real tools, zero risk
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Learn DevOps by
              <br />
              <span className="text-primary">actually doing it.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Terraform, Ansible, Vault, kubectl, GitOps, Monitoring — a fully simulated cloud environment where
              you run the real commands, break things on purpose, and learn what actually happens. No production
              system to accidentally take down.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/register">
                  Start learning free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <TerminalWindow />
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '17', label: 'Modules' },
            { value: '6', label: 'Certified labs' },
            { value: 'Real', label: 'Industry tools' },
            { value: '$0', label: 'Risk to production' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold text-primary font-mono">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Six deep-dive Infrastructure Labs</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each one teaches a real, industry-standard tool the way it's actually used — not a simplified toy
            version. Complete real activity in a lab and earn a certificate.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlightModules.map((m, i) => {
            const Icon = HIGHLIGHT_ICONS[m.id] ?? FileCode;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{m.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          Plus Applications, Instances, Networking, CI/CD, Scenarios, and more — 17 modules in total.
        </p>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up free, no credit card needed — pick which modules you want visible in your sidebar.' },
              { step: '02', title: 'Learn by doing', desc: 'Every lab is a real, working environment. Run real commands, write real config, watch real consequences.' },
              { step: '03', title: 'Break things on purpose', desc: 'Simulate drift, crash a container, overload an instance — the fastest way to actually understand a failure mode.' },
            ].map((s) => (
              <motion.div key={s.step} {...fadeUp}>
                <span className="text-4xl font-bold text-primary/30 font-mono">{s.step}</span>
                <h3 className="text-lg font-semibold mt-3 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { icon: Award, title: 'Certificates', desc: 'Complete real activity in a lab and automatically earn a printable certificate of completion.' },
            { icon: Trophy, title: 'Leaderboard', desc: 'Your simulator score ranks against everyone else learning alongside you.' },
            { icon: Gift, title: 'Refer & earn', desc: 'Invite a friend — you both earn points once they get started.' },
          ].map((f) => (
            <motion.div key={f.title} {...fadeUp} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div {...fadeUp} className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 sm:p-16 text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Start your DevOps journey today</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Free to start. Every lab is real. Every mistake is safe.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/register">
              Create your free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>CloudOps Simulator — a hands-on DevOps &amp; cloud infrastructure learning platform.</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
