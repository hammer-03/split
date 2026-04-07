import { Router, Response } from 'express';
import { Expense } from '../models/index.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

// All routes require authentication
router.use(auth);

// Get spending analytics
router.get('/spending', async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId!);
    
    // 1. Spending by Category (Current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const categoryData = await Expense.aggregate([
      {
        $match: {
          'splits.userId': userId,
          date: { $gte: startOfMonth }
        }
      },
      { $unwind: "$splits" },
      { $match: { "splits.userId": userId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$splits.amount" }
        }
      },
      { $project: { category: '$_id', total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]);

    // 2. Spending Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const trendData = await Expense.aggregate([
      {
        $match: {
          'splits.userId': userId,
          date: { $gte: sixMonthsAgo }
        }
      },
      { $unwind: "$splits" },
      { $match: { "splits.userId": userId } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$splits.amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 3. Insights
    const currentMonthTotal = categoryData.reduce((acc, curr) => acc + curr.total, 0);
    
    // Get last month's data
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfMonth);
    endOfLastMonth.setSeconds(-1);

    const lastMonthData = await Expense.aggregate([
      {
        $match: {
          'splits.userId': userId,
          date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      { $unwind: "$splits" },
      { $match: { "splits.userId": userId } },
      { $group: { _id: null, total: { $sum: "$splits.amount" } } }
    ]);

    const lastMonthTotal = lastMonthData[0]?.total || 0;
    const percentageChange = lastMonthTotal > 0 
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    const insights = [
      {
        type: percentageChange > 0 ? 'increase' : 'decrease',
        text: `You spent ${Math.abs(Math.round(percentageChange))}% ${percentageChange > 0 ? 'more' : 'less'} than last month.`,
        value: currentMonthTotal
      },
      {
        type: 'top_category',
        text: categoryData[0] ? `Your highest spending category is ${categoryData[0].category}.` : 'No category data yet.',
        value: categoryData[0]?.total || 0
      }
    ];

    res.json({
      categoryData,
      trendData: trendData.map(t => ({
        month: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short' }),
        year: t._id.year,
        total: t.total
      })),
      insights,
      currentMonthTotal
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
