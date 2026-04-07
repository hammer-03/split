import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Expense, User } from '../src/models/index.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/splitease';

async function testAgg() {
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ email: 'abc@test.com' });
  const userId = user._id;

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
  ]);
  
  console.log("CATEGORY WITH UNWIND:", JSON.stringify(categoryData, null, 2));

  process.exit();
}
testAgg();
