"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  Users, 
  UserPlus, 
  Wallet, 
  Bell,
  Filter,
  ArrowUpRight,
  ChevronRight,
  TrendingDown,
  Activity as PulseIcon
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: "expense_added" | "expense_updated" | "expense_deleted" | "settlement" | "group_created" | "member_added" | "member_removed"
  actor: {
    id: string
    name: string
    avatar?: string
  }
  target?: {
    id: string
    name: string
    type: "user" | "group" | "expense"
  }
  metadata?: {
    amount?: number
    description?: string
    groupName?: string
  }
  createdAt: string
}

const activityGradients: Record<string, string> = {
  expense_added: 'from-amber-400 to-rose-500',
  expense_updated: 'from-blue-400 to-indigo-500',
  expense_deleted: 'from-rose-400 to-red-600',
  settlement: 'from-emerald-400 to-teal-600',
  group_created: 'from-violet-400 to-purple-600',
  member_added: 'from-cyan-400 to-blue-500',
  member_removed: 'from-orange-400 to-red-500',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string[]>(["all"])

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const response = await api.getActivity()
      const mapped = response.activities.map((a: any) => {
        let target;
        if (a.groupId) {
          target = { id: a.groupId._id || a.groupId, name: a.groupId.name || 'Group', type: 'group' as const };
        } else if (a.targetUserId) {
          target = { id: a.targetUserId._id || a.targetUserId, name: a.targetUserId.name || 'User', type: 'user' as const };
        } else if (a.expenseId) {
          target = { id: a.expenseId._id || a.expenseId, name: a.expenseId.description || 'Expense', type: 'expense' as const };
        }

        return {
          id: a._id,
          type: a.type,
          actor: {
            id: a.userId._id || a.userId,
            name: a.userId.name || 'Unknown',
            avatar: a.userId.avatar,
          },
          target,
          metadata: a.data,
          createdAt: a.createdAt,
        };
      });
      setActivities(mapped)
    } catch (err) {
      console.error("Failed to fetch activities:", err)
      // Mock data for demo
      setActivities([
        {
          id: "1",
          type: "expense_added",
          actor: { id: "1", name: "Alex Johnson" },
          target: { id: "g1", name: "Weekend Trip", type: "group" },
          metadata: { amount: 125.50, description: "Hotel booking" },
          createdAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: "2",
          type: "settlement",
          actor: { id: "2", name: "Sarah Miller" },
          target: { id: "u1", name: "You", type: "user" },
          metadata: { amount: 45.00 },
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: "3",
          type: "member_added",
          actor: { id: "1", name: "Alex Johnson" },
          target: { id: "u3", name: "Mike Chen", type: "user" },
          metadata: { groupName: "Roommates" },
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)
  }

  const formatRelativeTime = (date: string) => {
    const activityDate = new Date(date)
    return activityDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "expense_added": return <Receipt className="h-4.5 w-4.5 text-black" />
      case "settlement": return <Wallet className="h-4.5 w-4.5 text-black" />
      case "group_created": return <Users className="h-4.5 w-4.5 text-black" />
      case "member_added": return <UserPlus className="h-4.5 w-4.5 text-black" />
      default: return <Bell className="h-4.5 w-4.5 text-black" />
    }
  }

  const getActivityMessage = (activity: Activity) => {
    const { type, actor, target, metadata } = activity
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm md:text-base leading-tight font-black tracking-tight text-foreground flex flex-wrap gap-x-1.5 items-center">
          <span className="text-primary glow-text-sm">{actor.name}</span>
          <span className="opacity-60 font-bold lowercase">{type.replace('_', ' ')}</span>
          {metadata?.description && <span className="text-white">"{metadata.description}"</span>}
          {target && <span className="text-amber-500/80 font-black">#{target.name}</span>}
        </p>
        {metadata?.amount && (
           <div className="flex items-center gap-2 mt-1">
             <div className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
               {formatCurrency(metadata.amount)} <ArrowUpRight className="h-3 w-3" />
             </div>
           </div>
        )}
      </div>
    )
  }

  const filteredActivities = filter.includes("all") 
    ? activities 
    : activities.filter(a => filter.includes(a.type))

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(activity)
    return groups
  }, {} as Record<string, Activity[]>)

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-6 space-y-6 max-w-2xl mx-auto w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-6 animate-pulse">
            <div className="h-12 w-12 bg-white/5 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[{ label: 'System Pulse' }]}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-xl glass-card border-white/10 hover:border-primary/40 transition-all font-black uppercase tracking-widest text-[10px] px-6">
                <Filter className="mr-2 h-4 w-4 text-primary" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-white/20 min-w-[200px]">
              <DropdownMenuCheckboxItem checked={filter.includes("all")} onCheckedChange={(c) => c && setFilter(["all"])} className="font-bold">
                All Pulse
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filter.includes("expense_added")} onCheckedChange={(c) => setFilter(prev => c ? [...prev.filter(f => f !== "all"), "expense_added"] : prev.filter(f => f !== "expense_added"))} className="font-bold">
                Expenses Only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="flex-1 overflow-auto bg-transparent py-4 px-4 md:py-8 md:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-12 relative">
          
          {/* Central Timeline Spine */}
          <div className="absolute left-[24px] md:left-[24px] top-4 bottom-4 w-1 bg-gradient-to-b from-primary/60 via-primary/10 to-transparent rounded-full shadow-[0_0_15px_rgba(251,191,36,0.2)]" />

          {Object.entries(groupedActivities).length === 0 ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40">
                <PulseIcon className="h-20 w-20 text-primary opacity-10 mb-6 animate-pulse" />
                <h2 className="text-3xl font-black tracking-tighter opacity-40 uppercase">Ecosystem Idle</h2>
             </motion.div>
          ) : (
            Object.entries(groupedActivities).map(([date, dateActivities], gIdx) => (
              <div key={date} className="relative">
                <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex items-center gap-6 mb-8 sticky top-0 z-20"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center justify-center z-30">
                    <span className="text-black font-black text-xs leading-none">{date.split(' ')[1]}</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white bg-background/40 backdrop-blur-3xl px-4 py-1 rounded-full border border-white/10">{date}</h2>
                </motion.div>

                <div className="space-y-6">
                  {dateActivities.map((activity, aIdx) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: aIdx * 0.05 }}
                      viewport={{ once: true }}
                      className="group relative pl-16 md:pl-20"
                    >
                      {/* Node on Line */}
                      <div className="absolute left-[20px] top-[24px] w-3 h-3 rounded-full bg-primary ring-4 ring-background shadow-[0_0_10px_rgba(251,191,36,0.6)] z-10 transition-transform group-hover:scale-150" />

                      <Card className="glass-card hover:bg-white/5 hover:translate-x-2 transition-all border-white/5 hover:border-primary/40 cursor-default group/card rounded-[32px] md:rounded-[40px] shadow-2xl">
                        <CardContent className="p-4 md:p-5 flex items-center gap-5">
                          <div className={cn(
                            "h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-[22px] md:rounded-[26px] bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform group-hover/card:rotate-6",
                            activityGradients[activity.type] || 'from-gray-500 to-gray-700'
                          )}>
                            {getActivityIcon(activity.type)}
                          </div>
                          
                          <div className="flex-1">
                            {getActivityMessage(activity)}
                            <div className="flex items-center gap-3 mt-3">
                               <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{formatRelativeTime(activity.createdAt)}</p>
                               <ChevronRight className="h-3 w-3 opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-primary" />
                            </div>
                          </div>

                          <Avatar className="h-12 w-12 md:h-16 md:w-16 border-4 border-white/5 ring-2 ring-primary/20 group-hover/card:ring-primary transition-all rounded-[22px] md:rounded-[26px]">
                            <AvatarImage src={activity.actor.avatar} />
                            <AvatarFallback className="font-black text-sm bg-white/5">
                              {getInitials(activity.actor.name)}
                            </AvatarFallback>
                          </Avatar>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  )
}




