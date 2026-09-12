import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { DEFAULT_ASG, DEFAULT_HPA, DEFAULT_VPA } from '../lib/gameState.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get game state for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! }
    });

    if (!gameState) {
      // Return default game state if none exists
      return res.json({
        isRunning: false,
        tick: 0,
        score: 0,
        scoreHistory: [],
        pendingPods: [],
        scenario: null,
        totalCost: 0,
        hasLoadBalancer: false,
        asg: DEFAULT_ASG,
        hpa: DEFAULT_HPA,
        vpa: DEFAULT_VPA,
        traffic: 0,
        targetTraffic: 0,
        cpuAvg: 0,
        errorRate: 0,
        latencyAvg: 0,
        metricsHistory: [],
        tutorialStep: 0,
        tutorialComplete: false
      });
    }

    res.json(gameState);
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

// Create or update game state
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      isRunning,
      tick,
      score,
      scoreHistory,
      pendingPods,
      scenario,
      totalCost,
      hasLoadBalancer,
      asg,
      hpa,
      vpa,
      traffic,
      targetTraffic,
      cpuAvg,
      errorRate,
      latencyAvg,
      metricsHistory,
      tutorialStep,
      tutorialComplete
    } = req.body;

    const gameState = await prisma.gameState.upsert({
      where: { userId: req.userId! },
      update: {
        isRunning,
        tick,
        score,
        scoreHistory,
        pendingPods,
        scenario,
        totalCost,
        hasLoadBalancer,
        asg,
        hpa,
        vpa,
        traffic,
        targetTraffic,
        cpuAvg,
        errorRate,
        latencyAvg,
        metricsHistory,
        tutorialStep,
        tutorialComplete
      },
      create: {
        userId: req.userId!,
        isRunning,
        tick,
        score,
        scoreHistory,
        pendingPods,
        scenario,
        totalCost,
        hasLoadBalancer,
        asg,
        hpa,
        vpa,
        traffic,
        targetTraffic,
        cpuAvg,
        errorRate,
        latencyAvg,
        metricsHistory,
        tutorialStep,
        tutorialComplete
      }
    });

    res.json(gameState);
  } catch (error) {
    console.error('Upsert game state error:', error);
    res.status(500).json({ error: 'Failed to save game state' });
  }
});

// Partial update (patch) specific fields
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const updates = req.body;

    const gameState = await prisma.gameState.upsert({
      where: { userId: req.userId! },
      update: updates,
      create: {
        userId: req.userId!,
        ...updates,
        // Ensure required JSON fields have defaults
        asg: updates.asg || DEFAULT_ASG,
        hpa: updates.hpa || DEFAULT_HPA,
        vpa: updates.vpa || DEFAULT_VPA
      }
    });

    res.json(gameState);
  } catch (error) {
    console.error('Patch game state error:', error);
    res.status(500).json({ error: 'Failed to update game state' });
  }
});

export default router;
