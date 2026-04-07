import mongoose, { Document, Schema } from 'mongoose';

export type ActivityType = 
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_added'
  | 'group_created'
  | 'group_updated'
  | 'member_joined'
  | 'member_left';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  type: ActivityType;
  groupId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  targetUserId?: mongoose.Types.ObjectId;
  expenseId?: mongoose.Types.ObjectId;
  settlementId?: mongoose.Types.ObjectId;
  data: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'expense_added',
        'expense_updated',
        'expense_deleted',
        'settlement_added',
        'group_created',
        'group_updated',
        'member_joined',
        'member_left',
      ],
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
    },
    settlementId: {
      type: Schema.Types.ObjectId,
      ref: 'Settlement',
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
activitySchema.index({ groupId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
