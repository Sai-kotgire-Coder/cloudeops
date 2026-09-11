import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as { userId: string; email?: string; tokenVersion?: number };

    // A token issued before a password change / reset / "log out of all
    // devices" carries a stale tokenVersion and must be rejected here --
    // this is the actual revocation mechanism, since a JWT signature alone
    // can't be invalidated early.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true }
    });

    if (!user || user.tokenVersion !== (decoded.tokenVersion ?? 0)) {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return;
    }

    req.userId = decoded.userId;
    req.user = {
      userId: decoded.userId,
      email: decoded.email || ''
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Alias for compatibility
export const authenticateToken = authMiddleware;
