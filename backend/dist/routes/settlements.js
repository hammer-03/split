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
const createSettlementSchema = zod_1.z.object({
    groupId: zod_1.z.string().optional(),
    toUser: zod_1.z.string(),
    amount: zod_1.z.number().positive('Amount must be positive'),
    currency: zod_1.z.string().length(3).optional(),
    note: zod_1.z.string().max(500).optional(),
});
// Get all settlements for current user
router.get('/', async (req, res) => {
    try {
        const { groupId, limit = '50', offset = '0' } = req.query;
        const query = {
            $or: [
                { fromUser: req.userId },
                { toUser: req.userId },
            ],
        };
        if (groupId) {
            query.groupId = groupId;
        }
        const settlements = await index_js_1.Settlement.find(query)
            .populate('fromUser', 'name email avatar')
            .populate('toUser', 'name email avatar')
            .populate('groupId', 'name')
            .sort({ settledAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));
        const total = await index_js_1.Settlement.countDocuments(query);
        res.json({ settlements, total });
    }
    catch (error) {
        console.error('Get settlements error:', error);
        res.status(500).json({ error: 'Failed to fetch settlements' });
    }
});
// Create settlement
router.post('/', async (req, res) => {
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
            const group = await index_js_1.Group.findOne({
                _id: groupId,
                'members.userId': req.userId,
            });
            if (!group) {
                res.status(403).json({ error: 'Not a member of this group' });
                return;
            }
        }
        // Create settlement
        const settlement = new index_js_1.Settlement({
            groupId,
            fromUser: req.userId,
            toUser,
            amount,
            currency: currency || 'USD',
            note,
            settledAt: new Date(),
        });
        await settlement.save();
        // Create activity
        await index_js_1.Activity.create({
            type: 'settlement_added',
            groupId,
            userId: req.userId,
            targetUserId: toUser,
            settlementId: settlement._id,
            data: { amount, currency: currency || 'USD' },
        });
        // Populate and return
        await settlement.populate('fromUser', 'name email avatar');
        await settlement.populate('toUser', 'name email avatar');
        if (groupId)
            await settlement.populate('groupId', 'name');
        res.status(201).json({ settlement });
    }
    catch (error) {
        console.error('Create settlement error:', error);
        res.status(500).json({ error: 'Failed to create settlement' });
    }
});
// Get settlement by ID
router.get('/:id', async (req, res) => {
    try {
        const settlement = await index_js_1.Settlement.findById(req.params.id)
            .populate('fromUser', 'name email avatar')
            .populate('toUser', 'name email avatar')
            .populate('groupId', 'name');
        if (!settlement) {
            res.status(404).json({ error: 'Settlement not found' });
            return;
        }
        // Check access
        const hasAccess = settlement.fromUser._id.toString() === req.userId ||
            settlement.toUser._id.toString() === req.userId;
        if (!hasAccess) {
            res.status(403).json({ error: 'Not authorized to view this settlement' });
            return;
        }
        res.json({ settlement });
    }
    catch (error) {
        console.error('Get settlement error:', error);
        res.status(500).json({ error: 'Failed to fetch settlement' });
    }
});
exports.default = router;
//# sourceMappingURL=settlements.js.map