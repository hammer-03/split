import { Router, Response } from 'express';
import { z } from 'zod';
import { Settlement, Activity, Group } from '../models/index.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Validation schemas
const createSettlementSchema = z.object({
  groupId: z.string().optional(),
  toUser: z.string(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional(),
  note: z.string().max(500).optional(),
});

// Get all settlements for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, limit = '50', offset = '0' } = req.query;

    const query: Record<string, unknown> = {
      $or: [
        { fromUser: req.userId },
        { toUser: req.userId },
      ],
    };

    if (groupId) {
      query.groupId = groupId;
    }

    const settlements = await Settlement.find(query)
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .populate('groupId', 'name')
      .sort({ settledAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Settlement.countDocuments(query);

    res.json({ settlements, total });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// Create settlement
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createSettlementSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      });
      return;
    }

    const { groupId, toUser, amount, currency, note } = validation.data;

    // Verify user has access to group if groupId is provided
    if (groupId) {
      const group = await Group.findOne({
        _id: groupId,
        'members.userId': req.userId,
      });

      if (!group) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
      }
    }

    // Create settlement
    const settlement = new Settlement({
      groupId,
      fromUser: req.userId,
      toUser,
      amount,
      currency: currency || 'INR',
      note,
      settledAt: new Date(),
    });

    await settlement.save();

    // Create activity
    await Activity.create({
      type: 'settlement_added',
      groupId,
      userId: req.userId,
      targetUserId: toUser,
      settlementId: settlement._id,
      data: { amount, currency: currency || 'INR' },
    });

    // Populate and return
    await settlement.populate('fromUser', 'name email avatar');
    await settlement.populate('toUser', 'name email avatar');
    if (groupId) await settlement.populate('groupId', 'name');

    res.status(201).json({ settlement });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

// Get settlement by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const settlement = await Settlement.findById(req.params.id)
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .populate('groupId', 'name');

    if (!settlement) {
      res.status(404).json({ error: 'Settlement not found' });
      return;
    }

    // Check access
    const hasAccess = 
      settlement.fromUser._id.toString() === req.userId ||
      settlement.toUser._id.toString() === req.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Not authorized to view this settlement' });
      return;
    }

    res.json({ settlement });
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({ error: 'Failed to fetch settlement' });
  }
});

export default router;
