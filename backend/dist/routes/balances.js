"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../models/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.auth);
// Calculate balances from expenses and settlements
async function calculateBalances(userId, groupId) {
    const balances = {};
    // Build query for expenses
    const expenseQuery = {
        $or: [
            { paidBy: userId },
            { 'splits.userId': userId },
        ],
    };
    if (groupId) {
        expenseQuery.groupId = groupId;
    }
    // Get all relevant expenses
    const expenses = await index_js_1.Expense.find(expenseQuery);
    for (const expense of expenses) {
        const paidById = expense.paidBy.toString();
        for (const split of expense.splits) {
            const splitUserId = split.userId.toString();
            if (paidById === userId && splitUserId !== userId) {
                // I paid, they owe me
                balances[splitUserId] = (balances[splitUserId] || 0) + split.amount;
            }
            else if (paidById !== userId && splitUserId === userId) {
                // They paid, I owe them
                balances[paidById] = (balances[paidById] || 0) - split.amount;
            }
        }
    }
    // Build query for settlements
    const settlementQuery = {
        $or: [
            { fromUser: userId },
            { toUser: userId },
        ],
    };
    if (groupId) {
        settlementQuery.groupId = groupId;
    }
    // Get all relevant settlements
    const settlements = await index_js_1.Settlement.find(settlementQuery);
    for (const settlement of settlements) {
        const fromUserId = settlement.fromUser.toString();
        const toUserId = settlement.toUser.toString();
        if (fromUserId === userId) {
            // I paid them (reduced my debt or they owe me less)
            balances[toUserId] = (balances[toUserId] || 0) + settlement.amount;
        }
        else if (toUserId === userId) {
            // They paid me (reduced their debt)
            balances[fromUserId] = (balances[fromUserId] || 0) - settlement.amount;
        }
    }
    // Calculate totals
    let totalOwed = 0;
    let totalOwing = 0;
    for (const balance of Object.values(balances)) {
        if (balance > 0) {
            totalOwed += balance; // Others owe me
        }
        else {
            totalOwing += Math.abs(balance); // I owe others
        }
    }
    return { balances, totalOwed, totalOwing };
}
// Get overall balance summary
router.get('/', async (req, res) => {
    try {
        const { balances, totalOwed, totalOwing } = await calculateBalances(req.userId);
        // Get user details for each balance
        const userIds = Object.keys(balances).filter(id => balances[id] !== 0);
        const users = await index_js_1.User.find({ _id: { $in: userIds } }).select('name email avatar');
        const userMap = new Map(users.map(u => [u._id.toString(), u]));
        const balanceDetails = userIds.map(userId => {
            const user = userMap.get(userId);
            return {
                userId,
                name: user?.name || 'Unknown',
                email: user?.email || '',
                avatar: user?.avatar,
                balance: Math.round(balances[userId] * 100) / 100,
            };
        }).filter(b => Math.abs(b.balance) > 0.01);
        res.json({
            totalOwed: Math.round(totalOwed * 100) / 100,
            totalOwing: Math.round(totalOwing * 100) / 100,
            netBalance: Math.round((totalOwed - totalOwing) * 100) / 100,
            balances: balanceDetails,
        });
    }
    catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({ error: 'Failed to calculate balances' });
    }
});
// Get balance for specific group
router.get('/group/:groupId', async (req, res) => {
    try {
        // Verify user is member of group
        const group = await index_js_1.Group.findOne({
            _id: req.params.groupId,
            'members.userId': req.userId,
        }).populate('members.userId', 'name email avatar');
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const { balances, totalOwed, totalOwing } = await calculateBalances(req.userId, req.params.groupId);
        // Get balance details for group members
        const balanceDetails = group.members
            .filter(m => m.userId._id.toString() !== req.userId)
            .map(member => {
            const user = member.userId;
            const userId = user._id.toString();
            return {
                userId,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                balance: Math.round((balances[userId] || 0) * 100) / 100,
            };
        });
        res.json({
            group: {
                _id: group._id,
                name: group.name,
            },
            totalOwed: Math.round(totalOwed * 100) / 100,
            totalOwing: Math.round(totalOwing * 100) / 100,
            netBalance: Math.round((totalOwed - totalOwing) * 100) / 100,
            balances: balanceDetails,
        });
    }
    catch (error) {
        console.error('Get group balances error:', error);
        res.status(500).json({ error: 'Failed to calculate group balances' });
    }
});
// Get balance with specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const otherUser = await index_js_1.User.findById(req.params.userId).select('name email avatar');
        if (!otherUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { balances } = await calculateBalances(req.userId);
        const balance = balances[req.params.userId] || 0;
        res.json({
            user: {
                _id: otherUser._id,
                name: otherUser.name,
                email: otherUser.email,
                avatar: otherUser.avatar,
            },
            balance: Math.round(balance * 100) / 100,
            direction: balance > 0 ? 'they_owe_you' : balance < 0 ? 'you_owe_them' : 'settled',
        });
    }
    catch (error) {
        console.error('Get user balance error:', error);
        res.status(500).json({ error: 'Failed to calculate balance' });
    }
});
// Simplify debts within a group (Smart Settlement)
router.get('/simplify/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const group = await index_js_1.Group.findById(groupId).populate('members.userId', 'name email avatar');
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        // 1. Calculate net balance for EVERY member in the group
        const memberBalances = {};
        const memberDetails = {};
        for (const member of group.members) {
            const user = member.userId;
            const userId = user._id.toString();
            memberBalances[userId] = 0;
            memberDetails[userId] = {
                _id: userId,
                name: user.name,
                avatar: user.avatar,
            };
        }
        // Get all expenses for this group
        const expenses = await index_js_1.Expense.find({ groupId });
        for (const expense of expenses) {
            const paidBy = expense.paidBy.toString();
            if (memberBalances[paidBy] !== undefined) {
                memberBalances[paidBy] += expense.amount;
            }
            for (const split of expense.splits) {
                const splitUser = split.userId.toString();
                if (memberBalances[splitUser] !== undefined) {
                    memberBalances[splitUser] -= split.amount;
                }
            }
        }
        // Get all settlements for this group
        const settlements = await index_js_1.Settlement.find({ groupId });
        for (const settlement of settlements) {
            const fromUser = settlement.fromUser.toString();
            const toUser = settlement.toUser.toString();
            if (memberBalances[fromUser] !== undefined) {
                memberBalances[fromUser] += settlement.amount;
            }
            if (memberBalances[toUser] !== undefined) {
                memberBalances[toUser] -= settlement.amount;
            }
        }
        // 2. Separate into debtors and creditors
        let debtors = [];
        let creditors = [];
        for (const [id, balance] of Object.entries(memberBalances)) {
            const roundedBalance = Math.round(balance * 100) / 100;
            if (roundedBalance < 0) {
                debtors.push({ id, amount: Math.abs(roundedBalance) });
            }
            else if (roundedBalance > 0) {
                creditors.push({ id, amount: roundedBalance });
            }
        }
        // Sort to prioritize large debts/credits
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        // 3. Match debtors and creditors (Minimize transactions)
        const suggestedTransactions = [];
        let d = 0;
        let c = 0;
        while (d < debtors.length && c < creditors.length) {
            const debtor = debtors[d];
            const creditor = creditors[c];
            const settlementAmount = Math.min(debtor.amount, creditor.amount);
            if (settlementAmount > 0.01) {
                suggestedTransactions.push({
                    from: memberDetails[debtor.id],
                    to: memberDetails[creditor.id],
                    amount: Math.round(settlementAmount * 100) / 100,
                });
            }
            debtor.amount -= settlementAmount;
            creditor.amount -= settlementAmount;
            if (debtor.amount < 0.01)
                d++;
            if (creditor.amount < 0.01)
                c++;
        }
        res.json({ suggestedTransactions });
    }
    catch (error) {
        console.error('Simplify debts error:', error);
        res.status(500).json({ error: 'Failed to simplify debts' });
    }
});
exports.default = router;
//# sourceMappingURL=balances.js.map