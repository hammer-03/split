'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Wallet, Receipt, Zap, History } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  onAddExpense?: () => void;
  onCreateGroup?: () => void;
  onSettleUp?: () => void;
}

export function QuickActions({ onAddExpense, onCreateGroup, onSettleUp }: QuickActionsProps) {
  return (
    <Card className="glass-card shadow-2xl relative overflow-hidden group/actions border-white/10">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/actions:scale-110 transition-transform">
        <Zap className="h-12 w-12 text-primary" />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-tighter">Accelerate</CardTitle>
        <CardDescription className="uppercase text-[10px] tracking-widest font-black opacity-40">System Quick-Links</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} className="w-full">
          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-primary hover:text-black hover:border-primary transition-all group/btn relative overflow-hidden"
            onClick={onAddExpense}
            asChild={!onAddExpense}
          >
            {onAddExpense ? (
              <>
                <Plus className="h-5 w-5 transition-transform group-hover/btn:rotate-90 group-hover/btn:scale-125" />
                <span className="font-black text-xs uppercase tracking-widest">Post Expense</span>
              </>
            ) : (
              <Link href="/expenses/new">
                <Plus className="h-5 w-5 transition-transform group-hover/btn:rotate-90 group-hover/btn:scale-125" />
                <span className="font-black text-xs uppercase tracking-widest">Post Expense</span>
              </Link>
            )}
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} className="w-full">
          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-violet-500 hover:text-black hover:border-violet-500 transition-all group/btn"
            onClick={onCreateGroup}
            asChild={!onCreateGroup}
          >
            {onCreateGroup ? (
              <>
                <Users className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">Forge Squad</span>
              </>
            ) : (
              <Link href="/groups/new">
                <Users className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">Forge Squad</span>
              </Link>
            )}
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} className="w-full">
          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all group/btn"
            onClick={onSettleUp}
            asChild={!onSettleUp}
          >
            {onSettleUp ? (
              <>
                <Wallet className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">Sync Debts</span>
              </>
            ) : (
              <Link href="/settlements/new">
                <Wallet className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">Sync Debts</span>
              </Link>
            )}
          </Button>
        </motion.div>

        <div className="pt-2">
            <Button
              variant="outline"
              className="w-full justify-center gap-2 h-12 rounded-2xl border-white/5 bg-white/5 opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"
              asChild
            >
              <Link href="/expenses">
                <History className="h-4 w-4" />
                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">View Log</span>
              </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}



