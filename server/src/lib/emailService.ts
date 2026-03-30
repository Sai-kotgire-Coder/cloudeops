import nodemailer from 'nodemailer';

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
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">CloudOps Simulator</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #1f2937; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">CloudOps Simulator - Cloud Operations Learning Platform</p>
      </div>
    `,
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
