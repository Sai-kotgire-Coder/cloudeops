import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// Validation schemas
const createTicketSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  type: z.enum(['INCIDENT', 'REQUEST', 'PROBLEM', 'CHANGE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string().optional(),
  affectedService: z.string().optional(),
  sourceEvent: z.any().optional(),
  metricsSnapshot: z.any().optional(),
  suggestedFix: z.string().optional(),
});

const updateTicketSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category: z.string().optional(),
  affectedService: z.string().optional(),
  actionTaken: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

const addActivitySchema = z.object({
  action: z.string().min(1),
  description: z.string(),
  metadata: z.any().optional(),
});

// Helper function to generate ticket numbers
async function generateTicketNumber(): Promise<string> {
  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { ticketNumber: true },
  });

  if (!lastTicket) {
    return 'TK-0001';
  }

  const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `TK-${nextNumber.toString().padStart(4, '0')}`;
}

// Helper function to log activity
async function logActivity(
  ticketId: string,
  action: string,
  description: string,
  metadata?: any
) {
  await prisma.ticketActivity.create({
    data: {
      ticketId,
      action,
      description,
      metadata: metadata || {},
    },
  });
}

// GET /api/tickets - List all tickets with filtering
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status, priority, category } = req.query;

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Custom priority sorting
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sortedTickets = tickets.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { OPEN: 0, IN_PROGRESS: 1, RESOLVED: 2, CLOSED: 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });

    res.json(sortedTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id - Get single ticket with full details
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/tickets - Create new ticket
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = createTicketSchema.parse(req.body);

    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ...validatedData,
        ticketNumber,
        userId,
        status: 'OPEN',
        sourceEvent: validatedData.sourceEvent || {},
        metricsSnapshot: validatedData.metricsSnapshot || {},
      },
      include: {
        activities: true,
      },
    });

    // Log creation activity
    await logActivity(
      ticket.id,
      'CREATED',
      `Ticket ${ticketNumber} created`,
      { priority: ticket.priority, type: ticket.type }
    );

    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid ticket data', details: error.errors });
    }
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PATCH /api/tickets/:id - Update ticket
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const validatedData = updateTicketSchema.parse(req.body);

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (existingTicket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Log status change
    if (validatedData.status && validatedData.status !== existingTicket.status) {
      await logActivity(
        ticket.id,
        'STATUS_CHANGED',
        `Status changed from ${existingTicket.status} to ${validatedData.status}`,
        { oldStatus: existingTicket.status, newStatus: validatedData.status }
      );
    }

    // Log resolution
    if (validatedData.status === 'RESOLVED' && validatedData.resolutionNotes) {
      await logActivity(
        ticket.id,
        'RESOLVED',
        validatedData.resolutionNotes,
        { actionTaken: validatedData.actionTaken }
      );
    }

    res.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid update data', details: error.errors });
    }
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (existingTicket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.ticket.delete({ where: { id } });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// POST /api/tickets/:id/activities - Add activity to ticket
router.post('/:id/activities', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const validatedData = addActivitySchema.parse(req.body);

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (existingTicket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await logActivity(
      id,
      validatedData.action,
      validatedData.description,
      validatedData.metadata
    );

    const activities = await prisma.ticketActivity.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(activities);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid activity data', details: error.errors });
    }
    console.error('Error adding activity:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

export default router;
