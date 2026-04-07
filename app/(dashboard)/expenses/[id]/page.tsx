'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api, type Expense, type User, type Group } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MoreVertical, Edit, Trash2, Receipt, Calendar, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCreator = expense && (
    typeof expense.createdBy === 'object' 
      ? (expense.createdBy as User)._id === user?._id
      : expense.createdBy === user?._id
  );

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const { expense } = await api.getExpense(id);
        setExpense(expense);
      } catch (error) {
        console.error('Failed to fetch expense:', error);
        toast.error('Failed to load expense');
        router.push('/expenses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [id, router]);

  const handleDelete = async () => {
    try {
      await api.deleteExpense(id);
      toast.success('Expense deleted successfully');
      router.push('/expenses');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader breadcrumbs={[{ label: 'Expenses', href: '/expenses' }, { label: 'Loading...' }]} />
        <div className="flex-1 overflow-auto">
          <div className="container max-w-2xl py-6 px-4 md:px-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return null;
  }

  const paidBy = typeof expense.paidBy === 'object' ? (expense.paidBy as User) : null;
  const group = expense.groupId && typeof expense.groupId === 'object' ? (expense.groupId as Group) : null;
  const createdBy = typeof expense.createdBy === 'object' ? (expense.createdBy as User) : null;

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[
          { label: 'Expenses', href: '/expenses' },
          { label: expense.description },
        ]}
        actions={
          isCreator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/expenses/${id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Expense
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Expense
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="container max-w-2xl py-6 px-4 md:px-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{expense.description}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {expense.category}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(expense.amount, expense.currency)}</p>
                  <p className="text-sm text-muted-foreground">{expense.currency}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(expense.date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                {group && (
                  <Link
                    href={`/groups/${group._id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/50"
                  >
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Group</p>
                      <p className="font-medium">{group.name}</p>
                    </div>
                  </Link>
                )}
              </div>

              <Separator />

              {/* Paid By */}
              {paidBy && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Paid by</h3>
                  <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={paidBy.avatar} alt={paidBy.name} />
                      <AvatarFallback>{getInitials(paidBy.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{paidBy.name}</p>
                      <p className="text-sm text-muted-foreground">{paidBy.email}</p>
                    </div>
                    <span className="font-semibold text-success">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Splits */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Split ({expense.splitType})
                </h3>
                <div className="flex flex-col gap-2">
                  {expense.splits.map((split, index) => {
                    const splitUser = typeof split.userId === 'object' ? (split.userId as User) : null;
                    const isPayer = paidBy && splitUser && paidBy._id === splitUser._id;
                    
                    return (
                      <div
                        key={splitUser?._id || index}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {splitUser && (
                            <>
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={splitUser.avatar} alt={splitUser.name} />
                                <AvatarFallback className="text-sm">
                                  {getInitials(splitUser.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{splitUser.name}</p>
                                <p className="text-xs text-muted-foreground">{splitUser.email}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              'font-medium',
                              isPayer ? 'text-muted-foreground' : 'text-warning'
                            )}
                          >
                            {isPayer ? 'Paid' : `-${formatCurrency(split.amount, expense.currency)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {expense.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    </div>
                    <p className="text-sm">{expense.notes}</p>
                  </div>
                </>
              )}

              {/* Footer */}
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Created by {createdBy?.name || 'Unknown'} on{' '}
                  {format(new Date(expense.createdAt), 'MMM d, yyyy')}
                </p>
                {expense.updatedAt !== expense.createdAt && (
                  <p>Updated {format(new Date(expense.updatedAt), 'MMM d, yyyy')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone and will
              affect the balances of all members involved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
