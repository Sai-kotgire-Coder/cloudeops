import { useEffect, useState } from 'react';
import { Zap, BookOpen, Ban, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVaultStore, getEngineDef } from '@/store/vaultStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

const TTL_OPTIONS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
];

interface DynamicSecretsPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const DynamicSecretsPanel = ({ onLearnMore }: DynamicSecretsPanelProps) => {
  const { engines, leases, generateLease, revokeLease } = useVaultStore();
  const dynamicEngines = engines.filter((e) => e.typeId !== 'kv');

  const [engineId, setEngineId] = useState('');
  const [role, setRole] = useState('readonly');
  const [ttlSeconds, setTtlSeconds] = useState(60);
  // Leases expire purely based on wall-clock time (createdAt + ttlSeconds) --
  // this tick just forces a re-render every second so the countdown/expired
  // badge stays live without the user needing to refresh.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeEngineId = engineId || dynamicEngines[0]?.id || '';

  const handleGenerate = () => {
    if (!activeEngineId) return;
    generateLease(activeEngineId, role, ttlSeconds);
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Dynamic Secrets</h3>
            <p className="text-sm text-gray-400">Generate short-lived credentials that expire on their own</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('vaultSecretsEngine')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      {dynamicEngines.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          Enable a dynamic engine above (e.g. "Dynamic Database Credentials") to generate a short-lived credential here.
        </p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={activeEngineId} onValueChange={setEngineId}>
              <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white sm:w-48 shrink-0">
                <SelectValue placeholder="engine" />
              </SelectTrigger>
              <SelectContent>
                {dynamicEngines.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.path}/ ({getEngineDef(e.typeId)?.label})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="role (e.g. readonly)"
              value={role}
              onChange={(ev) => setRole(ev.target.value)}
              className="bg-[#1e293b] border-gray-700 text-white flex-1 font-mono"
            />
            <Select value={String(ttlSeconds)} onValueChange={(v) => setTtlSeconds(parseInt(v, 10))}>
              <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white sm:w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTL_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            Generate Credential
          </Button>
        </>
      )}

      <div className="space-y-2 pt-2 border-t border-gray-800">
        {leases.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2 text-center">No dynamic credentials generated yet.</p>
        )}
        {leases.map((lease) => {
          const remainingMs = lease.createdAt + lease.ttlSeconds * 1000 - Date.now();
          const expired = remainingMs <= 0;
          const status = lease.revoked ? 'revoked' : expired ? 'expired' : 'active';
          const remainingLabel = status === 'active'
            ? `${Math.floor(remainingMs / 1000 / 60)}:${String(Math.floor((remainingMs / 1000) % 60)).padStart(2, '0')}`
            : null;

          return (
            <div key={lease.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-cyan-400">
                  {lease.username}
                </span>
                <div className="flex items-center gap-2">
                  {status === 'active' && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/30 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {remainingLabel}
                    </span>
                  )}
                  {status === 'expired' && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-500/10 border border-gray-600 rounded px-1.5 py-0.5">
                      Expired
                    </span>
                  )}
                  {status === 'revoked' && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5">
                      Revoked
                    </span>
                  )}
                  {status === 'active' && (
                    <button
                      onClick={() => revokeLease(lease.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                      title="Revoke early"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="pl-2 mt-1.5 space-y-0.5">
                <p className="text-xs font-mono text-gray-400">
                  <span className="text-sky-300">role</span> = <span className="text-green-400">{lease.role}</span>
                </p>
                <p className="text-xs font-mono text-gray-400">
                  <span className="text-sky-300">password</span> = <span className="text-green-400">{status === 'active' ? lease.password : '••••••••••••'}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
