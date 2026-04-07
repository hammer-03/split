import mongoose, { Document } from 'mongoose';
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
export declare const Group: mongoose.Model<IGroup, {}, {}, {}, mongoose.Document<unknown, {}, IGroup, {}, {}> & IGroup & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Group.d.ts.map