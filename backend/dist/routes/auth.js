"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const index_js_1 = require("../models/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(1, 'Name is required').max(100),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Register
router.post('/register', async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
            return;
        }
        const { email, password, name } = validation.data;
        // Check if user already exists
        const existingUser = await index_js_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        // Create user
        const user = new index_js_1.User({
            email: email.toLowerCase(),
            password,
            name,
        });
        await user.save();
        // Generate token
        const token = (0, auth_js_1.generateToken)(user._id.toString());
        res.status(201).json({
            message: 'User registered successfully',
            user: user.toJSON(),
            token,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
            return;
        }
        const { email, password } = validation.data;
        // Find user
        const user = await index_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Generate token
        const token = (0, auth_js_1.generateToken)(user._id.toString());
        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
// Get current user
router.get('/me', auth_js_1.auth, async (req, res) => {
    try {
        res.json({ user: req.user?.toJSON() });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
// Update profile
router.patch('/profile', auth_js_1.auth, async (req, res) => {
    try {
        const updateSchema = zod_1.z.object({
            name: zod_1.z.string().min(1).max(100).optional(),
            avatar: zod_1.z.string().url().optional(),
            currency: zod_1.z.string().length(3).optional(),
        });
        const validation = updateSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
            return;
        }
        const user = await index_js_1.User.findByIdAndUpdate(req.userId, { $set: validation.data }, { new: true });
        res.json({ user: user?.toJSON() });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map