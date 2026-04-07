'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, type Group, type User, type Expense, type GroupBalanceSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import {
  Plus,
  Settings,
  MoreVertical,
  UserPlus,
  Wallet,
  Receipt,
  Users,
  Plane,
  Home,
  Heart,
  Briefcase,
  MoreHorizontal,
  ChevronRight,
  Trash2,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const categoryIcons: Record<string, React.ElementType> = {
  trip: Plane,
  home: Home,
  couple: Heart,
  friends: Users,
  work: Briefcase,
  other: MoreHorizontal,
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<GroupBalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showSimplifyDialog, setShowSimplifyDialog] = useState(false);
  const [suggestedTransactions, setSuggestedTransactions] = useState<any[]>([]);
  const [isSimplifying, setIsSimplifying] = useState(false);

  const isAdmin = group?.members.find(
    (m) => (typeof m.userId === 'object' ? (m.userId as User)._id : m.userId) === user?._id
  )?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupData, expensesData, balancesData] = await Promise.all([
          api.getGroup(id),
          api.getExpenses({ groupId: id, limit: 10 }),
          api.getGroupBalances(id),
        ]);
        setGroup(groupData.group);
        setExpenses(expensesData.expenses);
        setBalances(balancesData);
      } catch (error) {
        console.error('Failed to fetch group data:', error);
        toast.error('Failed to load group');
        router.push('/groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleDeleteGroup = async () => {
    try {
      await api.deleteGroup(id);
      toast.success('Group deleted successfully');
      router.push('/groups');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await api.removeGroupMember(id, user!._id);
      toast.success('You have left the group');
      router.push('/groups');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave group');
    }
  };

  const handleSimplifyDebts = async () => {
    setIsSimplifying(true);
    try {
      const { suggestedTransactions } = await api.simplifyDebts(id);
      setSuggestedTransactions(suggestedTransactions);
      setShowSimplifyDialog(true);
    } catch (error) {
      toast.error('Failed to simplify debts');
    } finally {
      setIsSimplifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader breadcrumbs={[{ label: 'Groups', href: '/groups' }, { label: 'Loading...' }]} />
        <div className="flex-1 overflow-auto">
          <div className="container max-w-4xl py-6 px-4 md:px-6">
            <Skeleton className="h-32 w-full mb-6" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  const CategoryIcon = categoryIcons[group.category] || Users;
  const members = group.members
    .map((m) => {
      const userObj = typeof m.userId === 'object' ? (m.userId as User) : { _id: m.userId as string, name: 'Unknown', email: '', avatar: undefined };
      return {
        ...userObj,
        role: m.role,
      };
    })
    .filter((m) => m._id);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[{ label: 'Groups', href: '/groups' }, { label: group.name }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSimplifyDebts} disabled={isSimplifying}>
              <Zap className={cn("mr-2 h-4 w-4 text-primary", isSimplifying && "animate-pulse")} />
              {isSimplifying ? 'Simplifying...' : 'Simplify'}
            </Button>
            <Button asChild>
              <Link href={`/expenses/new?groupId=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/groups/${id}/members`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage Members
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href={`/groups/${id}/settings`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Group Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLeaveDialog(true)} className="text-warning">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl py-6 px-4 md:px-6">
          {/* Group Header */}
          <Card className="border-border/50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <CategoryIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                    <Badge variant="secondary">{group.category}</Badge>
                  </div>
                  {group.description && (
                    <p className="text-muted-foreground mb-3">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {members.slice(0, 5).map((member) => (
                          <Avatar key={member._id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="text-[9px]">{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-muted-foreground">
                        {members.length} member{members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Summary */}
          {balances && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      balances.netBalance > 0 && 'text-success',
                      balances.netBalance < 0 && 'text-warning'
                    )}
                  >
                    {balances.netBalance >= 0 ? '+' : '-'}
                    {formatCurrency(balances.netBalance)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">You are owed</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(balances.totalOwed)}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">You owe</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(balances.totalOwing)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Members */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Members</CardTitle>
                  <CardDescription>People in this group</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/groups/${id}/members`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {members.map((member) => {
                  const balance = balances?.balances.find((b) => b.userId === member._id);
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-sm">{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{member.name}</p>
                            {member.role === 'admin' && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {balance && balance.balance !== 0 && (
                        <span
                          className={cn(
                            'text-sm font-medium',
                            balance.balance > 0 ? 'text-success' : 'text-warning'
                          )}
                        >
                          {balance.balance > 0 ? '+' : '-'}
                          {formatCurrency(balance.balance)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Expenses</CardTitle>
                  <CardDescription>Latest group expenses</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/expenses?groupId=${id}`}>View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Receipt className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No expenses yet</p>
                    <Button variant="link" size="sm" asChild className="mt-2">
                      <Link href={`/expenses/new?groupId=${id}`}>Add the first expense</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {expenses.slice(0, 5).map((expense) => {
                      const paidBy = typeof expense.paidBy === 'object' ? (expense.paidBy as User) : null;
                      return (
                        <Link
                          key={expense._id}
                          href={`/expenses/${expense._id}`}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{expense.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {paidBy?.name || 'Someone'} paid ·{' '}
                                {formatDistanceToNow(new Date(expense.date), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone and will remove all
              expenses and balances associated with this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You will no longer have access to the group expenses
              and balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup}>Leave Group</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Simplify Dialog */}
      <AlertDialog open={showSimplifyDialog} onOpenChange={setShowSimplifyDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Smart Debt Simplification
            </AlertDialogTitle>
            <AlertDialogDescription>
              We've calculated the minimum number of transactions needed to settle all debts in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 flex flex-col gap-3">
            {suggestedTransactions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No debts to simplify! All settled.</p>
            ) : (
              suggestedTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={tx.from.avatar} />
                      <AvatarFallback className="text-[8px]">{getInitials(tx.from.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{tx.from.name.split(' ')[0]}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={tx.to.avatar} />
                      <AvatarFallback className="text-[8px]">{getInitials(tx.to.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{tx.to.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(tx.amount)}</span>
                </div>
              ))
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {suggestedTransactions.length > 0 && (
              <AlertDialogAction asChild>
                <Link href={`/settlements/new?groupId=${id}`}>
                  Go to Settle Up
                </Link>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
