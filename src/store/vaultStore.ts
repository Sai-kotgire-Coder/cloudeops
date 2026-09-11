import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

export interface SecretsEngineDef {
  id: string;
  label: string;
  description: string;
  defaultPath: string;
}

// 10 real Vault secrets engines -- static key/value storage, dynamic
// short-lived credentials for clouds/databases, and specialized engines for
// certificates, encryption, SSH, and OTP.
export const SECRETS_ENGINE_CATALOG: SecretsEngineDef[] = [
  { id: 'kv', label: 'Key/Value Store (v2)', defaultPath: 'secret', description: 'Versioned static key/value secret storage -- the most common engine, used for API keys, passwords, and config.' },
  { id: 'database', label: 'Dynamic Database Credentials', defaultPath: 'database', description: 'Generates short-lived, unique database credentials on demand instead of sharing one static password.' },
  { id: 'pki', label: 'PKI Certificates', defaultPath: 'pki', description: 'Issues short-lived TLS certificates on demand from an internal certificate authority.' },
  { id: 'transit', label: 'Encryption as a Service', defaultPath: 'transit', description: 'Encrypts and decrypts data for applications without them ever holding the encryption key.' },
  { id: 'aws', label: 'AWS Dynamic Credentials', defaultPath: 'aws', description: 'Generates short-lived AWS IAM credentials on demand, scoped to exactly what\'s needed.' },
  { id: 'gcp', label: 'GCP Dynamic Credentials', defaultPath: 'gcp', description: 'Generates short-lived Google Cloud service account credentials on demand.' },
  { id: 'azure', label: 'Azure Dynamic Credentials', defaultPath: 'azure', description: 'Generates short-lived Azure service principal credentials on demand.' },
  { id: 'ssh', label: 'SSH One-Time Passwords', defaultPath: 'ssh', description: 'Issues one-time-use SSH credentials instead of distributing shared SSH keys.' },
  { id: 'totp', label: 'Time-Based One-Time Passwords', defaultPath: 'totp', description: 'Generates and validates TOTP codes, the same mechanism behind most 2FA apps.' },
  { id: 'transform', label: 'Data Masking & Tokenization', defaultPath: 'transform', description: 'Tokenizes or masks sensitive data (like card numbers) so raw values never leave Vault.' },
];

export function getEngineDef(engineTypeId: string): SecretsEngineDef | undefined {
  return SECRETS_ENGINE_CATALOG.find((e) => e.id === engineTypeId);
}

export interface SecretsEngine {
  id: string;
  typeId: string;
  path: string;
}

export interface SecretVersion {
  version: number;
  kv: Record<string, string>;
  timestamp: number;
}

export interface Secret {
  id: string;
  engineId: string;
  path: string; // e.g. "myapp/config", mounted under the engine's path
  versions: SecretVersion[]; // last item is current
}

export type Capability = 'read' | 'create' | 'update' | 'delete' | 'list';

export interface Policy {
  id: string;
  name: string;
  pathPattern: string; // e.g. "secret/data/myapp/*"
  capabilities: Capability[];
}

export interface VaultToken {
  id: string;
  name: string;
  policyIds: string[];
}

export interface AccessAttempt {
  tokenId: string | null;
  tokenName: string;
  secretId: string;
  fullPath: string;
  allowed: boolean;
  matchedPolicy?: string;
}

export interface WorkspaceEvent {
  id: string;
  kind: 'write' | 'allow' | 'deny';
  message: string;
  timestamp: number;
}

function pathMatches(pattern: string, path: string): boolean {
  if (pattern === path) return true;
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1); // keep trailing slash
    return path.startsWith(prefix);
  }
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix);
  }
  return false;
}

function fullSecretPath(engine: SecretsEngine, secret: Secret): string {
  return `${engine.path}/data/${secret.path}`;
}

interface VaultState {
  engines: SecretsEngine[];
  secrets: Secret[];
  policies: Policy[];
  tokens: VaultToken[];
  history: WorkspaceEvent[];
  accessCount: number;
  lastAccess: AccessAttempt | null;

  enableEngine: (typeId: string, path: string) => void;
  disableEngine: (id: string) => void;
  writeSecret: (engineId: string, path: string, kv: Record<string, string>) => void;
  rollbackSecret: (secretId: string, version: number) => void;
  removeSecret: (id: string) => void;
  addPolicy: (name: string, pathPattern: string, capabilities: Capability[]) => void;
  removePolicy: (id: string) => void;
  addToken: (name: string, policyIds: string[]) => void;
  removeToken: (id: string) => void;
  attemptAccess: (tokenId: string, secretId: string) => void;
  hydrate: (data: {
    engines?: SecretsEngine[];
    secrets?: Secret[];
    policies?: Policy[];
    tokens?: VaultToken[];
    history?: WorkspaceEvent[];
    accessCount?: number;
  }) => void;
}

function syncToBackend(get: () => VaultState) {
  const { engines, secrets, policies, tokens, history, accessCount } = get();
  apiClient
    .updateVaultWorkspace({
      secretCount: secrets.length,
      accessCount,
      engines,
      secrets,
      policies,
      tokens,
      history,
    })
    .catch((err) => console.error('Failed to sync vault workspace:', err));
}

