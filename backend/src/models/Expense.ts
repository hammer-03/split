import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseSplit {
  userId: mongoose.Types.ObjectId;
  amount: number;
  percentage?: number;
  shares?: number;
  paid: boolean;
}

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: mongoose.Types.ObjectId;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: IExpenseSplit[];
  receipt?: string;
  notes?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSplitSchema = new Schema<IExpenseSplit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
    shares: {
      type: Number,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    category: {
      type: String,
      default: 'general',
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      default: 'equal',
    },
    splits: [expenseSplitSchema],
    receipt: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splits.userId': 1 });
expenseSchema.index({ createdBy: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
