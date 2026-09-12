// Canned starting points for the admin panel's broadcast composer.
// Selecting one prefills the subject/message, which the admin can still
// edit before sending -- 'custom' is the "start from nothing" option.

export interface EmailTemplate {
  id: string;
  label: string;
  description: string;
  subject: string;
  message: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'winback',
    label: 'Win back inactive users',
    description: "Announces what's new since they last logged in",
    subject: 'CloudOps Simulator just leveled up -- 5 new hands-on labs are waiting for you',
    message: `We noticed you haven't been back to CloudOps Simulator in a while. In that time, we've shipped a **major upgrade**, and we'd love to have you try it out.

What's new:

- **Terraform Lab** -- write real HCL, run Plan & Apply, and watch drift get detected and reconciled
- **Ansible Lab** -- build playbooks from 20 real modules and see idempotency in action
- **Vault Lab** -- secrets engines, KV v2 versioning, least-privilege policies, and token access testing
- **kubectl Lab** -- a real terminal running commands against your own simulated cluster
- **GitOps Lab** -- commit changes, watch Auto-Sync apply them, then simulate drift and watch Self-Heal correct it

We've also added a real **My Account** section (a profile, plan overview, and a picker for which labs show up in your sidebar) and stronger account security, including password recovery and session management.

Log back in and pick up right where you left off -- **nothing was reset**.`,
  },
  {
    id: 'welcome',
    label: 'Welcome new users',
    description: 'Onboarding nudge for recently registered accounts',
    subject: 'Getting started with CloudOps Simulator',
    message: `**Welcome to CloudOps Simulator!** Here's the fastest way to get oriented:

1. Start with **Scenarios** -- guided, objective-based exercises that walk you through the fundamentals one step at a time.
2. Pick a **Lab** that matches what you want to learn: Terraform, Ansible, Vault, kubectl, or GitOps. Each one behaves like the real tool, not a simplified stand-in.
3. Visit **My Account** to choose exactly which labs and sections show up in your sidebar, so it only shows what you're actively using.

If you get stuck anywhere, every lab has a "Learn More" button with a plain-language explanation of the concept you're looking at.

Jump back in whenever you're ready.`,
  },
  {
    id: 'new_features',
    label: 'General "what\'s new" update',
    description: 'A periodic changelog-style announcement',
    subject: "Here's what's new on CloudOps Simulator",
    message: `A quick update on what's changed recently:

- [Describe the first change here]
- [Describe the second change here]
- [Describe the third change here]

As always, your account and progress are untouched -- these are additions, not resets.

Log in and take a look.`,
  },
  {
    id: 'upgrade_pro',
    label: 'Upgrade to Pro nudge',
    description: 'Highlights Pro plan benefits with a pricing CTA',
    subject: 'Get more out of CloudOps Simulator with Pro',
    message: `You've been building with the Free plan -- here's what changes if you upgrade to **Pro**:

- **Unlimited** instances, applications, pipelines, and containers (Free is capped, so you stop hitting limits mid-exercise)
- Advanced monitoring and custom configurations
- Priority support
- Advanced scenarios unlocked

Pro is **₹99 for 30 days**, and you can cancel anytime from My Account -- there's no auto-renewal to worry about.

Check out the Pricing page to upgrade.`,
  },
  {
    id: 'spotlight_terraform',
    label: 'Feature spotlight: Terraform Lab',
    description: 'Deep-dive promo for one specific lab',
    subject: 'Have you tried the Terraform Lab yet?',
    message: `If you haven't opened the Terraform Lab yet, here's what you're missing:

Write a real resource block for AWS, GCP, or Azure, and see the actual production-valid Terraform snippet generated as you go. Click **Plan** to see a color-coded diff of exactly what would change. Click **Apply** to make it real. Then click "Simulate Drift" to see what happens when someone changes something by hand outside Terraform -- and watch the next Plan catch it.

It's the same plan-review-apply discipline real infrastructure teams use, hands-on.

Give it a try from the sidebar.`,
  },
  {
    id: 'spotlight_gitops',
    label: 'Feature spotlight: GitOps Lab',
    description: 'Deep-dive promo for one specific lab',
    subject: 'Have you tried the GitOps Lab yet?',
    message: `The GitOps Lab is one of our newest additions, and it's worth a look:

Link a GitOps Application to a real app in your simulator, commit a version change, and watch **Auto-Sync** pick it up and apply it automatically within seconds. Then flip on **Self-Heal**, click "Simulate Drift" to mimic someone changing things by hand, and watch it get silently corrected back to match Git -- even if you've navigated away to a different page.

It's the clearest hands-on way to understand why teams move to "Git as the source of truth" for deployments.

Try it out from the sidebar.`,
  },
  {
    id: 'maintenance',
    label: 'Scheduled maintenance notice',
    description: 'Heads-up before planned downtime',
    subject: 'Scheduled maintenance on CloudOps Simulator',
    message: `We'll be performing scheduled maintenance on **[DATE] at [TIME] ([TIMEZONE])**. We expect the platform to be unavailable for approximately **[DURATION]**.

What to expect:
- You may be logged out during the maintenance window
- Any in-progress work should be saved beforehand where possible
- No account data will be affected

We'll follow up once maintenance is complete. Thanks for your patience.`,
  },
  {
    id: 'security_update',
    label: 'Security improvements notice',
    description: 'Announces account security upgrades',
    subject: "We've strengthened account security on CloudOps Simulator",
    message: `We've rolled out several account security improvements:

- **Forgot-password recovery**, if you're ever locked out
- **Change your password** anytime from My Account, without losing your current session
- A **"log out of all other devices"** switch, in case you ever suspect unauthorized access
- Stronger protection against repeated login attempts

No action is required on your part -- your account is unaffected. We just wanted you to know these protections are now in place.`,
  },
  {
    id: 'feedback_survey',
    label: 'Feedback / survey request',
    description: 'Asks users for product feedback',
    subject: 'Got 2 minutes? We\'d love your feedback on CloudOps Simulator',
    message: `We're actively building out CloudOps Simulator and want to make sure we're building the right things.

If you have a couple of minutes, we'd love to hear:
- Which lab or feature has been most useful to you?
- What's confusing, missing, or could be better explained?
- What would make you use the platform more often?

Just reply to this email with your thoughts -- we read every response.

Thanks for helping shape where this goes next.`,
  },
  {
    id: 'thank_you',
    label: 'Thank you / appreciation',
    description: 'A simple goodwill message, no specific ask',
    subject: 'Thank you for being part of CloudOps Simulator',
    message: `Just a quick note to say thanks for being one of our users.

Whether you've been here since the start or just found us recently, we appreciate you taking the time to learn with CloudOps Simulator, and your usage and feedback directly shape what we build next.

More labs and improvements are on the way -- we're glad to have you along for it.`,
  },
  {
    id: 'plan_expiry',
    label: 'Pro plan expiry reminder',
    description: 'Reminds Pro users their plan is ending soon',
    subject: 'Your CloudOps Simulator Pro plan is ending soon',
    message: `Your Pro plan is set to expire in **[X] days**. Once it does, you'll move to the Free plan's limits (1 instance, 1 application, 2 pipelines, 3 containers).

If you'd like to keep your current access, you can renew anytime from the Pricing page -- it only takes a minute.

If you meant to cancel, no action is needed; you'll move to Free automatically and won't be charged again.`,
  },
];

export const CUSTOM_TEMPLATE_ID = 'custom';
