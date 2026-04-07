"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../models/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.auth);
// Get activity feed for current user
router.get('/', async (req, res) => {
    try {
        const { limit = '50', offset = '0' } = req.query;
        // Get user's groups
        const userGroups = await index_js_1.Group.find({ 'members.userId': req.userId }).select('_id');
        const groupIds = userGroups.map(g => g._id);
        // Get activities from user's groups and personal activities
        const activities = await index_js_1.Activity.find({
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
            .limit(parseInt(limit))
            .skip(parseInt(offset));
        const total = await index_js_1.Activity.countDocuments({
            $or: [
                { groupId: { $in: groupIds } },
                { userId: req.userId },
                { targetUserId: req.userId },
            ],
        });
        res.json({ activities, total });
    }
    catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});
// Get activity for specific group
router.get('/group/:groupId', async (req, res) => {
    try {
        const { limit = '50', offset = '0' } = req.query;
        // Verify user is member of group
        const group = await index_js_1.Group.findOne({
            _id: req.params.groupId,
            'members.userId': req.userId,
        });
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const activities = await index_js_1.Activity.find({ groupId: req.params.groupId })
            .populate('userId', 'name email avatar')
            .populate('targetUserId', 'name email avatar')
            .populate('expenseId', 'description amount')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));
        const total = await index_js_1.Activity.countDocuments({ groupId: req.params.groupId });
        res.json({ activities, total });
    }
    catch (error) {
        console.error('Get group activity error:', error);
        res.status(500).json({ error: 'Failed to fetch group activity' });
    }
});
exports.default = router;
//# sourceMappingURL=activity.js.map