export const useVaultStore = create<VaultState>()((set, get) => ({
  engines: [],
  secrets: [],
  policies: [],
  tokens: [],
  history: [],
  accessCount: 0,
  lastAccess: null,

  enableEngine: (typeId, path) => {
    const def = getEngineDef(typeId);
    if (!def) return;
    const engine: SecretsEngine = {
      id: crypto.randomUUID(),
      typeId,
      path: path.trim() || def.defaultPath,
    };
    set((s) => ({ engines: [...s.engines, engine] }));
    toast.success(`Enabled ${def.label} at ${engine.path}/`);
    syncToBackend(get);
  },

  disableEngine: (id) => {
    set((s) => ({
      engines: s.engines.filter((e) => e.id !== id),
      secrets: s.secrets.filter((sec) => sec.engineId !== id),
    }));
    syncToBackend(get);
  },

  writeSecret: (engineId, path, kv) => {
    const { secrets, history } = get();
    const cleanPath = path.trim().replace(/^\/+/, '');
    const existing = secrets.find((s) => s.engineId === engineId && s.path === cleanPath);

    let updated: Secret[];
    let versionNum: number;
    if (existing) {
      versionNum = existing.versions.length + 1;
      const newVersion: SecretVersion = { version: versionNum, kv, timestamp: Date.now() };
      updated = secrets.map((s) => (s.id === existing.id ? { ...s, versions: [...s.versions, newVersion] } : s));
    } else {
      versionNum = 1;
      const secret: Secret = {
        id: crypto.randomUUID(),
        engineId,
        path: cleanPath || 'secret',
        versions: [{ version: 1, kv, timestamp: Date.now() }],
      };
      updated = [...secrets, secret];
    }

    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'write',
      message: `Wrote "${cleanPath}" (version ${versionNum})`,
      timestamp: Date.now(),
    };

    set({ secrets: updated, history: [event, ...history].slice(0, 20) });
    toast.success(`Secret written — version ${versionNum}`);
    syncToBackend(get);
  },

  rollbackSecret: (secretId, version) => {
    const { secrets, history } = get();
    const secret = secrets.find((s) => s.id === secretId);
    const target = secret?.versions.find((v) => v.version === version);
    if (!secret || !target) return;

    const newVersionNum = secret.versions.length + 1;
    const rolledBack: SecretVersion = { version: newVersionNum, kv: target.kv, timestamp: Date.now() };
    const updated = secrets.map((s) => (s.id === secretId ? { ...s, versions: [...s.versions, rolledBack] } : s));

    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'write',
      message: `Rolled back "${secret.path}" to version ${version} (now version ${newVersionNum})`,
      timestamp: Date.now(),
    };

    set({ secrets: updated, history: [event, ...history].slice(0, 20) });
    toast.success(`Rolled back to version ${version}`);
    syncToBackend(get);
  },

  removeSecret: (id) => {
    set((s) => ({ secrets: s.secrets.filter((sec) => sec.id !== id) }));
    syncToBackend(get);
  },

  addPolicy: (name, pathPattern, capabilities) => {
    const policy: Policy = {
      id: crypto.randomUUID(),
      name: name.trim() || `policy-${get().policies.length + 1}`,
      pathPattern: pathPattern.trim(),
      capabilities,
    };
    set((s) => ({ policies: [...s.policies, policy] }));
    toast.info(`Policy "${policy.name}" created`);
    syncToBackend(get);
  },

  removePolicy: (id) => {
    set((s) => ({
      policies: s.policies.filter((p) => p.id !== id),
      tokens: s.tokens.map((t) => ({ ...t, policyIds: t.policyIds.filter((pid) => pid !== id) })),
    }));
    syncToBackend(get);
  },

  addToken: (name, policyIds) => {
    const token: VaultToken = {
      id: crypto.randomUUID(),
      name: name.trim() || `token-${get().tokens.length + 1}`,
      policyIds,
    };
    set((s) => ({ tokens: [...s.tokens, token] }));
    toast.info(`Token "${token.name}" created`);
    syncToBackend(get);
  },

  removeToken: (id) => {
    set((s) => ({ tokens: s.tokens.filter((t) => t.id !== id) }));
    syncToBackend(get);
  },

  attemptAccess: (tokenId, secretId) => {
    const { tokens, secrets, engines, policies, history, accessCount } = get();
    const token = tokens.find((t) => t.id === tokenId);
    const secret = secrets.find((s) => s.id === secretId);
    const engine = secret ? engines.find((e) => e.id === secret.engineId) : undefined;
    if (!token || !secret || !engine) return;

    const path = fullSecretPath(engine, secret);
    const tokenPolicies = policies.filter((p) => token.policyIds.includes(p.id));
    const matched = tokenPolicies.find(
      (p) => p.capabilities.includes('read') && pathMatches(p.pathPattern, path)
    );

    const attempt: AccessAttempt = {
      tokenId: token.id,
      tokenName: token.name,
      secretId: secret.id,
      fullPath: path,
      allowed: !!matched,
      matchedPolicy: matched?.name,
    };

    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: matched ? 'allow' : 'deny',
      message: matched
        ? `"${token.name}" read "${path}" — allowed by policy "${matched.name}"`
        : `"${token.name}" was denied reading "${path}" — no attached policy grants read on that path`,
      timestamp: Date.now(),
    };

    set({
      lastAccess: attempt,
      history: [event, ...history].slice(0, 20),
      accessCount: accessCount + 1,
    });

    if (matched) {
      toast.success(`Allowed — read access granted by "${matched.name}"`);
    } else {
      toast.error('Error: permission denied');
    }
    syncToBackend(get);
  },

  hydrate: (data) => {
    set({
      engines: data.engines ?? [],
      secrets: data.secrets ?? [],
      policies: data.policies ?? [],
      tokens: data.tokens ?? [],
      history: data.history ?? [],
      accessCount: data.accessCount ?? 0,
      lastAccess: null,
    });
  },
}));

export { fullSecretPath };
