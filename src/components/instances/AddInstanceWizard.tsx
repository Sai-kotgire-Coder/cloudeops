import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Server, Cloud, HardDrive, Network, Shield, Key, FileJson, CheckCircle2, CloudLightning, Plus, Trash2, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIAMStore } from '@/store/iam/iamStore';

const providers = [
  { id: 'aws', name: 'AWS', icon: Cloud },
  { id: 'gcp', name: 'GCP', icon: CloudLightning },
  { id: 'azure', name: 'Azure', icon: Server },
];

const images = [
  { id: 'ami-al2', name: 'Amazon Linux 2023 AMI', desc: 'Free tier eligible, x86_64, standard' },
  { id: 'ami-ubuntu', name: 'Ubuntu Server 24.04 LTS', desc: 'Free tier eligible, x86_64, popular' },
  { id: 'ami-windows', name: 'Microsoft Windows Server 2022 Base', desc: 'Standard enterprise environment' },
];

const instanceTypes = [
  { id: 't3.micro', vcpu: 2, ram: '1 GiB', net: 'Up to 5 Gigabit', price: '~$0.0104/hr', free: true },
  { id: 't3.small', vcpu: 2, ram: '2 GiB', net: 'Up to 5 Gigabit', price: '~$0.0208/hr', free: false },
  { id: 'm5.large', vcpu: 2, ram: '8 GiB', net: 'Up to 10 Gigabit', price: '~$0.0960/hr', free: false },
  { id: 'c5.xlarge', vcpu: 4, ram: '8 GiB', net: 'Up to 10 Gigabit', price: '~$0.1700/hr', free: false },
];

