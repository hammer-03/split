'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
        {/* Responsive 'Finest' Mesh */}
        <div className="absolute top-[-20%] right-[-10%] w-[90%] h-[90%] bg-amber-200/40 dark:bg-amber-500/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[100%] h-[100%] bg-indigo-100/30 dark:bg-indigo-700/15 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] left-[20%] w-[50%] h-[50%] bg-rose-100/20 dark:bg-rose-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-background/20 dark:bg-background/10 backdrop-blur-[50px]" />
      </div>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-transparent relative z-10 !bg-transparent">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}



