"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../models/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.auth);
// Search users by email or name
router.get('/search', async (req, res) => {
    try {
        const { q, limit = '10' } = req.query;
        if (!q || q.length < 2) {
            res.status(400).json({ error: 'Search query must be at least 2 characters' });
            return;
        }
        const searchRegex = new RegExp(q, 'i');
        const users = await index_js_1.User.find({
            _id: { $ne: req.userId },
            $or: [
                { email: searchRegex },
                { name: searchRegex },
            ],
        })
            .select('name email avatar')
            .limit(parseInt(limit));
        res.json({ users });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});
// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await index_js_1.User.findById(req.params.id).select('name email avatar currency');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// Add friend
router.post('/friends/:id', async (req, res) => {
    try {
        const friendId = req.params.id;
        if (friendId === req.userId) {
            res.status(400).json({ error: 'Cannot add yourself as a friend' });
            return;
        }
        const friend = await index_js_1.User.findById(friendId);
        if (!friend) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Add friend to both users
        await index_js_1.User.findByIdAndUpdate(req.userId, {
            $addToSet: { friends: friendId },
        });
        await index_js_1.User.findByIdAndUpdate(friendId, {
            $addToSet: { friends: req.userId },
        });
        res.json({ message: 'Friend added successfully' });
    }
    catch (error) {
        console.error('Add friend error:', error);
        res.status(500).json({ error: 'Failed to add friend' });
    }
});
// Remove friend
router.delete('/friends/:id', async (req, res) => {
    try {
        const friendId = req.params.id;
        // Remove friend from both users
        await index_js_1.User.findByIdAndUpdate(req.userId, {
            $pull: { friends: friendId },
        });
        await index_js_1.User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.userId },
        });
        res.json({ message: 'Friend removed successfully' });
    }
    catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});
// Get friends list
router.get('/me/friends', async (req, res) => {
    try {
        const user = await index_js_1.User.findById(req.userId)
            .populate('friends', 'name email avatar');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ friends: user.friends });
    }
    catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map