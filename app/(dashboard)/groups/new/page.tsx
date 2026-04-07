'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Users, Plane, Home, Heart, Briefcase, MoreHorizontal, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const categories = [
  { value: 'trip', label: 'Trip', icon: Plane },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'couple', label: 'Couple', icon: Heart },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
  { value: 'custom', label: 'Add New', icon: Plus },
] as const;

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('friends');
  const [customCategory, setCustomCategory] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+?/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (memberEmails.includes(email)) {
      toast.error('This email is already added');
      return;
    }
    
    setMemberEmails([...memberEmails, email]);
    setMemberEmail('');
  };

  const removeMember = (email: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setIsLoading(true);

    try {
      const { group } = await api.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category === 'custom' ? customCategory.trim() : category,
        memberEmails: memberEmails.length > 0 ? memberEmails : undefined,
      });

      toast.success('Group created successfully!');
      router.push(`/groups/${group._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[
          { label: 'Groups', href: '/groups' },
          { label: 'New Group' },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="container max-w-2xl py-6 px-4 md:px-6">
          <form onSubmit={handleSubmit}>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Create a new group</CardTitle>
                <CardDescription>
                  Create a group to split expenses with friends, roommates, or travel companions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Weekend Trip, Apartment 3B"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this group for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 transition-all duration-300',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                              : 'border-white/5 bg-white/5 hover:border-primary/50 hover:bg-white/10'
                          )}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110",
                            isSelected ? "bg-primary text-black" : "bg-white/5"
                          )}>
                             <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Category Input */}
                {category === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    <Label htmlFor="custom-category">Custom Category Name</Label>
                    <Input
                      id="custom-category"
                      placeholder="e.g., Chess Club, Hackathon Team"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                      className="rounded-xl border-white/10"
                    />
                  </motion.div>
                )}

                {/* Members */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="members">Add Members (optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Invite friends by their email address. They must have a SplitEase account.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="members"
                      type="email"
                      placeholder="friend@example.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMember();
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={addMember} className="rounded-xl">
                      Add
                    </Button>
                  </div>
                  {memberEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {memberEmails.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="gap-1 pr-1 truncate max-w-[200px]"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeMember(email)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  <Button type="submit" disabled={isLoading} className="rounded-xl px-8">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Group'
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



