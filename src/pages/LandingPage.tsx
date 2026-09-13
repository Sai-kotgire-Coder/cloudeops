import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useScroll, animate } from 'framer-motion';
import {
  Zap, ArrowRight, FileCode, ScrollText, Lock, Boxes, GitMerge, LineChart,
  Container, GitBranch, Award, Trophy, Gift, Shield, Terminal as TerminalIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MODULE_CATALOG } from '@/data/moduleCatalog';

// ============================================================================
// Interactive terminal -- a visitor can pick which command actually "runs"
// instead of only watching a fixed auto-playing script.
// ============================================================================

interface CommandScript {
  id: string;
  chip: string;
  lines: string[];
}

const COMMAND_SCRIPTS: CommandScript[] = [
  {
    id: 'kubectl',
    chip: 'kubectl scale',
    lines: ['$ kubectl scale deployment web --replicas=5', 'deployment.apps/web scaled'],
  },
  {
    id: 'terraform',
    chip: 'terraform apply',
    lines: ['$ terraform apply', '+ 3 resources to add, 0 to change, 0 to destroy', 'Apply complete! Resources: 3 added, 0 changed, 0 destroyed.'],
  },
  {
    id: 'vault',
    chip: 'vault kv get',
    lines: ['$ vault kv get secret/prod/db', 'Key           Value', '---           -----', 'password       [version 3, created 2m ago]'],
  },
  {
    id: 'gitops',
    chip: 'argo sync',
    lines: ['$ git commit -m "bump replicas to 5"', '$ argocd app sync web', 'app web Synced Healthy'],
  },
];

function TerminalWindow() {
  const [activeId, setActiveId] = useState(COMMAND_SCRIPTS[0].id);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [autoPlay, setAutoPlay] = useState(true);

  const script = COMMAND_SCRIPTS.find((s) => s.id === activeId) ?? COMMAND_SCRIPTS[0];

  const runScript = (id: string) => {
    setAutoPlay(false);
    setActiveId(id);
    setLines([]);
    setLineIndex(0);
    setCharIndex(0);
  };

  useEffect(() => {
    if (lineIndex >= script.lines.length) {
      if (!autoPlay) return;
      const resetTimer = setTimeout(() => {
        const nextIndex = (COMMAND_SCRIPTS.findIndex((s) => s.id === activeId) + 1) % COMMAND_SCRIPTS.length;
        setActiveId(COMMAND_SCRIPTS[nextIndex].id);
        setLines([]);
        setLineIndex(0);
        setCharIndex(0);
      }, 2200);
      return () => clearTimeout(resetTimer);
    }

    const current = script.lines[lineIndex];
    if (charIndex <= current.length) {
      const typingTimer = setTimeout(() => setCharIndex((c) => c + 1), 22);
      return () => clearTimeout(typingTimer);
    }

    const nextLineTimer = setTimeout(() => {
      setLines((prev) => [...prev, current]);
      setLineIndex((i) => i + 1);
      setCharIndex(0);
    }, 400);
    return () => clearTimeout(nextLineTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex, charIndex, activeId]);

  const currentPartial = lineIndex < script.lines.length ? script.lines[lineIndex].slice(0, charIndex) : '';
  const lineColor = (l: string) => (l.startsWith('$') ? 'text-white/90' : 'text-green-400/90');

  return (
    <div>
      <div className="rounded-xl border border-border bg-[#0a0e17] shadow-2xl overflow-hidden">
        <div className="h-9 bg-[#151b28] border-b border-white/5 flex items-center px-4 gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-amber-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-3 text-xs text-white/40 font-mono">cloudops-sim — live terminal</span>
        </div>
        <div className="p-5 font-mono text-[13px] leading-relaxed min-h-[180px]">
          {lines.map((l, i) => (
            <div key={i} className={lineColor(l)}>{l}</div>
          ))}
          <div className={currentPartial.startsWith('$') || !currentPartial ? 'text-white/90' : 'text-green-400/90'}>
            {currentPartial}
            <span className="inline-block w-2 h-4 bg-primary align-middle ml-0.5 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {COMMAND_SCRIPTS.map((s) => (
          <button
            key={s.id}
            onClick={() => runScript(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
              activeId === s.id
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {s.chip}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Spotlight + tilt wrapper -- cursor-reactive glow and a gentle 3D tilt,
// applied to feature/gamification cards.
// ============================================================================

function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(mouseX, (v) => `${v * 100}%`);
  const glowY = useTransform(mouseY, (v) => `${v * 100}%`);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const resetTilt = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`group relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/40 transition-colors ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) => `radial-gradient(280px circle at ${x} ${y}, hsl(var(--primary) / 0.15), transparent 70%)`
          ),
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// Animated count-up number, triggers once when scrolled into view.
// ============================================================================

function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const controls = animate(0, to, {
            duration: 1.2,
            ease: 'easeOut',
            onUpdate: (v) => setValue(Math.round(v)),
          });
          return () => controls.stop();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started, to]);

  return (
    <p ref={ref} className="text-2xl sm:text-3xl font-bold text-primary font-mono tabular-nums">
      {prefix}{value}{suffix}
    </p>
  );
}

// ============================================================================

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

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-primary/15 blur-[110px] animate-[drift1_18s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-emerald-500/10 blur-[110px] animate-[drift2_22s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-[100px] animate-[drift1_20s_ease-in-out_infinite_reverse]" />
      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-primary origin-left z-[60]"
    />
  );
}

export default function LandingPage() {
  const highlightModules = MODULE_CATALOG.filter((m) => HIGHLIGHT_MODULE_IDS.includes(m.id));

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgressBar />
      <AmbientBackground />

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
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6"
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              17 hands-on labs, real tools, zero risk
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Learn DevOps by
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_auto] animate-[shine_4s_linear_infinite]">
                actually doing it.
              </span>
            </h1>
            <style>{`@keyframes shine { to { background-position: 200% center; } }`}</style>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Terraform, Ansible, Vault, kubectl, GitOps, Monitoring — a fully simulated cloud environment where
              you run the real commands, break things on purpose, and learn what actually happens. No production
              system to accidentally take down.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="lg" className="gap-2">
                  <Link to="/register">
                    Start learning free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">I already have an account</Link>
                </Button>
              </motion.div>
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
          <div>
            <CountUp to={17} />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Modules</p>
          </div>
          <div>
            <CountUp to={6} />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Certified labs</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary font-mono">Real</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Industry tools</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary font-mono">$0</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Risk to production</p>
          </div>
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
              >
                <SpotlightCard className="p-5 h-full">
                  <motion.div
                    whileHover={{ rotate: -6, scale: 1.08 }}
                    className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold mb-1.5">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                </SpotlightCard>
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
              <motion.div key={s.step} {...fadeUp} whileHover={{ y: -4 }}>
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
            <motion.div key={f.title} {...fadeUp}>
              <SpotlightCard className="p-6 h-full">
                <f.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 sm:p-16 text-center"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.25), transparent 60%)' }}
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative">
            <Shield className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Start your DevOps journey today</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Free to start. Every lab is real. Every mistake is safe.
            </p>
            <motion.div className="inline-block" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button asChild size="lg" className="gap-2">
                <Link to="/register">
                  Create your free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
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
