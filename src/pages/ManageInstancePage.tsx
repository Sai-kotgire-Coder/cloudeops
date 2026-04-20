import { useEffect, useState } from 'react';
import { useGameStore, INSTANCE_TYPES, InstanceTypeId } from '@/store/gameStore';
import { TopNavBar } from '@/components/game/TopNavBar';
import { MetricsPanel } from '@/components/game/MetricsPanel';
import { ControlPanel } from '@/components/game/ControlPanel';
import { AlertOverlay } from '@/components/game/AlertOverlay';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { HintButton } from '@/components/game/HintButton';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Network, Shield, HardDrive, FileJson, CheckCircle2, Copy, Cpu, Plus, RotateCcw, LayoutDashboard, RefreshCw, Save, CheckCheck, Database, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIAMStore } from '@/store/iam/iamStore';

const TABS = [
  {
    id: 'dashboard', label: 'Dashboard & Controls', icon: LayoutDashboard,
    hint: 'Live traffic, CPU metrics, and all cluster control knobs — traffic slider, load balancer, ASG (HPA/VPA), and chaos engineering tools.'
  },
  {
    id: 'overview', label: 'Details', icon: Server,
    hint: 'Instance configuration details: hardware specs, IP addresses, instance type, and live utilization metrics. You can also change the instance type here for vertical scaling.',
    topicId: 'instances'
  },
  {
    id: 'network', label: 'Networking', icon: Network,
    hint: 'Security group inbound/outbound rules. Public rules (Port 22, 80) are security risks — restrict SSH to your IP range in production.'
  },
  {
    id: 'storage', label: 'Storage', icon: HardDrive,
    hint: 'Elastic Block Storage (EBS) volumes. gp3 is the modern standard. Increase volume size for applications with heavy disk I/O or large datasets.'
  },
  {
    id: 'iam', label: 'IAM & Security', icon: Shield,
    hint: 'IAM Roles define what AWS services this instance can call. Always use least-privilege access.',
    topicId: 'iam'
  },
];

