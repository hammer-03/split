import mongoose, { Document } from 'mongoose';
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
export declare const Settlement: mongoose.Model<ISettlement, {}, {}, {}, mongoose.Document<unknown, {}, ISettlement, {}, {}> & ISettlement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Settlement.d.ts.map