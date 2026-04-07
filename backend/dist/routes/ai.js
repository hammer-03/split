"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const auth_js_1 = require("../middleware/auth.js");
const index_js_1 = require("../models/index.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.auth);
const parseSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, 'Text is required').max(500),
    groupId: zod_1.z.string().optional(),
});
router.post('/parse-expense', async (req, res) => {
    try {
        const validation = parseSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }
        const { text, groupId } = validation.data;
        let groupContext = '';
        if (groupId) {
            const group = await index_js_1.Group.findById(groupId).populate('members.userId', 'name email');
            if (group) {
                const memberNames = group.members.map(m => m.userId.name).join(', ');
                groupContext = `The group members are: ${memberNames}. `;
            }
        }
        const prompt = `
      You are an expert at parsing text into structured expense data.
      Given the input text: "${text}"
      ${groupContext}
      Extract the following fields and return ONLY a JSON object:
      {
        "description": "Short description of the expense",
        "amount": 0.00,
        "paidBy": "Name of the person who paid (should match one of the group members if provided)",
        "category": "One of: food, transport, shopping, entertainment, utilities, rent, travel, general",
        "date": "ISO 8601 date string if mentioned, otherwise current date"
      }
      If a field is missing, use sensible defaults. Description and amount are mandatory.
    `;
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key') {
            res.status(500).json({ error: 'Groq API Key is not configured correctly on the server.' });
            return;
        }
        const groq = new groq_sdk_1.default({
            apiKey: process.env.GROQ_API_KEY,
        });
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });
        const result = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
        // Try to find the user ID for "paidBy"
        if (groupId && result.paidBy) {
            const group = await index_js_1.Group.findById(groupId).populate('members.userId', 'name');
            if (group) {
                const foundMember = group.members.find(m => m.userId.name.toLowerCase().includes(result.paidBy.toLowerCase()));
                if (foundMember) {
                    result.paidByUserId = foundMember.userId._id;
                }
            }
        }
        res.json({ result });
    }
    catch (error) {
        console.error('AI parse error:', error);
        res.status(500).json({ error: 'Failed to parse expense using AI' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map