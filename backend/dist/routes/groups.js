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
const createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.enum(['trip', 'home', 'couple', 'friends', 'work', 'other']).optional(),
    memberEmails: zod_1.z.array(zod_1.z.string().email()).optional(),
});
const updateGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.enum(['trip', 'home', 'couple', 'friends', 'work', 'other']).optional(),
    simplifyDebts: zod_1.z.boolean().optional(),
    defaultSplitType: zod_1.z.enum(['equal', 'exact', 'percentage', 'shares']).optional(),
});
// Get all groups for current user
router.get('/', async (req, res) => {
    try {
        const groups = await index_js_1.Group.find({ 'members.userId': req.userId })
            .populate('members.userId', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .sort({ updatedAt: -1 });
        res.json({ groups });
    }
    catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});
// Create group
router.post('/', async (req, res) => {
    try {
        const validation = createGroupSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
            return;
        }
        const { name, description, category, memberEmails } = validation.data;
        // Find members by email
        const memberUserIds = [];
        if (memberEmails?.length) {
            const users = await index_js_1.User.find({ email: { $in: memberEmails.map(e => e.toLowerCase()) } });
            memberUserIds.push(...users.map(u => u._id));
        }
        // Create group
        const group = new index_js_1.Group({
            name,
            description,
            category: category || 'other',
            members: [
                { userId: req.userId, role: 'admin' },
                ...memberUserIds
                    .filter(id => id.toString() !== req.userId)
                    .map(userId => ({ userId, role: 'member' })),
            ],
            createdBy: req.userId,
        });
        await group.save();
        // Create activity
        await index_js_1.Activity.create({
            type: 'group_created',
            groupId: group._id,
            userId: req.userId,
            data: { groupName: name },
        });
        // Populate and return
        await group.populate('members.userId', 'name email avatar');
        await group.populate('createdBy', 'name email avatar');
        res.status(201).json({ group });
    }
    catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});
// Get group by ID
router.get('/:id', async (req, res) => {
    try {
        const group = await index_js_1.Group.findOne({
            _id: req.params.id,
            'members.userId': req.userId,
        })
            .populate('members.userId', 'name email avatar')
            .populate('createdBy', 'name email avatar');
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        res.json({ group });
    }
    catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});
// Update group
router.patch('/:id', async (req, res) => {
    try {
        const validation = updateGroupSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
            return;
        }
        // Check if user is admin
        const group = await index_js_1.Group.findOne({
            _id: req.params.id,
            'members.userId': req.userId,
        });
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const member = group.members.find(m => m.userId.toString() === req.userId);
        if (member?.role !== 'admin') {
            res.status(403).json({ error: 'Only admins can update group settings' });
            return;
        }
        // Update group
        const updatedGroup = await index_js_1.Group.findByIdAndUpdate(req.params.id, { $set: validation.data }, { new: true })
            .populate('members.userId', 'name email avatar')
            .populate('createdBy', 'name email avatar');
        // Create activity
        await index_js_1.Activity.create({
            type: 'group_updated',
            groupId: group._id,
            userId: req.userId,
            data: { updates: validation.data },
        });
        res.json({ group: updatedGroup });
    }
    catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});
// Add member to group
router.post('/:id/members', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        // Find user by email
        const userToAdd = await index_js_1.User.findOne({ email: email.toLowerCase() });
        if (!userToAdd) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Check if user is admin
        const group = await index_js_1.Group.findOne({
            _id: req.params.id,
            'members.userId': req.userId,
        });
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const member = group.members.find(m => m.userId.toString() === req.userId);
        if (member?.role !== 'admin') {
            res.status(403).json({ error: 'Only admins can add members' });
            return;
        }
        // Check if already a member
        if (group.members.some(m => m.userId.toString() === userToAdd._id.toString())) {
            res.status(400).json({ error: 'User is already a member' });
            return;
        }
        // Add member
        group.members.push({ userId: userToAdd._id, role: 'member', joinedAt: new Date() });
        await group.save();
        // Create activity
        await index_js_1.Activity.create({
            type: 'member_joined',
            groupId: group._id,
            userId: req.userId,
            targetUserId: userToAdd._id,
            data: { memberName: userToAdd.name },
        });
        await group.populate('members.userId', 'name email avatar');
        res.json({ group });
    }
    catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});
// Remove member from group
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const group = await index_js_1.Group.findOne({
            _id: req.params.id,
            'members.userId': req.userId,
        });
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const isAdmin = group.members.find(m => m.userId.toString() === req.userId)?.role === 'admin';
        const isSelf = req.params.userId === req.userId;
        if (!isAdmin && !isSelf) {
            res.status(403).json({ error: 'Not authorized to remove this member' });
            return;
        }
        // Can't remove the only admin
        if (isAdmin && isSelf) {
            const adminCount = group.members.filter(m => m.role === 'admin').length;
            if (adminCount <= 1) {
                res.status(400).json({ error: 'Cannot leave group as the only admin' });
                return;
            }
        }
        // Remove member
        group.members = group.members.filter(m => m.userId.toString() !== req.params.userId);
        await group.save();
        // Create activity
        await index_js_1.Activity.create({
            type: 'member_left',
            groupId: group._id,
            userId: req.userId,
            targetUserId: req.params.userId,
        });
        await group.populate('members.userId', 'name email avatar');
        res.json({ group });
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});
// Delete group
router.delete('/:id', async (req, res) => {
    try {
        const group = await index_js_1.Group.findOne({
            _id: req.params.id,
            'members.userId': req.userId,
        });
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const member = group.members.find(m => m.userId.toString() === req.userId);
        if (member?.role !== 'admin') {
            res.status(403).json({ error: 'Only admins can delete the group' });
            return;
        }
        await index_js_1.Group.findByIdAndDelete(req.params.id);
        res.json({ message: 'Group deleted successfully' });
    }
    catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});
exports.default = router;
//# sourceMappingURL=groups.js.map