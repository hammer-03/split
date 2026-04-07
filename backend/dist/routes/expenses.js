"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const index_js_1 = require("../models/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.auth);
// Validation schemas
const splitSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    amount: zod_1.z.number().min(0),
    percentage: zod_1.z.number().min(0).max(100).optional(),
    shares: zod_1.z.number().min(0).optional(),
});
const createExpenseSchema = zod_1.z.object({
    groupId: zod_1.z.string().optional(),
    description: zod_1.z.string().min(1, 'Description is required').max(200),
    amount: zod_1.z.number().positive('Amount must be positive'),
    currency: zod_1.z.string().length(3).optional(),
    category: zod_1.z.string().optional(),
    paidBy: zod_1.z.string(),
    splitType: zod_1.z.enum(['equal', 'exact', 'percentage', 'shares']),
    splits: zod_1.z.array(splitSchema),
    receipt: zod_1.z.string().url().optional(),
    notes: zod_1.z.string().max(500).optional(),
    date: zod_1.z.string().datetime().optional(),
});
const updateExpenseSchema = createExpenseSchema.partial();
// Get all expenses for current user
router.get('/', async (req, res) => {
    try {
        const { groupId, category, startDate, endDate, limit = '50', offset = '0' } = req.query;
        const query = {
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
            if (startDate)
                query.date.$gte = new Date(startDate);
            if (endDate)
                query.date.$lte = new Date(endDate);
        }
        const expenses = await index_js_1.Expense.find(query)
            .populate('paidBy', 'name email avatar')
            .populate('splits.userId', 'name email avatar')
            .populate('groupId', 'name')
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));
        const total = await index_js_1.Expense.countDocuments(query);
        res.json({ expenses, total });
    }
    catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});
// Create expense
router.post('/', async (req, res) => {
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
            const group = await index_js_1.Group.findOne({
                _id: groupId,
                'members.userId': req.userId,
            });
            if (!group) {
                res.status(403).json({ error: 'Not a member of this group' });
                return;
            }
        }
        // Create expense
        const expense = new index_js_1.Expense({
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
        await index_js_1.Activity.create({
            type: 'expense_added',
            groupId,
            userId: req.userId,
            expenseId: expense._id,
            data: { description, amount, currency: currency || 'USD' },
        });
        // Populate and return
        await expense.populate('paidBy', 'name email avatar');
        await expense.populate('splits.userId', 'name email avatar');
        if (groupId)
            await expense.populate('groupId', 'name');
        res.status(201).json({ expense });
    }
    catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});
// Get expense by ID
router.get('/:id', async (req, res) => {
    try {
        const expense = await index_js_1.Expense.findById(req.params.id)
            .populate('paidBy', 'name email avatar')
            .populate('splits.userId', 'name email avatar')
            .populate('groupId', 'name')
            .populate('createdBy', 'name email avatar');
        if (!expense) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }
        // Check access
        const hasAccess = expense.paidBy._id.toString() === req.userId ||
            expense.splits.some(s => s.userId._id.toString() === req.userId) ||
            expense.createdBy._id.toString() === req.userId;
        if (!hasAccess) {
            res.status(403).json({ error: 'Not authorized to view this expense' });
            return;
        }
        res.json({ expense });
    }
    catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ error: 'Failed to fetch expense' });
    }
});
// Update expense
router.patch('/:id', async (req, res) => {
    try {
        const validation = updateExpenseSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
            return;
        }
        const expense = await index_js_1.Expense.findById(req.params.id);
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
        await index_js_1.Activity.create({
            type: 'expense_updated',
            groupId: expense.groupId,
            userId: req.userId,
            expenseId: expense._id,
            data: { updates: validation.data },
        });
        // Populate and return
        await expense.populate('paidBy', 'name email avatar');
        await expense.populate('splits.userId', 'name email avatar');
        if (expense.groupId)
            await expense.populate('groupId', 'name');
        res.json({ expense });
    }
    catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});
// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await index_js_1.Expense.findById(req.params.id);
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
        await index_js_1.Activity.create({
            type: 'expense_deleted',
            groupId: expense.groupId,
            userId: req.userId,
            data: { description: expense.description, amount: expense.amount },
        });
        await index_js_1.Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});
exports.default = router;
//# sourceMappingURL=expenses.js.map