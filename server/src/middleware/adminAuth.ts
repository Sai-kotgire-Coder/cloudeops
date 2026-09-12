import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from './auth.js';

// Runs AFTER authMiddleware (needs req.userId already set). Separate from
// authMiddleware's tokenVersion check since this checks authorization
// (is this valid, logged-in user allowed here), not authentication
// (is this token valid at all).
export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin auth check failed:', error);
    res.status(500).json({ error: 'Admin auth check failed' });
  }
};
