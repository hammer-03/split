import { Router, Response } from 'express';
import { z } from 'zod';
import { Expense, Activity, Group } from '../models/index.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Validation schemas
const splitSchema = z.object({
  userId: z.string(),
  amount: z.number().min(0),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().min(0).optional(),
});

const createExpenseSchema = z.object({
  groupId: z.string().optional(),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional(),
  category: z.string().optional(),
  paidBy: z.string(),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares']),
  splits: z.array(splitSchema),
  receipt: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

// Get all expenses for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, category, startDate, endDate, limit = '50', offset = '0' } = req.query;

    const query: Record<string, unknown> = {
      $or: [
        { paidBy: req.userId },
        { 'splits.userId': req.userId },
      ],
    };

    if (groupId) {
      query.groupId = groupId;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = new Date(startDate as string);
      if (endDate) (query.date as Record<string, unknown>).$lte = new Date(endDate as string);
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email avatar')
      .populate('groupId', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Expense.countDocuments(query);

    res.json({ expenses, total });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create expense
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createExpenseSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      });
      return;
    }

    const { groupId, description, amount, currency, category, paidBy, splitType, splits, receipt, notes, date } = validation.data;

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

    // Create expense
    const expense = new Expense({
      groupId,
      description,
      amount,
      currency: currency || 'USD',
      category: category || 'general',
      paidBy,
      splitType,
      splits,
      receipt,
      notes,
      date: date ? new Date(date) : new Date(),
      createdBy: req.userId,
    });

    await expense.save();

    // Create activity
    await Activity.create({
      type: 'expense_added',
      groupId,
      userId: req.userId,
      expenseId: expense._id,
      data: { description, amount, currency: currency || 'USD' },
    });

    // Populate and return
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.userId', 'name email avatar');
    if (groupId) await expense.populate('groupId', 'name');

    res.status(201).json({ expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get expense by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email avatar')
      .populate('groupId', 'name')
      .populate('createdBy', 'name email avatar');

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Check access
    const hasAccess = 
      expense.paidBy._id.toString() === req.userId ||
      expense.splits.some(s => s.userId._id.toString() === req.userId) ||
      expense.createdBy._id.toString() === req.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Not authorized to view this expense' });
      return;
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Update expense
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const validation = updateExpenseSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      });
      return;
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Only creator can edit
    if (expense.createdBy.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized to edit this expense' });
      return;
    }

    // Update expense
    Object.assign(expense, validation.data);
    if (validation.data.date) {
      expense.date = new Date(validation.data.date);
    }
    await expense.save();

    // Create activity
    await Activity.create({
      type: 'expense_updated',
      groupId: expense.groupId,
      userId: req.userId,
      expenseId: expense._id,
      data: { updates: validation.data },
    });

    // Populate and return
    await expense.populate('paidBy', 'name email avatar');
    await expense.populate('splits.userId', 'name email avatar');
    if (expense.groupId) await expense.populate('groupId', 'name');

    res.json({ expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Only creator can delete
    if (expense.createdBy.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized to delete this expense' });
      return;
    }

    // Create activity before deleting
    await Activity.create({
      type: 'expense_deleted',
      groupId: expense.groupId,
      userId: req.userId,
      data: { description: expense.description, amount: expense.amount },
    });

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
