// Turns each module's flat completion counter into a labeled 3-step
// path, so "complete this module" reads as a small curriculum instead of
// an arbitrary "do the thing N times." Purely presentational -- steps are
// checked off against the same current/target numbers GET
// /api/progress/summary already returns, so no backend changes were
// needed to add this.
export interface CurriculumStep {
  title: string;
  description: string;
  // Fraction of the module's target (0-1) at which this step counts as done.
  atFraction: number;
}

export const MODULE_CURRICULA: Record<string, CurriculumStep[]> = {
  terraform: [
    { title: 'Write and apply your first resource', description: 'Author a resource block and run your first apply -- see it show up in state.', atFraction: 1 / 3 },
    { title: 'Iterate on your config', description: 'Change your config and re-apply -- watch Terraform compute a diff instead of starting over.', atFraction: 2 / 3 },
    { title: 'Handle drift', description: 'Cause drift, see it detected, and reconcile it back to your declared config.', atFraction: 1 },
  ],
  ansible: [
    { title: 'Build an inventory and run a playbook', description: 'Target a host group and converge it to your first declared state.', atFraction: 1 / 3 },
    { title: 'Re-run for idempotency', description: 'Run the same playbook again -- confirm it reports no unintended changes on an already-converged host.', atFraction: 2 / 3 },
    { title: 'Recover from drift', description: 'Let a host drift from its declared state, then re-run the playbook to converge it back.', atFraction: 1 },
  ],
  vault: [
    { title: 'Enable an engine and write a secret', description: 'Turn on a secrets engine and write your first KV secret.', atFraction: 1 / 5 },
    { title: 'Write a policy and issue a token', description: "Scope a policy to a path, then issue a token that's bound by it.", atFraction: 3 / 5 },
    { title: 'Prove access control works', description: 'Confirm an allowed read succeeds and an out-of-policy request is denied.', atFraction: 1 },
  ],
  kubectl: [
    { title: 'Inspect the cluster', description: 'Use get/describe to see the Pods and Deployments already running.', atFraction: 3 / 10 },
    { title: 'Declare and roll out a change', description: 'Apply a manifest change and watch a rollout happen.', atFraction: 6 / 10 },
    { title: 'Troubleshoot and roll back', description: 'Diagnose a failing Pod and use rollout undo to recover.', atFraction: 1 },
  ],
  gitops: [
    { title: 'Link an Application to Git', description: 'Point a GitOps Application at a real app already running in the simulator.', atFraction: 1 / 3 },
    { title: 'Commit and sync', description: 'Commit a change to desired state and sync it into the live cluster.', atFraction: 2 / 3 },
    { title: 'See Self-Heal correct drift', description: 'Cause drift on a synced Application and watch it reconcile back automatically.', atFraction: 1 },
  ],
  monitoring: [
    // The completion counter is min(panelCount, ruleCount) against a target
    // of 2 -- reaching each fraction genuinely requires at least that many
    // of BOTH a panel and a rule, not just one or the other.
    { title: 'Chart your first metric and author your first rule', description: "Build a dashboard panel against a real metric, and set a threshold rule on one too.", atFraction: 1 / 2 },
    { title: 'Build a second panel and rule', description: 'Add a second panel and a second rule -- breadth across more of your live metrics.', atFraction: 1 },
    { title: 'Tune for signal, not noise', description: "Adjust a rule so it's specific enough to matter without paging on normal fluctuations.", atFraction: 1 },
  ],
};
