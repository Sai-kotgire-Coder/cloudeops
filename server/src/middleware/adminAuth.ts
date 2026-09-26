import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from './auth.js';

export interface AdminRequest extends AuthRequest {
  adminRole?: string | null;
}

// Runs AFTER authMiddleware (needs req.userId already set). Separate from
// authMiddleware's tokenVersion check since this checks authorization
// (is this valid, logged-in user allowed here), not authentication
// (is this token valid at all). Stashes adminRole on the request so
// requireAdminRole() below doesn't need a second DB round-trip.
export const adminMiddleware = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true, adminRole: true },
    });

    if (!user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.adminRole = user.adminRole;
    next();
  } catch (error) {
    console.error('Admin auth check failed:', error);
    res.status(500).json({ error: 'Admin auth check failed' });
  }
};

// A null adminRole means "full admin" -- every admin created before roles
// existed, plus anyone deliberately granted full access. Narrower roles
// ('moderator', 'workshop_coordinator') are only let through the routes
// listed for them; everything else 403s. Always mount after adminMiddleware.
export const requireAdminRole = (...allowed: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (req.adminRole == null || allowed.includes(req.adminRole)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Your admin role does not include access to this action' });
  };
};
