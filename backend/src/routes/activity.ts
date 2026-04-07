import { Router, Response } from 'express';
import { Activity, Group } from '../models/index.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Get activity feed for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;

    // Get user's groups
    const userGroups = await Group.find({ 'members.userId': req.userId }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    // Get activities from user's groups and personal activities
    const activities = await Activity.find({
      $or: [
        { groupId: { $in: groupIds } },
        { userId: req.userId },
        { targetUserId: req.userId },
      ],
    })
      .populate('userId', 'name email avatar')
      .populate('targetUserId', 'name email avatar')
      .populate('groupId', 'name')
      .populate('expenseId', 'description amount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Activity.countDocuments({
      $or: [
        { groupId: { $in: groupIds } },
        { userId: req.userId },
        { targetUserId: req.userId },
      ],
    });

    res.json({ activities, total });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get activity for specific group
router.get('/group/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;

    // Verify user is member of group
    const group = await Group.findOne({
      _id: req.params.groupId,
      'members.userId': req.userId,
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const activities = await Activity.find({ groupId: req.params.groupId })
      .populate('userId', 'name email avatar')
      .populate('targetUserId', 'name email avatar')
      .populate('expenseId', 'description amount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Activity.countDocuments({ groupId: req.params.groupId });

    res.json({ activities, total });
  } catch (error) {
    console.error('Get group activity error:', error);
    res.status(500).json({ error: 'Failed to fetch group activity' });
  }
});

export default router;
