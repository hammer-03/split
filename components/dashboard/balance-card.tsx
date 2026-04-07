'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface BalanceCardProps {
  totalOwed: number;
  totalOwing: number;
  currency?: string;
}

// 🎰 THE COUNTER: Fast-incrementing numbers animation
function AnimatedCounter({ value, currency = 'INR' }: { value: number; currency?: string }) {
  const spring = useSpring(0, { mass: 1, stiffness: 45, damping: 15 });
  const display = useTransform(spring, (current) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(Math.abs(current))
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export function BalanceCard({ totalOwed, totalOwing, currency = 'INR' }: BalanceCardProps) {
  const netBalance = totalOwed - totalOwing;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-rose-500 border-none shadow-xl shadow-amber-500/10 group h-fit">
        <div className="absolute top-0 right-0 p-6 opacity-20 transition-transform group-hover:scale-125">
          <Wallet className="h-20 w-20 text-white" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            Total Balance
          </CardTitle>
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
            <Wallet className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-black text-white tracking-tighter">
            {netBalance >= 0 ? '+' : '-'}<AnimatedCounter value={netBalance} currency={currency} />
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase mt-2 tracking-widest">
            {netBalance > 0 
              ? 'Surplus Standing'
              : netBalance < 0
              ? 'Negative exposure'
              : 'Cleared Balance'}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card hover:border-amber-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">
            You are owed
          </CardTitle>
          <div className="p-2 bg-success/10 rounded-xl">
            <ArrowDownLeft className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-success tracking-tighter">
            <AnimatedCounter value={totalOwed} currency={currency} />
          </div>
          <div className="h-1 w-12 bg-success/20 rounded-full mt-3" />
        </CardContent>
      </Card>

      <Card className="glass-card hover:border-rose-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60">
            You owe
          </CardTitle>
          <div className="p-2 bg-warning/10 rounded-xl">
            <ArrowUpRight className="h-4 w-4 text-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-warning tracking-tighter">
            <AnimatedCounter value={totalOwing} currency={currency} />
          </div>
          <div className="h-1 w-12 bg-warning/20 rounded-full mt-3" />
        </CardContent>
      </Card>
    </div>
  );
}



