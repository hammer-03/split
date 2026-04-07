'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, type Expense, type User, type Group } from '@/lib/api';
import { Plus, Search, Receipt, ChevronRight, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'travel', label: 'Travel' },
  { value: 'general', label: 'General' },
];

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
  }).format(amount);
}

function ExpensesPageContent() {
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState(groupIdParam || 'all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expensesData, groupsData] = await Promise.all([
          api.getExpenses({ limit: 100 }),
          api.getGroups(),
        ]);
        setExpenses(expensesData.expenses);
        setFilteredExpenses(expensesData.expenses);
        setGroups(groupsData.groups);
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((expense) => expense.category === categoryFilter);
    }

    // Group filter
    if (groupFilter !== 'all') {
      filtered = filtered.filter((expense) => {
        const expenseGroupId = typeof expense.groupId === 'object' 
          ? (expense.groupId as Group)._id 
          : expense.groupId;
        return expenseGroupId === groupFilter;
      });
    }

    setFilteredExpenses(filtered);
  }, [searchQuery, categoryFilter, groupFilter, expenses]);

  // Group expenses by date
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = format(new Date(expense.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[{ label: 'Expenses' }]}
        actions={
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-auto bg-transparent">
        <div className="container max-w-6xl py-4 px-4 md:py-8 md:px-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expenses List */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-16 w-16 text-muted-foreground/30 mb-4" />
              {searchQuery || categoryFilter !== 'all' || groupFilter !== 'all' ? (
                <>
                  <h3 className="text-lg font-semibold mb-1">No expenses found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No expenses match your filters. Try adjusting your search.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setGroupFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-1">No expenses yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking your shared expenses.
                  </p>
                  <Button asChild>
                    <Link href="/expenses/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first expense
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {groupedExpenses[date].map((expense) => {
                      const paidBy = typeof expense.paidBy === 'object' ? (expense.paidBy as User) : null;
                      const group = expense.groupId && typeof expense.groupId === 'object' 
                        ? (expense.groupId as Group) 
                        : null;

                      return (
                        <Link key={expense._id} href={`/expenses/${expense._id}`}>
                          <Card className="border-border/50 transition-colors hover:bg-accent/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <Receipt className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">{expense.description}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {expense.category}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      {paidBy && (
                                        <div className="flex items-center gap-1">
                                          <Avatar className="h-4 w-4">
                                            <AvatarImage src={paidBy.avatar} alt={paidBy.name} />
                                            <AvatarFallback className="text-[8px]">
                                              {getInitials(paidBy.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span>{paidBy.name} paid</span>
                                        </div>
                                      )}
                                      {group && (
                                        <>
                                          <span>·</span>
                                          <span>{group.name}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col">
        <DashboardHeader breadcrumbs={[{ label: 'Expenses' }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    }>
      <ExpensesPageContent />
    </Suspense>
  );
}



