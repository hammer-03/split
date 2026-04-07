'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type Group, type User } from '@/lib/api';
import { Plus, Search, Users, Plane, Home, Heart, Briefcase, MoreHorizontal, ChevronRight } from 'lucide-react';

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

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { groups } = await api.getGroups();
        setGroups(groups);
        setFilteredGroups(groups);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredGroups(
        groups.filter(
          (group) =>
            group.name.toLowerCase().includes(query) ||
            group.description?.toLowerCase().includes(query) ||
            group.category.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, groups]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[{ label: 'Groups' }]}
        actions={
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-auto bg-transparent">
        <div className="container max-w-6xl py-4 px-4 md:py-8 md:px-6 space-y-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Groups List */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-semibold mb-1">No groups found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No groups match your search. Try a different query.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-1">No groups yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a group to start splitting expenses with friends.
                  </p>
                  <Button asChild>
                    <Link href="/groups/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first group
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredGroups.map((group) => {
                const CategoryIcon = categoryIcons[group.category] || Users;
                const members = group.members
                  .map((m) => (typeof m.userId === 'object' ? (m.userId as User) : null))
                  .filter(Boolean) as User[];

                return (
                  <Link key={group._id} href={`/groups/${group._id}`}>
                    <Card className="border-border/50 transition-colors hover:bg-accent/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                              <CategoryIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{group.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {group.category}
                                </Badge>
                              </div>
                              {group.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                  {group.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {members.slice(0, 4).map((member) => (
                                    <Avatar key={member._id} className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={member.avatar} alt={member.name} />
                                      <AvatarFallback className="text-[9px]">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {members.length > 4 && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium">
                                      +{members.length - 4}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {members.length} member{members.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



