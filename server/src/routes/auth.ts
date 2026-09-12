import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import { generateOTP, sendOTPEmail, sendPasswordResetEmail } from '../lib/emailService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authLimiter, emailLimiter } from '../middleware/rateLimit.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

function signToken(userId: string, email: string, tokenVersion: number): string {
  return jwt.sign(
    { userId, email, tokenVersion },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

// Every user gets a shareable referral code at creation, across all 3
// signup paths (register/google/github). Retried a few times on the
// astronomically unlikely chance of a collision.
async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(4).toString('hex'); // 8 hex chars
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error('Failed to generate a unique referral code');
}

// If the signup request supplied someone else's referral code, resolve it
// to that user's id so the new user's referredById can be set at creation
// time. The reward itself only fires later, on the new user's onboarding
// completion (see profile.ts) -- not here.
async function resolveReferrerId(referralCode?: string): Promise<string | undefined> {
  if (!referralCode) return undefined;
  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  return referrer?.id;
}

// Validation schemas
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  referralCode: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const verifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
});

const resendOTPSchema = z.object({
  email: z.string().email()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: passwordSchema
});

const changePasswordSchema = z.object({
  // Optional: a Google Sign-In account with no password yet is setting one
  // for the first time, so there's nothing to verify against.
  currentPassword: z.string().optional(),
  newPassword: passwordSchema
});

const deleteAccountSchema = z.object({
  // Optional: a Google Sign-In account with no password has nothing to
  // confirm with -- being authenticated with a valid, non-revoked token is
  // treated as sufficient proof for those accounts.
  password: z.string().optional()
});

// Register endpoint - Creates user and sends OTP
router.post('/register', emailLimiter, async (req, res) => {
  try {
    const { email, password, referralCode } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const [ownReferralCode, referredById] = await Promise.all([
      generateUniqueReferralCode(),
      resolveReferrerId(referralCode)
    ]);

    // Create user with OTP
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        otpCode: otp,
        otpExpiry,
        isVerified: false,
        referralCode: ownReferralCode,
        referredById
      }
    });

    // Every brand-new registration explicitly starts with no modules
    // selected and onboarding incomplete -- this (not the profile route's
    // lazy auto-create, which defaults to "all modules, already done" for
    // pre-existing accounts) is what triggers the forced first-run setup
    // screen for genuinely new users.
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        selectedModules: [],
        onboardingComplete: false
      }
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      // If email fails, delete the user and return error
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email for OTP.',
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = verifyOTPSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if OTP exists
    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark user as verified and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null
      }
    });

    // Generate JWT token
    const token = signToken(user.id, user.email, user.tokenVersion);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        isVerified: true,
        isAdmin: user.isAdmin,
        hasPassword: !!user.passwordHash,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', emailLimiter, async (req, res) => {
  try {
    const { email } = resendOTPSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry
      }
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({
      message: 'New OTP sent to your email',
      email: user.email
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Login endpoint - Requires verified email
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'This account uses Google Sign-In. Continue with Google instead of a password, or set a password from My Account after signing in.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Generate JWT
    const token = signToken(user.id, user.email, user.tokenVersion);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        hasPassword: !!user.passwordHash,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

const googleAuthSchema = z.object({
  credential: z.string(),
  referralCode: z.string().optional()
});

// Sign in (or register) with a Google ID token obtained client-side via
// Google Identity Services. Verifying the token here (rather than trusting
// whatever the client sends) is what actually proves the request came from
// Google -- the signature is checked against Google's public keys and the
// audience is checked against our own GOOGLE_CLIENT_ID.
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, referralCode } = googleAuthSchema.parse(req.body);

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google Sign-In is not configured on this server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ error: 'Google did not return an email for this account' });
    }
    if (!payload.email_verified) {
      return res.status(400).json({ error: 'Your Google email address is not verified' });
    }

    const email = payload.email;
    const googleId = payload.sub;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing account (password-based or already Google-linked) -- link
      // this Google identity if it isn't already, since Google has
      // independently verified the same email address we already have.
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, isVerified: true }
        });
      }
    } else {
      // Brand-new account via Google -- Google already verified the email,
      // so there's no OTP step to go through.
      const [ownReferralCode, referredById] = await Promise.all([
        generateUniqueReferralCode(),
        resolveReferrerId(referralCode)
      ]);
      user = await prisma.user.create({
        data: { email, googleId, isVerified: true, referralCode: ownReferralCode, referredById }
      });

      // Same defaults as a brand-new /register: no modules selected yet
      // and onboarding incomplete, so the forced first-run setup screen
      // still applies to Google sign-ups too.
      await prisma.userProfile.create({
        data: { userId: user.id, selectedModules: [], onboardingComplete: false }
      });
    }

    const token = signToken(user.id, user.email, user.tokenVersion);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        hasPassword: !!user.passwordHash,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

const githubAuthSchema = z.object({
  code: z.string(),
  // The exact redirect_uri the frontend used to start the GitHub authorize
  // flow -- GitHub's token exchange requires this to match, and since the
  // app is served from more than one domain (local dev + production), the
  // backend can't hardcode a single expected value.
  redirectUri: z.string(),
  referralCode: z.string().optional()
});

