import React from 'react';
import { useIAMStore, useUserPolicies } from '@/store/iam/iamStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, Key, Plus, Trash2, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const IAMPage = () => {
  const { managedPolicies, customPolicies, currentUserRoleId, attachPolicyToRole, detachPolicyFromRole } = useIAMStore();
  const userPolicies = useUserPolicies();
  // Policies attached to whichever role represents "the current user" --
  // there's no separate per-user attachment list, only per-role.
  const attachedPolicyIds = userPolicies.map((p) => p.id);

  const handleAttach = (id: string, name: string) => {
    attachPolicyToRole(currentUserRoleId, id);
    toast.success(`Policy Attached: ${name}`);
  };

  const handleDetach = (id: string, name: string) => {
    if (attachedPolicyIds.length <= 1) {
      toast.error("Cannot detach the last policy. You must have at least one policy attached to maintain access.");
      return;
    }
    detachPolicyFromRole(currentUserRoleId, id);
    toast.info(`Policy Detached: ${name}`);
  };

  const PolicyCard = ({ policy, isAttached }: { policy: any, isAttached: boolean }) => (
    <Card className={`mb-4 border-l-4 ${isAttached ? 'border-l-primary' : 'border-l-muted'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {policy.isManaged ? <ShieldCheck className="w-4 h-4 text-blue-500" /> : <Key className="w-4 h-4 text-orange-500" />}
            <CardTitle className="text-sm font-bold">{policy.name}</CardTitle>
            {policy.isManaged && <Badge variant="secondary" className="text-[10px] h-4">Managed</Badge>}
          </div>
          {isAttached ? (
            <Button variant="outline" size="sm" onClick={() => handleDetach(policy.id, policy.name)} className="h-7 text-xs text-destructive hover:text-destructive">
              Detach
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => handleAttach(policy.id, policy.name)} className="h-7 text-xs">
              Attach
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">{policy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 p-2 rounded text-[10px] font-mono whitespace-pre overflow-x-auto max-h-32">
          {JSON.stringify({ Version: policy.Version, Statement: policy.Statement }, null, 2)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Identity & Access Management</h1>
          <p className="text-muted-foreground mt-1">Manage simulator permissions and access policies.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="text-primary w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current User</div>
            <div className="text-sm font-bold">Simulator-Admin</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-sidebar">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Active Identity
              </CardTitle>
              <CardDescription>Policies currently defining your permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPolicies.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-background border text-xs">
                    <span className="font-semibold truncate pr-2">{p.name}</span>
                    <Badge variant={p.isManaged ? "outline" : "default"}>{p.isManaged ? "AWS" : "Custom"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <div className="flex gap-2 items-start">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-[11px] text-blue-500/90 leading-tight">
                    Explicit <strong>Deny</strong> statements in any policy will override all <strong>Allow</strong> statements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-sidebar border">
              <TabsTrigger value="available">Available Policies</TabsTrigger>
              <TabsTrigger value="custom">Custom Policies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="available" className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                {managedPolicies.map(p => (
                  <PolicyCard key={p.id} policy={p} isAttached={attachedPolicyIds.includes(p.id)} />
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {customPolicies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg opacity-50">
                    <Key className="w-12 h-12 mb-4" />
                    <p className="text-sm font-medium">No custom policies created yet</p>
                    <p className="text-xs text-center mt-1">Create a custom policy using the simulation CLI or the editor below.</p>
                  </div>
                ) : (
                  customPolicies.map(p => (
                    <PolicyCard key={p.id} policy={p} isAttached={attachedPolicyIds.includes(p.id)} />
                  ))
                )}
              </ScrollArea>
              
              <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Custom Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">You can create custom policies to restrict or allow specific actions like <code>cloudsim:RunInstances</code> on specific resources.</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => toast("Advanced Policy Editor coming soon!")}>
                    Open Visual Editor
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default IAMPage;
