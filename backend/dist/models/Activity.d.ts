import mongoose, { Document } from 'mongoose';
export type ActivityType = 'expense_added' | 'expense_updated' | 'expense_deleted' | 'settlement_added' | 'group_created' | 'group_updated' | 'member_joined' | 'member_left';
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
export declare const Activity: mongoose.Model<IActivity, {}, {}, {}, mongoose.Document<unknown, {}, IActivity, {}, {}> & IActivity & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Activity.d.ts.map