// Sign in (or register) with a GitHub OAuth authorization code obtained
// client-side via GitHub's standard redirect-based OAuth flow (GitHub has
// no equivalent of Google's one-tap credential flow). Unlike Google, the
// client secret here is genuinely secret, so the code-for-token exchange
// happens server-side only.
router.post('/github', authLimiter, async (req, res) => {
  try {
    const { code, redirectUri, referralCode } = githubAuthSchema.parse(req.body);

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ error: 'GitHub Sign-In is not configured on this server' });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri
      })
    });
    const tokenData: any = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData);
      return res.status(401).json({ error: 'GitHub sign-in failed' });
    }

    const accessToken = tokenData.access_token;
    const githubHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'CloudOps-Simulator',
      Accept: 'application/vnd.github+json'
    };

    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: githubHeaders }),
      fetch('https://api.github.com/user/emails', { headers: githubHeaders })
    ]);
    const profile: any = await profileRes.json();
    const emails: any = await emailsRes.json();

    const primaryEmail = Array.isArray(emails)
      ? emails.find((e: any) => e.primary && e.verified) || emails.find((e: any) => e.verified)
      : null;

    if (!primaryEmail?.email) {
      return res.status(400).json({ error: 'Your GitHub account has no verified email address to sign in with' });
    }

    const email = primaryEmail.email;
    const githubId = String(profile.id);

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing account -- link this GitHub identity if it isn't already,
      // since GitHub has independently verified the same email address.
      if (!user.githubId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubId, isVerified: true }
        });
      }
    } else {
      const [ownReferralCode, referredById] = await Promise.all([
        generateUniqueReferralCode(),
        resolveReferrerId(referralCode)
      ]);
      user = await prisma.user.create({
        data: { email, githubId, isVerified: true, referralCode: ownReferralCode, referredById }
      });
      await prisma.userProfile.create({
        data: { userId: user.id, selectedModules: [], onboardingComplete: false }
      });
    }

    const token = signToken(user.id, user.email, user.tokenVersion);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        hasPassword: !!user.passwordHash,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('GitHub auth error:', error);
    res.status(401).json({ error: 'GitHub sign-in failed' });
  }
});

// Forgot password - sends a reset OTP if the email is registered.
// Always responds with the same generic message regardless of whether the
// email exists, so this endpoint can't be used to enumerate accounts.
router.post('/forgot-password', emailLimiter, async (req, res) => {
  const genericResponse = {
    message: 'If that email is registered, a password reset code has been sent to it.'
  };

  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordOtp: otp,
          resetPasswordOtpExpiry: otpExpiry
        }
      });

      try {
        await sendPasswordResetEmail(email, otp);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't leak the failure to the client -- still respond generically
      }
    }

    res.json(genericResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Forgot password error:', error);
    // Still respond generically even on unexpected errors
    res.json(genericResponse);
  }
});

// Reset password - verifies the reset OTP and sets a new password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (new Date() > user.resetPasswordOtpExpiry) {
      return res.status(400).json({ error: 'Reset code expired. Please request a new one.' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordOtp: null,
        resetPasswordOtpExpiry: null,
        // Revoke every session issued before this reset -- if the account
        // was compromised, whoever holds an old token gets logged out too.
        tokenVersion: { increment: 1 }
      }
    });

    res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get current user (goes through authMiddleware so a revoked/stale token --
// e.g. from a password change on another device -- is rejected here too,
// consistent with every other authenticated route)
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        passwordHash: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ user: { ...safeUser, hasPassword: !!passwordHash } });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Change password while logged in. Verifies the current password, then
// issues a fresh token for THIS session (embedding the bumped tokenVersion)
// so the tab that just changed the password stays logged in, while every
// other previously-issued token is revoked.
router.post('/change-password', authMiddleware, authLimiter, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.passwordHash) {
      // Account already has a password -- must prove you know it.
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        // 400, not 401 -- the bearer token is perfectly valid here (it
        // already passed authMiddleware); this is a wrong-input rejection,
        // not an auth failure. The client treats any 401 on an
        // authenticated call as a revoked session and force-logs-out,
        // which would be wrong here.
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }
    // else: Google-only account setting a password for the first time --
    // being logged in (a valid, non-revoked token) is proof enough.

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 }
      }
    });

    const token = signToken(updated.id, updated.email, updated.tokenVersion);

    res.json({ message: 'Password changed successfully', token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Log out of every other device/session by bumping tokenVersion. Like
// change-password, issues a fresh token so the current tab isn't logged
// out by its own request.
router.post('/logout-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { tokenVersion: { increment: 1 } }
    });

    const token = signToken(updated.id, updated.email, updated.tokenVersion);

    res.json({ message: 'Logged out of all other devices', token });
  } catch (error) {
    console.error('Logout-all error:', error);
    res.status(500).json({ error: 'Failed to log out other sessions' });
  }
});

// Export all of the user's own data as a downloadable JSON file. Internal
// security fields (password hash, OTP codes, token version) are stripped --
// this is a data-portability export, not an account dump.
router.get('/export', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        applications: true,
        instances: true,
        containers: true,
        pipelines: true,
        userProgress: true,
        images: true,
        tickets: true,
        scenarios: true,
        dashboardState: true,
        networkingState: true,
        gameState: true,
        alerts: true,
        payments: true,
        terraformWorkspace: true,
        ansibleWorkspace: true,
        vaultWorkspace: true,
        gitopsWorkspace: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      passwordHash, otpCode, otpExpiry, resetPasswordOtp, resetPasswordOtpExpiry, tokenVersion,
      ...exportable
    } = user;

    res.setHeader('Content-Disposition', 'attachment; filename="cloudops-data-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({ exportedAt: new Date().toISOString(), ...exportable });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Permanently delete the account and all associated data (cascades via the
// DB relations). Requires re-entering the password as confirmation.
router.delete('/account', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { password } = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.passwordHash) {
      if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
        // 400, not 401 -- same reasoning as change-password above: a valid,
        // authenticated request with a wrong confirmation value, not a
        // stale or invalid token.
        return res.status(400).json({ error: 'Incorrect password' });
      }
    }
    // else: Google-only account -- no password to confirm with.

    await prisma.user.delete({ where: { id: user.id } });

    res.json({ message: 'Account deleted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
