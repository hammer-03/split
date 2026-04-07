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
        {/* Optimized background - faster rendering */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.08),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.05),transparent_50%)]" />
      </div>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-transparent relative z-10 !bg-transparent">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}



