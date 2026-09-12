import nodemailer from 'nodemailer';
import { wrapEmailHtml } from '../emails/emailShell.js';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'CloudOps Simulator - Email Verification',
    html: wrapEmailHtml(`
      <p style="margin:0 0 16px;">Welcome! Use the code below to verify your email and finish creating your account.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td align="center" style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:22px;">
            <span style="font-size:34px; font-weight:700; letter-spacing:10px; color:#1d4ed8; font-family:Arial,Helvetica,sans-serif;">${otp}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;">This code will expire in <strong>5 minutes</strong>.</p>
      <p style="margin:0; color:#6b7280; font-size:13px;">If you didn't request this code, you can safely ignore this email.</p>
    `),
    text: `Your CloudOps Simulator verification code is: ${otp}. This code will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
}

// Send password-reset email
export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'CloudOps Simulator - Reset Your Password',
    html: wrapEmailHtml(`
      <p style="margin:0 0 16px;">We received a request to reset your password. Use the code below to continue:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td align="center" style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:22px;">
            <span style="font-size:34px; font-weight:700; letter-spacing:10px; color:#1d4ed8; font-family:Arial,Helvetica,sans-serif;">${otp}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;">This code will expire in <strong>10 minutes</strong>.</p>
      <p style="margin:0; color:#6b7280; font-size:13px;">If you didn't request a password reset, you can safely ignore this email -- your password won't be changed.</p>
    `),
    text: `Your CloudOps Simulator password reset code is: ${otp}. This code will expire in 10 minutes. If you didn't request this, you can ignore this email.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Generic send, for anything that isn't an OTP code (e.g. bulk campaign
// emails in server/scripts/) -- reuses the same transporter/from-address
// as the rest of this file so behavior stays consistent in one place.
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text
  });
}

// Verify email configuration on startup
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✓ Email service is ready');
    return true;
  } catch (error) {
    console.error('✗ Email service configuration error:', error);
    return false;
  }
}
