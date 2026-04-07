import mongoose, { Document, Schema } from 'mongoose';

export interface ISettlement extends Document {
  _id: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  note?: string;
  settledAt: Date;
  createdAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    note: {
      type: String,
      trim: true,
    },
    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
settlementSchema.index({ groupId: 1 });
settlementSchema.index({ fromUser: 1 });
settlementSchema.index({ toUser: 1 });

export const Settlement = mongoose.model<ISettlement>('Settlement', settlementSchema);
