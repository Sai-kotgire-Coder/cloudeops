import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { generateOTP, sendOTPEmail, sendPasswordResetEmail } from '../lib/emailService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authLimiter, emailLimiter } from '../middleware/rateLimit.js';

const router = Router();

function signToken(userId: string, email: string, tokenVersion: number): string {
  return jwt.sign(
    { userId, email, tokenVersion },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
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
  password: passwordSchema
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
  currentPassword: z.string(),
  newPassword: passwordSchema
});

const deleteAccountSchema = z.object({
  password: z.string()
});

// Register endpoint - Creates user and sends OTP
router.post('/register', emailLimiter, async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

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

    // Create user with OTP
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        otpCode: otp,
        otpExpiry,
        isVerified: false
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
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
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

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      // 400, not 401 -- the bearer token is perfectly valid here (it already
      // passed authMiddleware); this is a wrong-input rejection, not an auth
      // failure. The client treats any 401 on an authenticated call as a
      // revoked session and force-logs-out, which would be wrong here.
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

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

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // 400, not 401 -- same reasoning as change-password above: a valid,
      // authenticated request with a wrong confirmation value, not a stale
      // or invalid token.
      return res.status(400).json({ error: 'Incorrect password' });
    }

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
