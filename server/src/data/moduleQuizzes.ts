// Short knowledge-check quizzes gating certificate issuance. Kept
// server-side only (never sent to the client with correctIndex attached --
// see GET /api/progress/:module/quiz) so the answer key can't just be read
// out of the frontend bundle. Each module has exactly 4 questions; passing
// is 3/4 (see PASSING_SCORE in progress.ts) -- deliberately generous for a
// learning tool, not a certification exam.
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const MODULE_QUIZZES: Record<string, QuizQuestion[]> = {
  terraform: [
    {
      id: 'tf-1',
      question: "What does `terraform apply` do that `terraform plan` does not?",
      options: [
        'Shows the diff without making changes',
        'Actually creates, updates, or destroys real resources to match your config',
        'Deletes the state file',
        'Only validates syntax',
      ],
      correctIndex: 1,
      explanation: '`plan` is a dry run that shows what would change. `apply` is what actually executes those changes against real infrastructure.',
    },
    {
      id: 'tf-2',
      question: 'Someone manually changes a resource outside of Terraform (e.g. resizing it directly in the cloud console). What is this called?',
      options: ['Drift', 'A rollback', 'A plan', 'Provisioning'],
      correctIndex: 0,
      explanation: 'Drift is any gap between your Terraform state/config and what actually exists -- the next plan will show it as a change to reconcile.',
    },
    {
      id: 'tf-3',
      question: 'What is the Terraform state file actually for?',
      options: [
        "It's just a log of commands you've run",
        'It tracks the real-world resources Terraform manages and their last-known configuration, so it knows what to change on the next apply',
        "It stores your cloud provider's credentials",
        'It backs up your .tf source files',
      ],
      correctIndex: 1,
      explanation: 'Without state, Terraform would have no way to map your config back to the specific real resources it already created.',
    },
    {
      id: 'tf-4',
      question: 'You delete a resource block from your .tf config and run apply. What happens?',
      options: [
        'Nothing -- Terraform ignores removed blocks',
        "Terraform destroys that resource, since it's no longer part of the desired state",
        'Terraform asks you to delete it manually first',
        'The apply fails with an error',
      ],
      correctIndex: 1,
      explanation: "Terraform's whole model is reconciling reality to match your config -- removing a block means \"this shouldn't exist anymore,\" so apply destroys it.",
    },
  ],
  ansible: [
    {
      id: 'an-1',
      question: "What makes a playbook 'idempotent'?",
      options: [
        'It can only ever be run once',
        'Running it repeatedly against the same hosts converges to the same end state without unintended side effects',
        'It requires no inventory file',
        'It always fails on the second run',
      ],
      correctIndex: 1,
      explanation: 'Idempotency is what makes it safe to re-run a playbook constantly (e.g. on a schedule) without worrying it will "double-apply" or break something.',
    },
    {
      id: 'an-2',
      question: 'What is an inventory in Ansible?',
      options: [
        'A list of installed packages',
        'The list of hosts (and groups of hosts) a playbook targets',
        'A record of past playbook runs',
        'A type of variable file',
      ],
      correctIndex: 1,
      explanation: 'The inventory answers "which machines does this playbook apply to" -- separate from the playbook itself, which answers "what should be true on them."',
    },
    {
      id: 'an-3',
      question: "A host's configuration has drifted from what the playbook declares. What happens next time you run that playbook against it?",
      options: [
        'The run fails until you manually fix the drift first',
        'The playbook re-applies its tasks and converges that host back to the declared state',
        'Ansible automatically reverts to the previous playbook version',
        "Nothing -- Ansible doesn't check existing state",
      ],
      correctIndex: 1,
      explanation: 'This self-correcting behavior on re-run is exactly what makes configuration management useful for fixing drift, not just initial provisioning.',
    },
    {
      id: 'an-4',
      question: "A task's module reports 'changed' every single run, even when nothing on the host actually changed. Why is that a problem?",
      options: [
        "It isn't a problem, that's expected",
        'It breaks idempotency as a signal -- you can no longer tell a real change from a no-op, which erodes trust in the playbook output',
        'It makes the playbook run faster',
        'It means the host is missing from inventory',
      ],
      correctIndex: 1,
      explanation: '"Changed" is supposed to mean "I just did something." If it fires on every run regardless, you lose the ability to spot real, meaningful changes in the output.',
    },
  ],
  vault: [
    {
      id: 'va-1',
      question: "What is a Vault 'secrets engine'?",
      options: [
        'A UI for browsing secrets',
        'A pluggable backend that stores or generates one specific type of secret (e.g. a KV store, or dynamic database credentials)',
        'The encryption algorithm Vault uses internally',
        'A synonym for a token',
      ],
      correctIndex: 1,
      explanation: 'Different engines solve different problems -- KV just stores what you give it, while a dynamic engine (e.g. database) generates short-lived credentials on demand.',
    },
    {
      id: 'va-2',
      question: 'Why does KV version 2 keep old versions of a secret instead of overwriting them?',
      options: [
        "It doesn't -- versioning is purely cosmetic",
        'So you can audit a past value and roll back to a previous version if a bad one was written',
        'To save disk space',
        'Vault requires immutability by design, with no exceptions',
      ],
      correctIndex: 1,
      explanation: "Being able to see (and revert to) a secret's history is exactly the safety net you want when someone accidentally overwrites a working credential.",
    },
    {
      id: 'va-3',
      question: 'What does a Vault policy actually control?',
      options: [
        'Which secrets engines exist',
        'Which paths a token can read/write/list, and with which capabilities',
        'How long Vault stays unsealed',
        'The web UI theme',
      ],
      correctIndex: 1,
      explanation: 'Policies are the access-control layer -- a token is only as powerful as the policies attached to it.',
    },
    {
      id: 'va-4',
      question: "A token's policy grants only 'read' on a path. What happens if that token tries to write to it?",
      options: [
        'It succeeds -- read implies write',
        'Vault denies the request -- capabilities are explicit, never implied',
        'Vault silently ignores the write',
        'The token is automatically revoked',
      ],
      correctIndex: 1,
      explanation: "Vault's access model is deny-by-default and explicit -- you get exactly the capabilities a policy grants, nothing implied or inherited.",
    },
  ],
  kubectl: [
    {
      id: 'kc-1',
      question: "What's the practical difference between `kubectl apply` and `kubectl create`?",
      options: [
        "They're identical",
        'apply is declarative and safe to re-run (updates a resource to match the file); create is imperative and errors if the resource already exists',
        'create only works on Pods, apply only works on Deployments',
        "apply requires a running cluster, create doesn't",
      ],
      correctIndex: 1,
      explanation: 'This is why real workflows almost always use apply -- you can re-run the same manifest safely as things change, instead of erroring on an existing resource.',
    },
    {
      id: 'kc-2',
      question: "What's the relationship between a Deployment and its Pods?",
      options: [
        'A Deployment IS a Pod with a different name',
        'A Deployment manages a ReplicaSet, which ensures the declared number of Pod replicas are running -- Pods are created/replaced by it, not managed by hand',
        'Pods create Deployments',
        "There's no relationship, they're independent objects",
      ],
      correctIndex: 1,
      explanation: "You almost never manage Pods directly in practice -- you declare desired state on the Deployment, and the controllers underneath make Pods match it.",
    },
    {
      id: 'kc-3',
      question: "During a rollout, new Pods are stuck in CrashLoopBackOff. What's a reasonable first troubleshooting step?",
      options: [
        'Immediately delete the Deployment',
        "Check the Pod's logs and recent events to see why the container is crashing",
        "Assume it's networking and restart the whole cluster",
        'Ignore it -- CrashLoopBackOff resolves itself',
      ],
      correctIndex: 1,
      explanation: 'Logs and events are almost always where the actual failure reason (bad config, missing dependency, crash on startup) shows up first.',
    },
    {
      id: 'kc-4',
      question: 'What does `kubectl rollout undo` do?',
      options: [
        'Deletes the Deployment entirely',
        'Rolls the Deployment back to its previous revision, using the same rollout mechanism just in reverse',
        'Pauses all future rollouts permanently',
        'Only works on Pods, never Deployments',
      ],
      correctIndex: 1,
      explanation: "Rollback isn't a special case -- it's just another rollout, targeting an older revision instead of a newer one.",
    },
  ],
  gitops: [
    {
      id: 'go-1',
      question: 'In GitOps, what is the source of truth for what should be running?',
      options: [
        'Whatever is currently running in the cluster',
        'The manifests committed in Git',
        'The last command someone typed',
        'A ticket in the issue tracker',
      ],
      correctIndex: 1,
      explanation: "That's the entire premise of GitOps -- Git is authoritative, and the cluster is continuously reconciled to match it.",
    },
    {
      id: 'go-2',
      question: "What does it mean when an Application's sync status is 'OutOfSync'?",
      options: [
        'The cluster is down',
        "The live state doesn't currently match what's declared in Git, from an unapplied commit or from drift",
        'The Git repo is unreachable',
        'Someone deleted the Application',
      ],
      correctIndex: 1,
      explanation: 'OutOfSync is purely a diff signal -- live vs. Git -- not an error state by itself.',
    },
    {
      id: 'go-3',
      question: "What is 'Self-Heal' responsible for?",
      options: [
        'Automatically fixing broken Git commits',
        'Automatically re-applying the Git-declared manifest when someone changes the live resource directly, with no human involved',
        'Restarting crashed pods',
        'Rolling back bad commits',
      ],
      correctIndex: 1,
      explanation: 'Self-Heal specifically targets drift (unauthorized live changes) -- a genuinely new commit is Auto-Sync\'s job, not Self-Heal\'s.',
    },
    {
      id: 'go-4',
      question: 'Someone manually scales a Deployment up during an incident, then forgets to update Git. With Self-Heal enabled, what happens?',
      options: [
        'The manual change gets applied to Git automatically',
        'The controller reverts the live resource back to match Git, undoing the manual scale-up',
        'Nothing -- Self-Heal only watches for new commits',
        'The Application is deleted',
      ],
      correctIndex: 1,
      explanation: "This is the double-edged nature of Self-Heal: it makes drift self-correcting, but that means a manual fix that isn't also committed to Git will get silently undone.",
    },
  ],
  monitoring: [
    {
      id: 'mo-1',
      question: "What's the difference between a dashboard panel and an alert rule?",
      options: [
        "They're the same thing",
        'A panel visualizes a metric over time for a human to look at; a rule is an automated threshold check that fires without anyone watching',
        'Panels are for errors only, rules are for traffic only',
        'Rules replace the need for panels entirely',
      ],
      correctIndex: 1,
      explanation: 'You need both: panels for understanding trends, rules for being told the instant something crosses a line you care about.',
    },
    {
      id: 'mo-2',
      question: "Why do most real alert rules require a threshold to be breached 'for' a duration (e.g. 5 minutes), instead of firing on a single reading?",
      options: [
        "It's a technical limitation, not a design choice",
        'To avoid paging someone over a single noisy or transient data point, so alerts stay meaningful',
        'Because metrics are only collected every 5 minutes',
        "It isn't actually common practice",
      ],
      correctIndex: 1,
      explanation: 'A momentary spike is normal noise; a sustained breach is a real signal -- the duration is what tells them apart.',
    },
    {
      id: 'mo-3',
      question: 'An alert rule is tuned way too sensitively and fires constantly on normal fluctuations. What actually happens as a result?',
      options: [
        'Nothing -- more alerts is always better',
        'On-call engineers start ignoring pages ("alert fatigue"), so a real incident risks being missed among the noise',
        'It automatically tunes itself over time',
        'The dashboard crashes',
      ],
      correctIndex: 1,
      explanation: 'Alert fatigue is one of the most common real on-call failure modes -- a noisy rule is often worse than no rule at all.',
    },
    {
      id: 'mo-4',
      question: 'What happens to an active alert when the metric that triggered it recovers back below threshold?',
      options: [
        'It stays active forever until someone manually closes it',
        "It auto-resolves, since the condition that caused it is no longer true",
        'It escalates to a higher severity',
        'A separate, new alert is created',
      ],
      correctIndex: 1,
      explanation: 'Alerts track a live condition -- once that condition is no longer true, there\'s nothing left to alert on.',
    },
  ],
};

export const PASSING_SCORE = 3; // out of 4 questions per module
