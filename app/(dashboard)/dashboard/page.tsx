'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { BalanceList } from '@/components/dashboard/balance-list';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { GroupsList } from '@/components/dashboard/groups-list';
import { api, type BalanceSummary, type Activity, type Group } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<BalanceSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceData, activityData, groupData] = await Promise.all([
          api.getBalances(),
          api.getActivity({ limit: 10 }),
          api.getGroups(),
        ]);
        
        setBalances(balanceData);
        setActivities(activityData.activities);
        setGroups(groupData.groups);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard Overview' },
        ]}
      />

      <div className="flex-1 overflow-auto bg-transparent">
        <div className="container max-w-6xl py-4 px-4 md:py-8 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent flex items-center gap-2">
                HI, {user?.name?.split(' ')[0] || 'User'} <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              </h1>
              <p className="text-muted-foreground text-sm md:text-lg font-medium opacity-80 uppercase tracking-widest">
                {"Your financial pulse at a glance."}
              </p>
            </div>
            <div className="hidden md:flex gap-2">
               <Button asChild size="sm" className="rounded-full bg-primary/20 hover:bg-primary/30 text-white border-none px-6">
                 <Link href="/expenses/new" className="flex items-center gap-2">
                   <Plus className="h-4 w-4" /> New Expense
                 </Link>
               </Button>
            </div>
          </motion.div>

          {/* Balance Cards */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mb-10">
              <BalanceCard
                totalOwed={balances?.totalOwed || 0}
                totalOwing={balances?.totalOwing || 0}
                currency={user?.currency || 'INR'}
              />
            </div>
          )}

          {/* Main Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Groups */}
              {isLoading ? (
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <motion.div className="transition-all">
                  <GroupsList groups={groups} limit={4} />
                </motion.div>
              )}

              {/* Activity Feed */}
              {isLoading ? (
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1">
                           <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <ActivityFeed activities={activities} limit={8} />
                </motion.div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="flex flex-col gap-8">
              {/* Quick Actions */}
              <motion.div transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <QuickActions />
              </motion.div>

              {/* Balance List */}
              {isLoading ? (
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <BalanceList
                  balances={balances?.balances || []}
                  currency={user?.currency || 'INR'}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-8 right-6 md:hidden z-50">
        <Button asChild size="lg" className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 shadow-2xl shadow-amber-500/40 border-none transition-all active:scale-90 hover:scale-105">
          <Link href="/expenses/new" className="flex items-center justify-center">
            <Plus className="h-8 w-8 text-black" />
          </Link>
        </Button>
      </div>
    </div>
  );
}