export default function ManageInstancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedNewType, setSelectedNewType] = useState<InstanceTypeId | ''>('');

  const isRunning = useGameStore(s => s.isRunning);
  const simulationTick = useGameStore(s => s.simulationTick);
  const instances = useGameStore(s => s.instances);
  const changeInstanceType = useGameStore(s => s.changeInstanceType);
  const setInstanceRole = useGameStore(s => s.setInstanceRole);
  const instanceAccessStorage = useGameStore(s => s.instanceAccessStorage);
  
  const { roles, managedPolicies, customPolicies } = useIAMStore();

  const instance = instances.find(i => i.id === id);

  const role = instance ? roles.find(r => r.id === instance.roleId) : null;
  const rolePolicies = role ? [...managedPolicies, ...customPolicies].filter(p => role.attachedPolicyIds.includes(p.id)) : [];

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(simulationTick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, simulationTick]);

  useEffect(() => {
    if (instance) setSelectedNewType(instance.typeId);
  }, [instance?.typeId]);


  if (!instance) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopNavBar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Server className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Instance not found</h2>
          <p className="text-muted-foreground mb-6">The requested instance may have been terminated.</p>
          <Button onClick={() => navigate('/instances')}>Return to Instances</Button>
        </div>
      </div>
    );
  }

  const typeInfo = INSTANCE_TYPES[instance.typeId || (instance as any).type];

  // Safety check for typeInfo
  if (!typeInfo) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopNavBar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Instance type configuration missing</h2>
          <p className="text-muted-foreground mb-6">The instance type "{instance.typeId || (instance as any).type}" is not recognized.</p>
          <Button onClick={() => navigate('/instances')}>Return to Instances</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative w-full">
      <TopNavBar />

      {/* Configuration Header */}
      <div className="border-b border-border bg-card p-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/instances')}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{instance.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                instance.status === 'running' ? 'bg-success/20 text-success'
                : instance.status === 'provisioning' ? 'bg-warning/20 text-warning'
                : 'bg-destructive/20 text-destructive'
              }`}>
                {instance.status === 'provisioning' ? `Booting (${instance.provisionTimer}s)` : instance.status}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded text-xs font-mono text-muted-foreground">
                {instance.typeId} · {typeInfo.vcpu} vCPU · {typeInfo.ramGib} GiB · ${typeInfo.costPerHour.toFixed(4)}/hr
              </span>
            </div>
            <p className="font-mono text-sm text-muted-foreground mt-0.5">{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex" onClick={() => alert('Opens an SSH terminal session. In production, connect via AWS Session Manager for secure, agentless access.')}>Connect</Button>
          <Button variant="outline" onClick={() => alert('Instance State actions: Stop (pause billing), Reboot (graceful restart), or Terminate (permanent delete). Use Stop to save costs during off-hours.')}>Instance state ▾</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <div className="w-full md:w-56 border-r border-border bg-card/30 shrink-0 overflow-y-auto">
          <div className="p-3 flex flex-col gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                <HintButton hint={tab.hint} topicId={tab.topicId as any} />
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">

          {/* DASHBOARD TAB — stacked layout: metrics on top, controls below */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Cluster Dashboard & Traffic Controls</h2>
                <p className="text-muted-foreground mt-1">Manage global incoming RPM, load balancing, auto-scaling (HPA/VPA), and observe cluster metrics.</p>
              </div>

              {/* Metrics chart takes full width */}
              <div className="panel min-h-[300px]">
                <MetricsPanel />
              </div>

              {/* Controls panel below */}
              <div style={{ minHeight: 400 }}>
                <ControlPanel />
              </div>
            </div>
          )}

          {/* OVERVIEW / DETAILS TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold tracking-tight">Instance Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Instance details */}
                <div className="panel p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">Instance details</h3>
                  <div className="space-y-3 font-mono text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Instance ID</p>
                      <p className="flex items-center gap-2 break-all">{id} <Copy className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-primary flex-shrink-0" onClick={() => navigator.clipboard.writeText(id || '')} /></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">IPv4 Public IP</p>
                      <p className="text-primary font-bold">54.123.{((instance.id.charCodeAt(5) || 12) % 255)}.{((instance.id.charCodeAt(6) || 34) % 255)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">IPv4 Private IP</p>
                      <p>172.31.42.{((instance.id.charCodeAt(7) || 21) % 255)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Instance type</p>
                      <p>{instance.typeId}</p>
                    </div>
                  </div>
                </div>

                {/* Hardware / OS */}
                <div className="panel p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">Hardware / OS</h3>
                  <div className="space-y-3 font-mono text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">AMI ID</p>
                      <p className="text-primary hover:underline cursor-pointer">ami-0abcdef1234567890</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Platform</p>
                      <p>Amazon Linux 2023</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">vCPU / RAM</p>
                      <p className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {typeInfo.vcpu} vCPU / {typeInfo.ramGib} GiB</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Max Capacity</p>
                      <p className="text-primary font-bold">{INSTANCE_TYPES[instance.typeId].maxRps} RPS</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Hourly Cost</p>
                      <p>${typeInfo.costPerHour.toFixed(4)}/hr</p>
                    </div>
                  </div>
                </div>

                {/* Live utilization */}
                <div className="panel p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">Live Utilization</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-muted-foreground">CPU</span>
                        <span className={`font-mono font-bold ${instance.cpu > 80 ? 'text-destructive' : instance.cpu > 50 ? 'text-warning' : 'text-success'}`}>{instance.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${instance.cpu > 80 ? 'bg-destructive' : instance.cpu > 50 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.min(100, instance.cpu)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-muted-foreground">Memory</span>
                        <span className={`font-mono font-bold ${instance.memory > 85 ? 'text-destructive' : 'text-primary'}`}>{instance.memory.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${instance.memory > 85 ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, instance.memory)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-muted-foreground">Current Load</span>
                        <span className="font-mono font-bold">{instance.currentRps} / {typeInfo.maxRps} RPS</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${instance.currentRps > typeInfo.maxRps * 0.8 ? 'bg-destructive' : 'bg-accent'}`}
                          style={{ width: `${Math.min(100, (instance.currentRps / typeInfo.maxRps) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Scaling — Change Instance Type */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold">Vertical Scaling — Change Instance Type</h3>
                  <HintButton hint="Vertical scaling means upgrading the hardware of this specific server. Larger types handle more RPS but cost more per hour. The instance will reboot with a ~5s cold start." />
                </div>
                <p className="text-sm text-muted-foreground">Upgrade or downgrade this instance's hardware. The server will reboot to apply the change.</p>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(INSTANCE_TYPES) as InstanceTypeId[]).map(t => {
                    const info = INSTANCE_TYPES[t];
                    const isCurrent = t === instance.typeId;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedNewType(t)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedNewType === t
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/10 hover:border-primary/50'
                        }`}
                      >
                        <p className="font-mono font-bold text-sm flex items-center gap-2">
                          {t}
                          {isCurrent && <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.vcpu}vCPU · {info.ramGib}GiB · {info.maxRps} RPS</p>
                        <p className="text-xs text-primary font-bold mt-1">${info.costPerHour.toFixed(4)}/hr</p>
                      </button>
                    );
                  })}
                </div>
                <Button
                  disabled={!selectedNewType || selectedNewType === instance.typeId}
                  onClick={() => selectedNewType && changeInstanceType(instance.id, selectedNewType)}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Apply Change & Reboot to {selectedNewType || '...'}
                </Button>
              </div>
            </div>
          )}

          {/* NETWORKING TAB */}
          {activeTab === 'network' && (
            <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold tracking-tight">Networking Configuration</h2>
              <div className="panel p-6">
                <h3 className="text-lg font-semibold mb-4">Security Groups</h3>
                <div className="flex items-center gap-2 mb-4 font-mono text-sm bg-secondary/30 p-2 rounded-md border border-border inline-flex">
                  <span className="text-muted-foreground">Attached group:</span>
                  <span className="text-primary cursor-pointer hover:underline">sg-0987654321fedcba</span>
                  <span>(launch-wizard-1)</span>
                </div>

                <h4 className="font-medium text-sm mt-6 mb-2">Inbound rules</h4>
                <div className="rounded-lg border border-border overflow-hidden bg-card text-sm w-full">
                  <div className="grid grid-cols-[100px_100px_1fr_150px] gap-4 p-3 bg-secondary/50 font-bold uppercase tracking-wider text-muted-foreground text-xs border-b border-border">
                    <div>Type</div><div>Port</div><div>Source</div><div>Risk Level</div>
                  </div>
                  {[
                    { type: 'SSH', port: '22', source: '0.0.0.0/0', risk: 'High' },
                    { type: 'HTTP', port: '80', source: '0.0.0.0/0', risk: 'Medium' },
                    { type: 'HTTPS', port: '443', source: '0.0.0.0/0', risk: 'Low' },
                    { type: 'Custom TCP', port: '8080', source: 'sg-internal', risk: 'None' },
                  ].map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-[100px_100px_1fr_150px] gap-4 p-3 border-b border-border last:border-0 items-center">
                      <div className="font-medium">{rule.type}</div>
                      <div className="font-mono">{rule.port}</div>
                      <div className="font-mono text-xs">{rule.source}</div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          rule.risk === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : rule.risk === 'Medium' ? 'bg-warning/10 text-warning border-warning/20'
                            : rule.risk === 'Low' ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-success/10 text-success border-success/20'
                        }`}>{rule.risk === 'None' ? 'Private ✓' : `${rule.risk} Risk`}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-warning mt-3">⚠ SSH (port 22) open to 0.0.0.0/0 is a security risk. Restrict to your IP or use SSM Session Manager.</p>
              </div>
            </div>
          )}

          {/* STORAGE TAB */}
          {activeTab === 'storage' && (
            <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold tracking-tight">EBS Volumes</h2>

              <div className="space-y-4">
                <div className="panel p-5 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <HardDrive className="w-10 h-10 text-primary shrink-0" />
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Volume ID</p>
                      <p className="font-mono text-primary hover:underline cursor-pointer">vol-0abcdef123</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Device</p>
                      <p className="font-mono">/dev/xvda</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Size & Type</p>
                      <p className="font-bold">8 GiB (gp3)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Status</p>
                      <p className="text-success font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> In-use</p>
                    </div>
                  </div>
                </div>

                <div className="panel p-5 flex flex-col sm:flex-row gap-6 items-start sm:items-center border-dashed border-2">
                  <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">Attach new volume</p>
                    <p className="text-xs text-muted-foreground">Add additional EBS volumes for data storage, databases, or logs.</p>
                  </div>
                  <Button variant="outline" onClick={() => alert('Creates a new EBS volume and attaches it. Choose between gp3 (general), io2 (high IOPS for databases), or st1 (throughput for big data).')}>Create & Attach Volume</Button>
                </div>
              </div>
            </div>
          )}

          {/* IAM TAB */}
          {activeTab === 'iam' && (
            <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Identity and Access Management (IAM)</h2>
                <p className="text-muted-foreground mt-1">Manage the role attached to this instance. The role determines what AWS services this instance can securely access.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 p-5 bg-card border border-border rounded-lg shrink-0">
                <div className="flex items-center gap-4 flex-1">
                  <Shield className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Attached Role</p>
                    <p className="font-mono text-primary font-bold">{role ? role.name : 'None'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{role ? role.description : 'No IAM role attached.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:border-l sm:border-border sm:pl-4">
                  <select 
                    value={instance.roleId || ''}
                    onChange={(e) => setInstanceRole(instance.id, e.target.value)}
                    className="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">None</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {!role && (
                <div className="flex items-center gap-2 text-warning bg-warning/10 p-4 rounded-md border border-warning/20 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p><strong>Warning:</strong> No role attached. The instance will be denied access to all AWS resources (S3, DynamoDB, etc.).</p>
                </div>
              )}

              <div className="panel p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" /> Test Actions
                    <HintButton topicId="iam" hint="Click these to simulate the instance attempting to access S3. The request will fail if the attached role does not have the required s3 permissions." />
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">Simulate the application code on {instance.name} making API requests to S3.</p>
                
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => instanceAccessStorage(instance.id, 'read')} className="gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" /> Test S3 Read
                  </Button>
                  <Button variant="outline" onClick={() => instanceAccessStorage(instance.id, 'write')} className="gap-2">
                    <Plus className="w-4 h-4 text-primary" /> Test S3 Write
                  </Button>
                  <Button variant="outline" onClick={() => instanceAccessStorage(instance.id, 'delete')} className="gap-2 border-destructive/20 hover:bg-destructive/10">
                    <RotateCcw className="w-4 h-4 text-destructive" /> Test S3 Delete
                  </Button>
                </div>
              </div>

              {role && (
                <div className="flex-1 flex flex-col panel border border-border shadow-sm overflow-hidden" style={{ minHeight: 400 }}>
                  <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2 shrink-0">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <FileJson className="w-4 h-4" /> Read-only Policy Preview
                    </h3>
                  </div>
                  <div className="flex-1 bg-[#1e1e1e] p-4 text-[#d4d4d4] font-mono text-xs overflow-auto">
                     <pre className="m-0">
                       {JSON.stringify({
                         Role: role.name,
                         Policies: rolePolicies.map(p => ({
                           PolicyName: p.name,
                           Statement: p.Statement
                         }))
                       }, null, 2)}
                     </pre>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <AlertOverlay />
      <TutorialOverlay />
    </div>
  );
}
