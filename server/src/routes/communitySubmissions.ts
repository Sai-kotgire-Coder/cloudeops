import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

const submissionSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['documentation', 'research_paper', 'blog']),
  summary: z.string().min(1).max(500),
  content: z.string().min(1).max(20000),
  externalUrl: z.string().url().optional().or(z.literal(''))
});

// POST /api/community-submissions -- any authenticated user submits
// content for review. Always starts 'pending'; only visible to its own
// author (via /mine) until an admin approves it.
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = submissionSchema.parse(req.body);

    const submission = await prisma.communitySubmission.create({
      data: {
        authorId: req.userId!,
        title: data.title,
        type: data.type,
        summary: data.summary,
        content: data.content,
        externalUrl: data.externalUrl || null
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Create community submission error:', error);
    res.status(500).json({ error: 'Failed to submit content' });
  }
});

// GET /api/community-submissions/mine -- the caller's own submissions,
// any status, newest first.
router.get('/mine', async (req: AuthRequest, res) => {
  try {
    const submissions = await prisma.communitySubmission.findMany({
      where: { authorId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ submissions });
  } catch (error) {
    console.error('Get my community submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch your submissions' });
  }
});

// GET /api/community-submissions -- the public reading list every user
// sees: approved submissions only, paginated, optionally filtered by type.
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const type = req.query.type as string | undefined;

    const where: any = { status: 'approved' };
    if (type) where.type = type;

    const [submissions, total] = await Promise.all([
      prisma.communitySubmission.findMany({
        where,
        select: {
          id: true, title: true, type: true, summary: true, externalUrl: true,
          createdAt: true, reviewedAt: true, helpfulCount: true,
          author: { select: { email: true, profile: { select: { fullName: true } } } }
        },
        orderBy: { reviewedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.communitySubmission.count({ where })
    ]);

    res.json({
      submissions: submissions.map((s: any) => ({
        ...s,
        authorName: s.author.profile?.fullName || s.author.email.split('@')[0],
        author: undefined
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    console.error('Get community submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch community library' });
  }
});

// GET /api/community-submissions/:id -- full detail. Visible to anyone if
// approved; otherwise only to its own author (so a pending/rejected draft
// isn't readable by other users).
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const submission = await prisma.communitySubmission.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { email: true, profile: { select: { fullName: true } } } } }
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'approved' && submission.authorId !== req.userId) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const helpfulByMe = await prisma.submissionHelpful.findUnique({
      where: { submissionId_userId: { submissionId: submission.id, userId: req.userId! } }
    });

    res.json({
      ...submission,
      authorName: submission.author.profile?.fullName || submission.author.email.split('@')[0],
      helpfulByMe: !!helpfulByMe
    });
  } catch (error) {
    console.error('Get community submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Only an approved submission can be reacted to/commented on -- a
// pending/rejected draft has no public audience to react in the first place.
async function requireApprovedSubmission(id: string, res: any): Promise<{ id: string } | null> {
  const submission = await prisma.communitySubmission.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!submission || submission.status !== 'approved') {
    res.status(404).json({ error: 'Submission not found' });
    return null;
  }
  return submission;
}

// POST /api/community-submissions/:id/helpful -- toggle the caller's own
// "helpful" vote. A second call un-votes, matching the usual toggle-button
// UX (no separate unmark endpoint needed).
router.post('/:id/helpful', async (req: AuthRequest, res) => {
  try {
    const submission = await requireApprovedSubmission(req.params.id, res);
    if (!submission) return;

    const existing = await prisma.submissionHelpful.findUnique({
      where: { submissionId_userId: { submissionId: submission.id, userId: req.userId! } }
    });

    if (existing) {
      await prisma.$transaction([
        prisma.submissionHelpful.delete({ where: { id: existing.id } }),
        prisma.communitySubmission.update({ where: { id: submission.id }, data: { helpfulCount: { decrement: 1 } } })
      ]);
      return res.json({ helpfulByMe: false });
    }

    await prisma.$transaction([
      prisma.submissionHelpful.create({ data: { submissionId: submission.id, userId: req.userId! } }),
      prisma.communitySubmission.update({ where: { id: submission.id }, data: { helpfulCount: { increment: 1 } } })
    ]);
    res.json({ helpfulByMe: true });
  } catch (error) {
    console.error('Toggle submission helpful error:', error);
    res.status(500).json({ error: 'Failed to update your vote' });
  }
});

// GET /api/community-submissions/:id/comments -- flat, oldest-first thread.
router.get('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const submission = await requireApprovedSubmission(req.params.id, res);
    if (!submission) return;

    const comments = await prisma.submissionComment.findMany({
      where: { submissionId: submission.id },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { email: true, profile: { select: { fullName: true } } } } }
    });

    res.json({
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        authorName: c.author.profile?.fullName || c.author.email.split('@')[0],
        isMine: c.authorId === req.userId
      }))
    });
  } catch (error) {
    console.error('Get submission comments error:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

const commentSchema = z.object({ body: z.string().min(1).max(2000) });

// POST /api/community-submissions/:id/comments -- add a comment. No
// edit/delete UI, matching the scope of moderation elsewhere in this app
// (a submission can be un-approved by an admin if a comment gets out of hand).
router.post('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const submission = await requireApprovedSubmission(req.params.id, res);
    if (!submission) return;

    const { body } = commentSchema.parse(req.body);
    const comment = await prisma.submissionComment.create({
      data: { submissionId: submission.id, authorId: req.userId!, body },
      include: { author: { select: { email: true, profile: { select: { fullName: true } } } } }
    });

    res.status(201).json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      authorName: comment.author.profile?.fullName || comment.author.email.split('@')[0],
      isMine: true
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Create submission comment error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;
