import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Cpu, Container, Globe, Layers, Zap, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useLearningStore } from '@/store/learningStore';

const PRESETS = {
  nginx: {
    name: 'Nginx Web Server',
    image: 'nginx:1.25-alpine',
    port: 80,
    replicas: 2,
    strategy: 'Rolling',
    requests: { cpu: '100m', memory: '128Mi' },
    healthCheck: { liveness: true, readiness: true },
    envVars: [{ key: 'NGINX_HOST', value: 'localhost' }],
  },
  node: {
    name: 'Node.js API',
    image: 'node:20-alpine',
    port: 3000,
    replicas: 2,
    strategy: 'Blue/Green',
    requests: { cpu: '200m', memory: '256Mi' },
    healthCheck: { liveness: true, readiness: true },
    envVars: [{ key: 'NODE_ENV', value: 'production' }, { key: 'PORT', value: '3000' }],
  },
  python: {
    name: 'Python Flask API',
    image: 'python:3.11-slim',
    port: 5000,
    replicas: 1,
    strategy: 'Rolling',
    requests: { cpu: '150m', memory: '192Mi' },
    healthCheck: { liveness: false, readiness: true },
    envVars: [{ key: 'FLASK_ENV', value: 'production' }],
  },
} as const;

interface CreateAppModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateAppModal = ({ open, onClose }: CreateAppModalProps) => {
  const { createApplication } = useGameStore();
  const { openTopic } = useLearningStore();

  const [name, setName] = useState('');
  const [image, setImage] = useState('nginx:1.25-alpine');
  const [port, setPort] = useState(80);
  const [replicas, setReplicas] = useState(1);
  const [strategy, setStrategy] = useState<'Rolling' | 'Blue/Green'>('Rolling');
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cpuReq, setCpuReq] = useState('100m');
  const [memReq, setMemReq] = useState('128Mi');
  const [liveness, setLiveness] = useState(true);
  const [readiness, setReadiness] = useState(true);

  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    setName(p.name);
    setImage(p.image);
    setPort(p.port);
    setReplicas(p.replicas);
    setStrategy(p.strategy as 'Rolling' | 'Blue/Green');
    setEnvVars(p.envVars.length > 0 ? [...p.envVars] : [{ key: '', value: '' }]);
    setCpuReq(p.requests.cpu);
    setMemReq(p.requests.memory);
    setLiveness(p.healthCheck.liveness);
    setReadiness(p.healthCheck.readiness);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createApplication(name, {
      image,
      port,
      strategy,
      envVars: envVars.filter(e => e.key.trim()),
      requests: { cpu: cpuReq, memory: memReq },
      healthCheck: { liveness, readiness },
      deployments: [{ id: `dep-init-v1`, version: 'v1', replicas }],
    });
    onClose();
  };

  const updateEnv = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...envVars];
    next[i][field] = val;
    setEnvVars(next);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-card border border-border rounded-2xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card/90 backdrop-blur-xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">Deploy New Application</h2>
                  <p className="text-xs text-muted-foreground">Configure container, ports, and deployment strategy</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Presets */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Presets</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key as keyof typeof PRESETS)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-secondary hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* App Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Application Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. payment-service, frontend-web"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Container Image & Port */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Container className="w-3.5 h-3.5 text-primary" /> Container Image
                    <button onClick={() => openTopic('instances')} className="text-primary text-xs ml-1 underline underline-offset-2">Learn More</button>
                  </label>
                  <input
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="nginx:latest"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-foreground placeholder:text-muted-foreground/60"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Container image defines what your app runs.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Container Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Port your app listens on inside the container.</p>
                </div>
              </div>

              {/* Replicas & Strategy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Initial Replicas</label>
                  <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2 border border-border">
                    <button onClick={() => setReplicas(Math.max(0, replicas - 1))} className="p-0.5 hover:text-primary">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-bold text-lg">{replicas}</span>
                    <button onClick={() => setReplicas(replicas + 1)} className="p-0.5 hover:text-primary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Deployment Strategy</label>
                  <div className="flex gap-2">
                    {(['Rolling', 'Blue/Green'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${strategy === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{strategy === 'Rolling' ? 'Gradually replaces old pods.' : 'Runs two environments, then switches traffic.'}</p>
                </div>
              </div>

              {/* Environment Variables */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-foreground">Environment Variables</label>
                  <button onClick={() => setEnvVars([...envVars, { key: '', value: '' }])} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {envVars.map((e, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={e.key} onChange={ev => updateEnv(i, 'key', ev.target.value)} placeholder="KEY"
                        className="w-1/3 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      <span className="text-muted-foreground">=</span>
                      <input value={e.value} onChange={ev => updateEnv(i, 'value', ev.target.value)} placeholder="value"
                        className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      <button onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Config Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border"
              >
                Advanced Configuration {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1 flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-warning" /> CPU Request</label>
                        <input value={cpuReq} onChange={e => setCpuReq(e.target.value)} placeholder="100m"
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                        <p className="text-[11px] text-muted-foreground mt-1">e.g. 100m (0.1 CPU core)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Memory Request</label>
                        <input value={memReq} onChange={e => setMemReq(e.target.value)} placeholder="128Mi"
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                        <p className="text-[11px] text-muted-foreground mt-1">e.g. 128Mi, 512Mi, 1Gi</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Health Checks</label>
                      <div className="flex gap-4">
                        {([['liveness', liveness, setLiveness], ['readiness', readiness, setReadiness]] as const).map(([label, val, setter]) => (
                          <button key={label} onClick={() => (setter as any)(!val)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${val ? 'bg-success/10 border-success/30 text-success' : 'bg-secondary border-border text-muted-foreground'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            {label === 'liveness' ? 'Liveness Probe' : 'Readiness Probe'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">Liveness restarts unhealthy pods. Readiness gates traffic routing.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card/90 backdrop-blur-xl">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!name.trim()} className="shadow-lg shadow-primary/20 gap-2">
                <Zap className="w-4 h-4" /> Deploy Application
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
