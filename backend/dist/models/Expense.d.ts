import mongoose, { Document } from 'mongoose';
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
export declare const Expense: mongoose.Model<IExpense, {}, {}, {}, mongoose.Document<unknown, {}, IExpense, {}, {}> & IExpense & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Expense.d.ts.map