'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BalanceDetail } from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, UserCircle2 } from 'lucide-react';

interface BalanceListProps {
  balances: BalanceDetail[];
  currency?: string;
  onSettleUp?: (userId: string, amount: number) => void;
}

export function BalanceList({ balances, currency = 'INR', onSettleUp }: BalanceListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const owedToYou = balances.filter(b => b.balance > 0);
  const youOwe = balances.filter(b => b.balance < 0);

  if (balances.length === 0) {
    return (
      <Card className="glass-card shadow-2xl relative overflow-hidden group/bal">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/bal:scale-110 transition-transform">
           <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <CardHeader>
          <CardTitle className="text-xl font-black uppercase tracking-tighter">Vault Stat</CardTitle>
          <CardDescription className="uppercase text-[10px] tracking-widest font-black opacity-40">Peer-to-Peer Stability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCircle2 className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Zero Exposure</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-2xl overflow-hidden border-white/10 group/bal">
      <CardHeader className="relative pb-8">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/bal:scale-110 transition-transform">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-xl font-black uppercase tracking-tighter">Vault Stat</CardTitle>
        <CardDescription className="uppercase text-[10px] tracking-widest font-black opacity-40">Peer-to-Peer Stability</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-10">
        {owedToYou.length > 0 && (
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black text-success uppercase tracking-[0.2em] border-l-2 border-success/40 pl-3">Surplus Assets</h4>
            <div className="flex flex-col gap-3">
              {owedToYou.map((balance) => (
                <motion.div
                  key={balance.userId}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-4 group/item"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-11 w-11 ring-2 ring-white/5 group-hover/item:ring-primary transition-all rounded-[18px]">
                      <AvatarImage src={balance.avatar} alt={balance.name} />
                      <AvatarFallback className="bg-white/5 text-muted-foreground text-sm font-black">
                        {getInitials(balance.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm text-foreground leading-none mb-1">{balance.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{balance.email?.split('@')[0]}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-black text-lg text-success tracking-tighter flex items-center gap-1">
                      {formatCurrency(balance.balance)}
                      <ArrowDownLeft className="h-4 w-4" />
                    </span>
                    {onSettleUp && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-full text-[9px] uppercase font-black tracking-widest text-primary hover:bg-primary/10"
                        onClick={() => onSettleUp(balance.userId, balance.balance)}
                      >
                        Nudge
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {youOwe.length > 0 && (
          <div className="flex flex-col gap-4">
             <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-l-2 border-rose-500/40 pl-3">Liability Exposure</h4>
            <div className="flex flex-col gap-3">
              {youOwe.map((balance) => (
                <motion.div
                  key={balance.userId}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-4 group/item"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-11 w-11 ring-2 ring-white/5 group-hover/item:ring-rose-500 transition-all rounded-[18px]">
                      <AvatarImage src={balance.avatar} alt={balance.name} />
                      <AvatarFallback className="bg-white/5 text-muted-foreground text-sm font-black">
                        {getInitials(balance.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm text-foreground leading-none mb-1">{balance.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{balance.email?.split('@')[0]}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-black text-lg text-rose-500 tracking-tighter flex items-center gap-1">
                      {formatCurrency(balance.balance)}
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    {onSettleUp && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-full border-primary/20 text-[9px] uppercase font-black tracking-widest text-primary hover:bg-primary hover:text-black transition-all"
                        onClick={() => onSettleUp(balance.userId, Math.abs(balance.balance))}
                      >
                        Settled
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