export function AddInstanceWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState('aws');
  const [image, setImage] = useState('ami-al2');
  const [instanceType, setInstanceType] = useState('t3.micro');
  
  // Security Group Rules
  const [sgRules, setSgRules] = useState([
    { id: 1, type: 'SSH', port: '22', source: '0.0.0.0/0' },
    { id: 2, type: 'HTTP', port: '80', source: '0.0.0.0/0' },
  ]);

  const { roles, managedPolicies, customPolicies } = useIAMStore();
  const [roleId, setRoleId] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);

  const selectedRole = roles.find(r => r.id === roleId);
  const rolePolicies = selectedRole 
    ? [...managedPolicies, ...customPolicies].filter(p => selectedRole.attachedPolicyIds.includes(p.id))
    : [];

  const addInstance = useGameStore(s => s.addInstance);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));
  
  const handleCreate = () => {
    addInstance(instanceType as any, roleId === '' ? undefined : roleId);
    setStep(0);
    onOpenChange(false);
  };

  const steps = [
    { title: 'OS & Provider', icon: Cloud },
    { title: 'Instance Type', icon: Server },
    { title: 'Network & SG', icon: Network },
    { title: 'Storage (EBS)', icon: HardDrive },
    { title: 'Advanced details', icon: Shield },
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setTimeout(() => setStep(0), 300);
    }}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[650px] flex flex-col bg-card text-card-foreground border-border overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Server className="w-5 h-5 text-primary" />
            Launch an Instance
          </DialogTitle>
          <DialogDescription>
            High-fidelity realistic deployment matching detailed cloud provider specifications.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex justify-between px-10 relative shrink-0 mt-2 mb-4">
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-secondary -z-10 -translate-y-1/2" />
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 bg-card px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= i ? 'border-primary bg-primary/20 text-primary flex-shrink-0' : 'border-muted-foreground/30 bg-secondary text-muted-foreground flex-shrink-0'
              } transition-colors bg-card`}>
                {step > i ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider hidden sm:block ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            
            {/* STAGE 1: OS Image & Provider */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">1. Select Cloud Provider</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {providers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        className={`panel relative p-4 flex flex-col items-center py-6 gap-3 transition-all ${
                          provider === p.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <p.icon className={`w-10 h-10 ${provider === p.id ? 'text-primary' : ''}`} />
                        <span className="font-semibold">{p.name}</span>
                        {provider === p.id && <CheckCircle2 className="w-5 h-5 text-primary absolute top-3 right-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">2. Application and OS Images (Amazon Machine Image)</h3>
                  <div className="space-y-3">
                    {images.map(img => (
                      <div 
                        key={img.id}
                        onClick={() => setImage(img.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-4 ${
                          image === img.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-secondary/20 hover:border-primary/50'
                        }`}
                      >
                        <div className="mt-1">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            image === img.id ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                            {image === img.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{img.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{img.desc}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-2">AMI ID: {img.id}-0abcdef1234567890</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 2: Instance Type */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Instance Type Selection</h3>
                  <div className="space-y-3">
                    {instanceTypes.map(type => (
                      <div 
                        key={type.id}
                        onClick={() => setInstanceType(type.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          instanceType === type.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-secondary/20 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            instanceType === type.id ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                            {instanceType === type.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold font-mono text-lg">{type.id}</p>
                              {type.free && <span className="bg-success/20 text-success text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Free Tier Eligible</span>}
                            </div>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span><strong className="text-foreground">{type.vcpu}</strong> vCPU</span>
                              <span><strong className="text-foreground">{type.ram}</strong> Memory</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium">{type.net}</p>
                          <p className="text-sm text-muted-foreground">{type.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-lg mb-3">Key pair (login)</h3>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <Label className="mb-2 block text-muted-foreground">Key pair name - required</Label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                      <option>prod-access-key</option>
                      <option>dev-ssh-key</option>
                      <option>Proceed without a key pair (Not recommended)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Key className="w-3 h-3" /> You can use this key pair to securely connect to your instance.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 3: Networking */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Network Settings</h3>
                  <div className="space-y-4 p-5 rounded-lg border border-border bg-secondary/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>VPC (Virtual Private Cloud)</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                          <option>vpc-0abcdef123 (default, 172.31.0.0/16)</option>
                          <option>vpc-custom (10.0.0.0/16)</option>
                          <option>Create new VPC</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subnet</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                          <option>No preference (default subnet in any AZ)</option>
                          <option>us-east-1a (172.31.0.0/20)</option>
                          <option>us-east-1b (172.31.16.0/20)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Auto-assign public IP</Label>
                      <select className="flex h-10 w-full sm:w-[50%] rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                        <option>Enable</option>
                        <option>Disable</option>
                        <option>Use subnet setting (Enable)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Firewall (Security groups)</h3>
                    <Button variant="outline" size="sm" onClick={() => setSgRules([...sgRules, {id: Date.now(), type: 'Custom', port: '8080', source: '0.0.0.0/0'}])}>
                      <Plus className="w-4 h-4 mr-1" /> Add Rule
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden bg-card text-sm">
                    <div className="grid grid-cols-[1fr_100px_1fr_40px] gap-4 p-3 bg-secondary/50 font-medium text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <div>Type</div>
                      <div>Port Range</div>
                      <div>Source</div>
                      <div></div>
                    </div>
                    {sgRules.map((rule, idx) => (
                      <div key={rule.id} className="grid grid-cols-[1fr_100px_1fr_40px] gap-4 p-3 items-center border-b last:border-0 border-border">
                        <Input defaultValue={rule.type} className="h-8 text-xs font-mono" />
                        <Input defaultValue={rule.port} className="h-8 text-xs font-mono px-2 text-center" />
                        <Input defaultValue={rule.source} className="h-8 text-xs font-mono" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setSgRules(sgRules.filter(r => r.id !== rule.id))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {sgRules.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">No inbound rules specifically established. High risk.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 4: Storage */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Configure Storage (EBS)</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-secondary/10 space-y-4">
                      <div className="flex gap-4 items-end flex-wrap">
                        <div className="space-y-2 flex-grow min-w-[200px]">
                          <Label>Volume 1 (Root)</Label>
                          <div className="flex items-center border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                            <Input defaultValue="8" className="border-0 h-10 w-full focus-visible:ring-0" type="number" />
                            <span className="px-3 text-muted-foreground border-l border-input bg-secondary/30 text-sm h-full flex items-center">GiB</span>
                          </div>
                        </div>
                        <div className="space-y-2 flex-grow min-w-[150px]">
                          <Label>Volume Type</Label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                            <option>gp3 (General Purpose SSD)</option>
                            <option>gp2 (General Purpose SSD)</option>
                            <option>io1 (Provisioned IOPS SSD)</option>
                            <option>Magnetic (Standard)</option>
                          </select>
                        </div>
                        <div className="space-y-2 flex-grow min-w-[150px]">
                          <Label>Device</Label>
                          <Input defaultValue="/dev/xvda" disabled className="h-10 text-muted-foreground font-mono" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="deleteOnTerm" defaultChecked />
                        <Label htmlFor="deleteOnTerm" className="text-sm cursor-pointer font-normal text-muted-foreground">Delete on termination</Label>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="mt-4 gap-2">
                    <Plus className="w-4 h-4" /> Add new volume
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STAGE 5: Advanced Details */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Advanced Details & IAM</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-secondary/10">
                      <div className="flex items-start justify-between">
                        <Label className="text-base font-semibold">IAM Instance Profile</Label>
                        <div className="group relative flex items-center justify-center cursor-help">
                          <Info className="w-4 h-4 text-muted-foreground" />
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border z-10">
                            IAM roles define what this instance is allowed to do. Incorrect roles may cause failures when the instance attempts to access other resources (e.g., S3).
                          </div>
                        </div>
                      </div>
                      
                      <select 
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none ${!roleId ? 'border-warning/50 focus:border-warning/50 focus:ring-warning/50' : 'border-input focus:border-primary'}`}
                      >
                        <option value="">Select a role... (None)</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                        ))}
                      </select>

                      {!roleId && (
                        <div className="flex items-center gap-2 text-warning bg-warning/10 p-3 rounded text-xs border border-warning/20">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <p><strong>Warning:</strong> Instance has no permissions. Actions requiring AWS access will fail.</p>
                        </div>
                      )}

                      {selectedRole && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">Role Preview</span>
                            <button 
                              onClick={() => setShowPolicy(!showPolicy)}
                              className="text-xs text-primary font-medium flex items-center hover:underline"
                            >
                              {showPolicy ? <><ChevronUp className="w-3 h-3 mr-1" /> Hide JSON</> : <><ChevronDown className="w-3 h-3 mr-1" /> View Policy JSON</>}
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {rolePolicies.map((p, pIdx) => (
                              <div key={pIdx} className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                                {p.name}
                              </div>
                            ))}
                          </div>

                          {showPolicy && (
                            <div className="bg-[#1e1e1e] p-3 rounded border border-border overflow-x-auto">
                              <pre className="text-xs text-[#d4d4d4] font-mono m-0">
                                {JSON.stringify({
                                  Role: selectedRole.name,
                                  Policies: rolePolicies.map(p => p.Statement)
                                }, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Metadata accessible</Label>
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-md bg-secondary/10">
                        <Checkbox id="imdsv2" defaultChecked />
                        <Label htmlFor="imdsv2" className="cursor-pointer font-medium text-sm leading-none">Require IMDSv2 (Recommended for security)</Label>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>User data</Label>
                        <div className="flex items-center text-xs text-muted-foreground gap-1"><FileJson className="w-3 h-3" /> Bash Script</div>
                      </div>
                      <textarea 
                        className="w-full h-32 rounded-md border border-input bg-[#1e1e1e] text-[#d4d4d4] p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        defaultValue={`#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho "Hello from CloudSimulator!" > /var/www/html/index.html`}
                        spellCheck="false"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex items-center justify-between px-6 py-4 border-t border-border bg-card shrink-0">
          <Button variant="outline" onClick={handleBack} disabled={step === 0} className="px-6">
            Previous
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} className="px-6 font-semibold shadow-md">
              Next Configuration
            </Button>
          ) : (
            <Button onClick={handleCreate} className="px-8 bg-success hover:bg-success/90 text-success-foreground font-bold tracking-wide shadow-lg shadow-success/20">
              Launch Instance
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
