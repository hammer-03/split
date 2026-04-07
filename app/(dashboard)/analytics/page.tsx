'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type AnalyticsData } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLORS = [
  '#3b82f6', // primary (blue)
  '#ff2d55', // neon-pink
  '#00f2ff', // neon-cyan
  '#ccff00', // neon-yellow
  '#bf00ff', // neon-purple
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const analyticsData = await api.getAnalytics();
        setData(analyticsData);
        if (analyticsData.currentMonthTotal > 0) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#f43f5e', '#10b981', '#fbbf24', '#8b5cf6']
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader breadcrumbs={[{ label: 'Analytics' }]} />
        <div className="container max-w-7xl py-6 px-4 md:px-6">
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Skeleton className="h-[350px] w-full rounded-3xl" />
              <Skeleton className="h-[350px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  // ChartJS Data Preparation
  
  // Pad trend data up to 6 months to ensure lines always draw beautifully
  const paddedTrendData = [...(data?.trendData || [])];
  if (paddedTrendData.length === 1) {
    const onlyMonth = paddedTrendData[0];
    paddedTrendData.unshift({ month: 'Last Mo', year: onlyMonth.year, total: 0 });
    paddedTrendData.unshift({ month: 'Prev Mo', year: onlyMonth.year, total: 0 });
  }

  const trendData = {
    labels: paddedTrendData.map((d: any) => d.month),
    datasets: [
      {
        fill: true,
        label: 'Spending',
        data: paddedTrendData.map((d: any) => d.total),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, family: 'sans-serif' },
        bodyFont: { size: 14, family: 'sans-serif', weight: 'bold' as const },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `₹${Number(context.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: (value: any) => `₹${value}`,
        },
        border: { display: false },
      },
    },
  };

  const pieData = {
    labels: data.categoryData.map((c) => c.category),
    datasets: [
      {
        data: data.categoryData.map((c) => c.total),
        backgroundColor: COLORS,
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => ` ₹${Number(context.raw).toFixed(2)}`,
        },
      },
    },
  };

  const barData = {
    labels: data.categoryData.map((c) => c.category),
    datasets: [
      {
        label: 'Spending',
        data: data.categoryData.map((c) => c.total),
        backgroundColor: COLORS,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `₹${Number(context.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 13 } },
        border: { display: false },
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring' as const, 
        damping: 25, 
        stiffness: 100 
      } 
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader breadcrumbs={[{ label: 'Analytics' }]} />
      
      <div className="flex-1 overflow-auto scroll-smooth">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="container max-w-7xl py-6 px-4 md:px-6"
        >
          {data.currentMonthTotal === 0 && data.categoryData.length === 0 ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center glass-card rounded-3xl border border-white/10"
            >
              <div className="bg-primary/10 p-6 rounded-full mb-6 relative group">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping group-hover:animate-none opacity-50"></div>
                <PieIcon className="h-12 w-12 text-primary relative z-10 transition-transform group-hover:rotate-12" />
              </div>
              <h2 className="text-3xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">No expenses yet</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                Start adding expenses in your groups to unlock dynamic spending trends, category breakdowns, and beautiful insights.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
                <motion.div variants={itemVariants}>
                  <Card className="glass-card shadow-2xl group hover:border-primary/50 transition-colors border-white/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-400" />
                        Monthly Total
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl md:text-3xl font-black bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
                        ₹{data.currentMonthTotal.toFixed(2)}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-medium italic">Current billing cycle</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {data.insights.map((insight, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <Card className="glass-card shadow-2xl group hover:border-white/20 transition-all border-white/5 h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                          {insight.type === 'increase' || insight.type === 'decrease' ? 'Spending Insight' : 'Top Category'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={cn(
                            "p-2 rounded-xl bg-opacity-10",
                            insight.type === 'increase' ? "bg-rose-500 text-rose-500" : 
                            insight.type === 'decrease' ? "bg-emerald-500 text-emerald-500" : 
                            "bg-violet-500 text-violet-500"
                          )}>
                            {insight.type === 'increase' && <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
                            {insight.type === 'decrease' && <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />}
                            {insight.type === 'top_category' && <PieIcon className="h-4 w-4 md:h-5 md:w-5" />}
                          </div>
                          <div className="text-xs md:text-sm font-bold leading-tight text-foreground/90 group-hover:text-white transition-colors uppercase">
                            {insight.text}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col gap-6">
                {/* Spending Trend (Full Width) */}
                <motion.div variants={itemVariants}>
                  <Card className="glass-card shadow-3xl overflow-hidden hover:border-blue-500/30 transition-all border-white/5 p-1">
                    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-transparent">
                      <CardTitle className="text-xl font-black flex items-center gap-3 italic">
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                        SPENDING MOMENTUM
                      </CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-tighter opacity-70">Visualizing your share over 180 days</CardDescription>
                    </div>
                    <CardContent className="h-[350px] md:h-[450px] pb-6">
                       <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                         <Line data={trendData} options={trendOptions} />
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bottom Row: Distribution */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <motion.div variants={itemVariants}>
                    <Card className="glass-card shadow-3xl hover:border-fuchsia-500/30 transition-all border-white/5">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg font-black flex items-center gap-3">
                          <PieIcon className="h-5 w-5 text-fuchsia-500" />
                          CATEGORY SLICE
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px] md:h-[400px]">
                        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                          <Doughnut data={pieData} options={pieOptions} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="glass-card shadow-3xl hover:border-emerald-500/30 transition-all border-white/5">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg font-black flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-emerald-500" />
                          TOP LEADERS
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px] md:h-[400px]">
                         <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                           <Bar data={barData} options={barOptions} />
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}




