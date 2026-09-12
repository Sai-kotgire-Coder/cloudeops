// Shared branded HTML shell for every outgoing email (OTP, password reset,
// reactivation campaign, admin broadcasts). Table-based layout with inline
// styles throughout -- required for consistent rendering in Gmail/Outlook,
// which don't support external stylesheets and only partially support
// modern CSS. Callers only supply the inner body content; this handles the
// header banner, the bordered content card, and the footer.

export function wrapEmailHtml(bodyHtml: string): string {
  return `
<body style="margin:0; padding:0; background-color:#eef2f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:14px; border:1px solid #dbeafe; box-shadow:0 4px 16px rgba(15,23,42,0.08);">
          <tr>
            <td style="background-color:#2563eb; background-image:linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius:14px 14px 0 0; padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;">
                    <span style="font-size:23px; font-weight:700; color:#ffffff; letter-spacing:0.2px;">&#9729; CloudOps Simulator</span>
                    <br>
                    <span style="font-size:13px; color:#dbeafe; font-weight:400;">Cloud Operations Learning Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px; font-family:Arial,Helvetica,sans-serif; color:#1f2937; font-size:15px; line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px; background-color:#f8fafc; border-top:1px solid #e5e7eb; border-radius:0 0 14px 14px;">
              <p style="margin:0; font-size:12px; color:#94a3b8; font-family:Arial,Helvetica,sans-serif; line-height:1.5;">
                CloudOps Simulator &middot; Cloud Operations Learning Platform<br>
                You're receiving this because you have an account with us.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
  `;
}

// Lightweight **bold** markdown support for free-text admin broadcast
// messages -- lets an admin emphasize part of their own message without
// writing HTML. Applied before paragraph-splitting.
export function applyInlineMarkdownBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
