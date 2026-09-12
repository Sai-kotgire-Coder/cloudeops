// Re-engagement announcement for existing users who registered but have
// gone quiet -- explains what's new since they last logged in and invites
// them back. Used by server/scripts/send-reactivation-emails.ts; kept as
// its own module (rather than inline in the script) so any future
// campaign script can reuse the same builder.

export interface ReEngagementEmailInput {
  email: string;
  fullName?: string | null;
  appUrl: string;
}

interface FeatureHighlight {
  emoji: string;
  title: string;
  description: string;
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    emoji: '🌍',
    title: 'Terraform Lab',
    description: 'Write real HCL, run Plan & Apply, and see infrastructure drift detected and reconciled -- for AWS, GCP, and Azure resources.',
  },
  {
    emoji: '📜',
    title: 'Ansible Lab',
    description: 'Build playbooks from 20 real modules and watch idempotency in action -- run the same playbook twice and see it converge to "0 changes".',
  },
  {
    emoji: '🔐',
    title: 'Vault Lab',
    description: 'Enable secrets engines, version secrets with KV v2, write least-privilege policies, and test token access -- allowed or denied, exactly like production.',
  },
  {
    emoji: '⌨️',
    title: 'kubectl Lab',
    description: 'A real terminal running kubectl-style commands against your own simulated cluster -- get pods, scale deployments, check logs.',
  },
  {
    emoji: '🔁',
    title: 'GitOps Lab',
    description: 'Commit changes, watch Auto-Sync apply them, then simulate drift and watch Self-Heal correct it automatically -- continuous deployment, hands-on.',
  },
  {
    emoji: '👤',
    title: 'My Account',
    description: 'A real profile, a plan overview, and a module picker -- choose exactly which labs show up in your sidebar.',
  },
  {
    emoji: '🛡️',
    title: 'Stronger account security',
    description: 'Forgot-password recovery, changing your password without losing your session, and a "log out of all other devices" switch if you ever need it.',
  },
];

function featureRowsHtml(): string {
  return FEATURE_HIGHLIGHTS.map(
    (f) => `
        <tr>
          <td style="padding: 12px 0; vertical-align: top; width: 40px; font-size: 22px;">${f.emoji}</td>
          <td style="padding: 12px 0; vertical-align: top;">
            <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 15px;">${f.title}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${f.description}</p>
          </td>
        </tr>`
  ).join('\n');
}

function featureLinesText(): string {
  return FEATURE_HIGHLIGHTS.map((f) => `${f.emoji} ${f.title} -- ${f.description}`).join('\n\n');
}

export function buildReEngagementEmail({ email, fullName, appUrl }: ReEngagementEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greetingName = fullName?.trim() || email.split('@')[0];
  const subject = 'CloudOps Simulator just leveled up -- 5 new hands-on labs are waiting for you';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; margin-bottom: 4px;">CloudOps Simulator</h2>
      <p style="color: #9ca3af; font-size: 13px; margin-top: 0;">A lot has changed since you last logged in</p>

      <p style="color: #1f2937; font-size: 15px;">Hi ${greetingName},</p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        We noticed you haven't been back to CloudOps Simulator in a while. In that time, we've shipped a
        major upgrade -- five brand-new hands-on labs, a real account &amp; security system, and a lot of
        fixes -- and we'd love to have you try it out.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        ${featureRowsHtml()}
      </table>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${appUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
          Log back in and explore
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        Your account and any progress you already made are exactly where you left them -- nothing was reset.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px;">
        CloudOps Simulator -- Cloud Operations Learning Platform<br>
        You're receiving this because you have an existing account with us. If you'd rather not get emails
        like this, just let us know by replying.
      </p>
    </div>
  `;

  const text = `Hi ${greetingName},

We noticed you haven't been back to CloudOps Simulator in a while. In that time, we've shipped a major upgrade -- five brand-new hands-on labs, a real account & security system, and a lot of fixes -- and we'd love to have you try it out.

What's new:

${featureLinesText()}

Log back in: ${appUrl}

Your account and any progress you already made are exactly where you left them -- nothing was reset.

-- CloudOps Simulator`;

  return { subject, html, text };
}
