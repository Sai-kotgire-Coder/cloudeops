import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get the user's profile (auto-creates with schema defaults if missing --
// existing accounts created before this feature get "all modules visible,
// onboarding already complete" defaults; brand-new registrations instead
// get an explicit empty/incomplete row created in /auth/register, so this
// auto-create path is only ever hit by pre-existing accounts).
router.get('/', async (req: AuthRequest, res) => {
  try {
    let profile = await prisma.userProfile.findUnique({
      where: { userId: req.userId! }
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId: req.userId! }
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update the user's profile (personal info fields, selected modules, and/or
// marking onboarding complete). Every field is optional -- only provided
// keys are written, so partial saves (e.g. just toggling a module) work.
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const {
      fullName,
      phone,
      linkedinUrl,
      instagramHandle,
      dateOfBirth,
      institute,
      occupation,
      selectedModules,
      onboardingComplete
    } = req.body;

    const data: Record<string, unknown> = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;
    if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl;
    if (instagramHandle !== undefined) data.instagramHandle = instagramHandle;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (institute !== undefined) data.institute = institute;
    if (occupation !== undefined) data.occupation = occupation;
    if (selectedModules !== undefined) data.selectedModules = selectedModules;
    if (onboardingComplete !== undefined) data.onboardingComplete = onboardingComplete;

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId!, ...data },
      update: data
    });

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
