import type { GitOpsApp, GitCommit } from '@/store/gitopsStore';

// The Application CR is what you'd actually commit to argocd/apps/ in a real
// "app of apps" GitOps repo -- it tells Argo CD where the desired state lives
// and how aggressively to reconcile it.
export function buildArgoAppManifest(app: GitOpsApp): string {
  return `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${app.name}
  namespace: argocd
spec:
  project: default
  source:
    repoURL: ${app.repoUrl}
    targetRevision: ${app.targetRevision}
    path: ${app.path}
  destination:
    server: https://kubernetes.default.svc
    namespace: ${app.name}
  syncPolicy:
${app.autoSync ? '    automated:\n' + `      selfHeal: ${app.selfHeal}\n` + '      prune: true' : '    # automated sync disabled -- changes require "argocd app sync" to apply'}
`;
}

// The actual manifest living at spec.source.path in the Git repo -- this is
// what Argo CD diffs against the live cluster to decide Synced vs OutOfSync.
export function buildDeploymentManifest(app: GitOpsApp, commit: GitCommit | undefined): string {
  const version = commit?.version ?? 'v1';
  const replicas = commit?.replicas ?? 1;
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app.name}
  namespace: ${app.name}
  labels:
    app: ${app.name}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${app.name}
  template:
    metadata:
      labels:
        app: ${app.name}
        version: "${version}"
    spec:
      containers:
        - name: ${app.name}
          image: registry.example.com/${app.name}:${version}
          ports:
            - containerPort: 8080
`;
}
