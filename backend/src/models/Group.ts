import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  category: 'trip' | 'home' | 'couple' | 'friends' | 'work' | 'other';
  members: IGroupMember[];
  simplifyDebts: boolean;
  defaultSplitType: 'equal' | 'exact' | 'percentage' | 'shares';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['trip', 'home', 'couple', 'friends', 'work', 'other'],
      default: 'other',
    },
    members: [groupMemberSchema],
    simplifyDebts: {
      type: Boolean,
      default: true,
    },
    defaultSplitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      default: 'equal',
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

// Index for faster queries
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ createdBy: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
