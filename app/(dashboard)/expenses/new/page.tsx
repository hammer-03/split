'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api, type Group, type User, type CreateExpenseData } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Loader2, CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const categories = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'travel', label: 'Travel' },
  { value: 'general', label: 'General' },
  { value: 'custom', label: 'Other / Add New' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function NewExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const { user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [paidBy, setPaidBy] = useState<string>('');
  const [splitType] = useState<'equal'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGroups, setIsFetchingGroups] = useState(true);
  const [aiText, setAiText] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { groups } = await api.getGroups();
        setGroups(groups);
        
        // Auto-select group if provided in URL
        if (groupIdParam) {
          const group = groups.find(g => g._id === groupIdParam);
          if (group) {
            setSelectedGroup(group);
            const memberIds = group.members.map(m => 
              typeof m.userId === 'object' ? (m.userId as User)._id : m.userId
            );
            setSelectedMembers(memberIds);
            setPaidBy(user?._id || '');
          }
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setIsFetchingGroups(false);
      }
    };

    if (user) {
      fetchGroups();
      setPaidBy(user._id);
    }
  }, [groupIdParam, user]);

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    setSelectedGroup(group || null);
    
    if (group) {
      const memberIds = group.members.map(m => 
        typeof m.userId === 'object' ? (m.userId as User)._id : m.userId
      );
      setSelectedMembers(memberIds);
    } else {
      setSelectedMembers([]);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split with');
      return;
    }

    setIsLoading(true);

    try {
      const splitAmount = amountNum / selectedMembers.length;
      
      const expenseData: CreateExpenseData = {
        groupId: selectedGroup?._id,
        description: description.trim(),
        amount: amountNum,
        category: category === 'custom' ? customCategory.trim() : category,
        paidBy,
        splitType,
        splits: selectedMembers.map(userId => ({
          userId,
          amount: splitAmount,
        })),
        notes: notes.trim() || undefined,
        date: date.toISOString(),
      };

      await api.createExpense(expenseData);
      toast.success('Expense added successfully!');
      
      if (selectedGroup) {
        router.push(`/groups/${selectedGroup._id}`);
      } else {
        router.push('/expenses');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIParse = async () => {
    if (!aiText.trim()) return;

    setIsAIProcessing(true);
    try {
      const { result } = await api.parseAIExpense(aiText, selectedGroup?._id);
      
      if (result.description) setDescription(result.description);
      if (result.amount) setAmount(result.amount.toString());
      if (result.category) setCategory(result.category);
      if (result.paidByUserId) setPaidBy(result.paidByUserId);
      if (result.date) setDate(new Date(result.date));
      
      toast.success('Expense parsed successfully!');
      setAiText('');
    } catch (error) {
      console.error('AI Parse failed:', error);
      toast.error('Failed to parse text. Please try again or fill manually.');
    } finally {
      setIsAIProcessing(false);
    }
  };

  const members = selectedGroup
    ? selectedGroup.members
        .map(m => typeof m.userId === 'object' ? (m.userId as User) : null)
        .filter(Boolean) as User[]
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[
          { label: 'Expenses', href: '/expenses' },
          { label: 'New Expense' },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="container max-w-2xl py-6 px-4 md:px-6">
          <form onSubmit={handleSubmit}>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Add an expense</CardTitle>
                <CardDescription>
                  Track a shared expense with your friends or group members.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* AI Parser */}
                <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-primary font-semibold flex items-center gap-2">
                      <Loader2 className={cn("h-4 w-4", isAIProcessing ? "animate-spin" : "hidden")} />
                      AI Quick Add
                    </Label>
                    <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">Beta</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Pizza 500 paid by Ujjawal"
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAIParse())}
                      disabled={isAIProcessing}
                      className="border-primary/20 focus-visible:ring-primary/30"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAIParse} 
                      disabled={isAIProcessing || !aiText.trim()}
                      size="sm"
                    >
                      {isAIProcessing ? 'Parsing...' : 'Parse'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Type details like "Coffee 150 paid by me" to auto-fill the form.
                  </p>
                </div>

                {/* Group Selection */}
                <div className="flex flex-col gap-2">
                  <Label>Group</Label>
                  <Select 
                    value={selectedGroup?._id || ''} 
                    onValueChange={handleGroupChange}
                    disabled={isFetchingGroups}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group._id} value={group._id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a group to split expenses with its members.
                  </p>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What was this expense for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Amount & Category */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs">₹</div>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Category Input */}
                {category === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-2"
                  >
                    <Label htmlFor="custom-category">Custom Category Name</Label>
                    <Input
                      id="custom-category"
                      placeholder="Enter category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                    />
                  </motion.div>
                )}

                {/* Date */}
                <div className="flex flex-col gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Paid By */}
                {selectedGroup && members.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label>Paid by</Label>
                    <Select value={paidBy} onValueChange={setPaidBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Who paid?" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member._id} value={member._id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                              {member._id === user?._id && (
                                <span className="text-muted-foreground">(you)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Split With */}
                {selectedGroup && members.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label>Split with</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select who should split this expense equally.
                    </p>
                    <div className="flex flex-col gap-2">
                      {members.map((member) => (
                        <div
                          key={member._id}
                          className={cn(
                            'flex items-center justify-between rounded-lg border p-3 transition-colors',
                            selectedMembers.includes(member._id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={member._id}
                              checked={selectedMembers.includes(member._id)}
                              onCheckedChange={() => handleMemberToggle(member._id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="text-sm">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <label htmlFor={member._id} className="font-medium text-sm cursor-pointer">
                                {member.name}
                                {member._id === user?._id && (
                                  <span className="text-muted-foreground ml-1">(you)</span>
                                )}
                              </label>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          {selectedMembers.includes(member._id) && amount && (
                            <span className="text-sm font-black">
                              ₹{(parseFloat(amount) / selectedMembers.length).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !selectedGroup}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Expense'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col">
        <DashboardHeader breadcrumbs={[{ label: 'Expenses', href: '/expenses' }, { label: 'New Expense' }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    }>
      <NewExpensePageContent />
    </Suspense>
  );
}




