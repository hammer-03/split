'use client';

import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Users, UserPlus, UserMinus, Wallet, Edit, Trash2, ArrowUpRight } from 'lucide-react';
import type { Activity, User, Expense, Group } from '@/lib/api';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
}

const activityIcons: Record<string, React.ElementType> = {
  expense_added: Receipt,
  expense_updated: Edit,
  expense_deleted: Trash2,
  settlement_added: Wallet,
  group_created: Users,
  group_updated: Edit,
  member_joined: UserPlus,
  member_left: UserMinus,
};

const activityColors: Record<string, string> = {
  expense_added: 'from-amber-400 to-rose-500',
  expense_updated: 'from-blue-400 to-indigo-500',
  expense_deleted: 'from-rose-400 to-red-600',
  settlement_added: 'from-emerald-400 to-teal-600',
  group_created: 'from-violet-400 to-purple-600',
};

const activityMessages: Record<string, (activity: Activity) => string> = {
  expense_added: (a) => `added "${(a.data as { description?: string }).description || 'an expense'}"`,
  expense_updated: () => 'updated an expense',
  expense_deleted: (a) => `deleted "${(a.data as { description?: string }).description || 'an expense'}"`,
  settlement_added: (a) => {
    const amount = (a.data as { amount?: number }).amount || 0;
    return `settled ${formatCurrency(amount)}`;
  },
  group_created: (a) => `created "${(a.data as { groupName?: string }).groupName || 'a group'}"`,
  group_updated: () => 'updated group settings',
  member_joined: (a) => {
    const memberName = (a.data as { memberName?: string }).memberName;
    return memberName ? `added ${memberName}` : 'added a member';
  },
  member_left: () => 'left the group',
};

function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ActivityFeed({ activities, limit }: ActivityFeedProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (displayActivities.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-black uppercase tracking-tighter">Recent Activity</CardTitle>
          <CardDescription className="uppercase text-[10px] tracking-widest font-bold opacity-60">Your recent expense and group activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <ActivityIcon className="h-6 w-6 opacity-20" />
            </div>
            <p className="text-muted-foreground font-medium">No activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-2xl overflow-hidden border-white/10 group">
      <CardHeader className="relative">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
          <ActivityIcon className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-xl font-black uppercase tracking-tighter text-foreground">Pulse Feed</CardTitle>
        <CardDescription className="uppercase text-[10px] tracking-widest font-black opacity-40">Your Recent Ecosystem Activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col gap-6">
          {/* Enhanced Glowing vertical line */}
          <div className="absolute left-[18px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />
          
          {displayActivities.map((activity, idx) => {
            const Icon = activityIcons[activity.type] || Receipt;
            const gradientColors = activityColors[activity.type] || 'from-gray-400 to-gray-600';
            const user = typeof activity.userId === 'object' ? activity.userId as User : null;
            const group = activity.groupId && typeof activity.groupId === 'object' 
              ? activity.groupId as Group 
              : null;
            const expense = activity.expenseId && typeof activity.expenseId === 'object'
              ? activity.expenseId as Expense
              : null;
            
            const getMessage = activityMessages[activity.type];
            const message = getMessage ? getMessage(activity) : activity.type;

            return (
              <motion.div 
                key={activity._id} 
                className="relative flex gap-4 pl-12 group/item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {/* Glowing Dot on line */}
                <div className="absolute left-[16.5px] top-[14px] w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                
                {/* Activity Icon with Gradient */}
                <div className={cn(
                  "absolute left-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-black/20 group-hover/item:scale-110 transition-transform z-10",
                  gradientColors
                )}>
                  <Icon className="h-4.5 w-4.5 text-black" />
                </div>

                <div className="flex flex-1 flex-col gap-1.5 transition-all group-hover/item:translate-x-1">
                  <div className="flex items-center gap-2">
                    {user && (
                      <Avatar className="h-6 w-6 ring-2 ring-white/10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-[10px] font-black bg-white/5">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col">
                      <p className="text-sm leading-none flex flex-wrap items-center gap-x-1">
                        <span className="font-black text-foreground">{user?.name || 'Someone'}</span>
                        <span className="text-muted-foreground font-medium opacity-80">{message}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {expense && activity.type === 'expense_added' && (
                        <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-0.5 rounded-full font-black tracking-tight">
                          {formatCurrency(expense.amount)}
                          <ArrowUpRight className="h-3 w-3" />
                        </div>
                    )}
                    {group && (
                      <span className="font-bold opacity-60 bg-white/5 px-2 py-0.5 rounded-full">{group.name}</span>
                    )}
                    <span className="opacity-40 font-medium">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}



