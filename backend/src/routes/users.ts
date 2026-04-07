import { Router, Response } from 'express';
import { User, Group, Expense, Settlement } from '../models/index.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Search users by email or name
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const searchRegex = new RegExp(q as string, 'i');

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { email: searchRegex },
        { name: searchRegex },
      ],
    })
      .select('name email avatar')
      .limit(parseInt(limit as string));

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar currency');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Add friend
router.post('/friends/:id', async (req: AuthRequest, res: Response) => {
  try {
    const friendId = req.params.id;

    if (friendId === req.userId) {
      res.status(400).json({ error: 'Cannot add yourself as a friend' });
      return;
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Add friend to both users
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $addToSet: { friends: req.userId },
    });

    res.json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Remove friend
router.delete('/friends/:id', async (req: AuthRequest, res: Response) => {
  try {
    const friendId = req.params.id;

    // Remove friend from both users
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId },
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Get friends list
router.get('/me/friends', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'name email avatar');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Data Backup Export (compiles all user data)
router.get('/me/backup', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const [groups, expenses, settlements] = await Promise.all([
      Group.find({ 'members.userId': userId }).select('name description category members createdBy createdAt'),
      Expense.find({
        $or: [
          { paidBy: userId },
          { 'splits.userId': userId },
        ],
      }).select('description amount currency category paidBy date splits createdBy'),
      Settlement.find({
        $or: [
          { fromUser: userId },
          { toUser: userId },
        ],
      }).select('amount currency note fromUser toUser settledAt'),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      user: {
        name: req.user?.name,
        email: req.user?.email,
      },
      data: {
        groups,
        expenses,
        settlements,
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

// 🚀 TURBO ENDPOINT: Fetch everything for the dashboard in one trip
router.get('/me/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const { Activity, Group, Expense, User } = await import('../models/index.js');
    const mongoose = (await import('mongoose')).default;
    
    const userIdStr = req.userId!;
    const userIdObj = new mongoose.Types.ObjectId(userIdStr);

    // Run all fetches in parallel on the server
    const [groups, expenses] = await Promise.all([
      Group.find({ 'members.userId': userIdObj })
        .populate('members.userId', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
       Expense.find({
        $or: [
          { paidBy: userIdObj },
          { 'splits.userId': userIdObj },
        ],
      }).lean(),
    ]);

    // Fetch activities based on the groups we found
    const groupIds = groups.map(g => g._id);
    const activities = await Activity.find({ 
      $or: [
        { userId: userIdObj },
        { groupId: { $in: groupIds } }
      ] 
    })
    .populate('userId', 'name email avatar')
    .populate('groupId', 'name')
    .populate('expenseId', 'description amount currency')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Calculate balances on the server (much faster than mobile CPU)
    let totalOwed = 0;
    let totalOwing = 0;

    expenses.forEach((expense: any) => {
      const isPayer = expense.paidBy.toString() === userIdStr;
      const userSplit = expense.splits.find((sValue: any) => sValue.userId.toString() === userIdStr);

      if (isPayer) {
        // You paid: The total amount minus your own split is what you are owed
        const userOwnShare = userSplit ? userSplit.amount : 0;
        totalOwed += (expense.amount - userOwnShare);
      } else if (userSplit) {
        // Someone else paid: Your split is what you owe
        totalOwing += userSplit.amount;
      }
    });

    res.json({
      groups,
      activities,
      balances: {
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing,
        balances: [] // Keeping compatible with frontend
      }
    });
  } catch (error) {
    console.error('Dashboard turbo error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;
