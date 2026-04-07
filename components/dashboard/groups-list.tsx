'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plane, Home, Heart, Briefcase, MoreHorizontal, Plus, ChevronRight, LayoutGrid } from 'lucide-react';
import type { Group, User } from '@/lib/api';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GroupsListProps {
  groups: Group[];
  limit?: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  trip: Plane,
  home: Home,
  couple: Heart,
  friends: Users,
  work: Briefcase,
  other: MoreHorizontal,
};

const categoryGradients: Record<string, string> = {
  trip: 'from-blue-400 to-cyan-500',
  home: 'from-amber-400 to-orange-500',
  couple: 'from-rose-400 to-pink-500',
  friends: 'from-emerald-400 to-teal-500',
  work: 'from-indigo-400 to-purple-500',
  other: 'from-gray-400 to-slate-500',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function GroupsList({ groups, limit }: GroupsListProps) {
  const displayGroups = limit ? groups.slice(0, limit) : groups;

  if (displayGroups.length === 0) {
    return (
      <Card className="glass-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Your Squads</CardTitle>
            <CardDescription className="uppercase text-[10px] tracking-widest font-bold opacity-40">Financial grouping centers</CardDescription>
          </div>
          <Button size="sm" asChild className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-none font-black text-[10px] uppercase tracking-widest">
            <Link href="/groups/new">
              <Plus className="mr-2 h-3 w-3" />
              New Group
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
               <Users className="h-8 w-8 opacity-20" />
            </div>
            <p className="text-muted-foreground font-bold mb-6">No groups active</p>
            <Button asChild className="rounded-2xl bg-primary text-black font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20">
              <Link href="/groups/new">
                Initialize Group
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-2xl overflow-hidden group/list border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-8 relative">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/list:scale-110 transition-transform">
          <LayoutGrid className="h-12 w-12 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl font-black uppercase tracking-tighter">Ecosystems</CardTitle>
          <CardDescription className="uppercase text-[10px] tracking-widest font-black opacity-40">Active Expense Architectures</CardDescription>
        </div>
        <Button size="sm" asChild className="rounded-xl glass-card border-white/10 hover:border-primary/40 text-primary font-black text-[10px] uppercase tracking-widest px-6 shadow-xl">
          <Link href="/groups/new">
            <Plus className="mr-2 h-3 w-3" />
            New
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {displayGroups.map((group, idx) => {
          const CategoryIcon = categoryIcons[group.category] || Users;
          const gradient = categoryGradients[group.category] || categoryGradients.other;
          const members = group.members.map(m => 
            typeof m.userId === 'object' ? m.userId as User : null
          ).filter(Boolean) as User[];

          return (
            <motion.div
              key={group._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 5 }}
            >
              <Link
                href={`/groups/${group._id}`}
                className="flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-4 md:p-5 transition-all hover:bg-white/[0.08] hover:border-primary/40 group/item relative overflow-hidden"
              >
                {/* Subtle highlight effect */}
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg group-hover/item:rotate-6 transition-transform",
                    gradient
                  )}>
                    <CategoryIcon className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-lg tracking-tight text-white">{group.name}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                       <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest bg-white/5 hover:bg-white/10 border-white/5 transition-colors">
                        {group.category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-3">
                          {members.slice(0, 3).map((member) => (
                            <Avatar key={member._id} className="h-6 w-6 ring-2 ring-background border-none">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="text-[10px] bg-white/5 font-black">{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {members.length > 3 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-white/10 text-[8px] font-black">
                              +{members.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold opacity-40 uppercase tracking-tighter">
                          {members.length} {members.length !== 1 ? 'Nodes' : 'Node'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:bg-primary/20">
                   <ChevronRight className="h-5 w-5 text-primary" />
                </div>
              </Link>
            </motion.div>
          );
        })}

        {limit && groups.length > limit && (
          <Button variant="ghost" className="mt-4 font-black uppercase tracking-[0.2em] text-[10px] opacity-40 hover:opacity-100 hover:text-primary transition-all bg-white/5 rounded-2xl h-12" asChild>
            <Link href="/groups">
              View Entire Hive
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}



