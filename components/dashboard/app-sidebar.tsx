'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Receipt,
  UserCircle,
  Activity as ActivityIcon,
  Settings,
  LogOut,
  ChevronsUpDown,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const mainNavItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Groups',
    url: '/groups',
    icon: Users,
  },
  {
    title: 'Expenses',
    url: '/expenses',
    icon: Receipt,
  },
  {
    title: 'Friends',
    url: '/friends',
    icon: UserCircle,
  },
  {
    title: 'Activity',
    url: '/activity',
    icon: ActivityIcon,
  },
];

const insightNavItems = [
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settlements',
    url: '/settlements',
    icon: Wallet,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setOpenMobile } = useSidebar();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-3 py-2 group"
              onClick={() => setOpenMobile(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Receipt className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">SplitEase</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500/60 px-4 mb-4">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    onClick={() => setOpenMobile(false)}
                    className={cn(
                      "transition-all duration-300 relative group/btn",
                      pathname === item.url ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary/70"
                    )}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4 transition-transform group-hover/btn:scale-110", pathname === item.url ? "text-primary scale-110" : "opacity-50")} />
                      <span className={cn("text-sm font-semibold tracking-tight", pathname === item.url ? "text-foreground font-black" : "opacity-60")}>{item.title}</span>
                      {pathname === item.url && (
                        <motion.div 
                          layoutId="active-nav-indicator"
                          className="absolute left-[-12px] w-1.5 h-6 bg-primary rounded-r-full shadow-[4px_0_15px_rgba(251,191,36,0.4)]"
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-4 mb-2">Deep Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    onClick={() => setOpenMobile(false)}
                    className={cn(
                      "transition-all duration-300 relative group/btn",
                      pathname === item.url ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary/70"
                    )}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4 transition-transform group-hover/btn:scale-110", pathname === item.url ? "text-primary scale-110" : "opacity-50")} />
                      <span className={cn("text-sm font-semibold tracking-tight", pathname === item.url ? "text-foreground font-black" : "opacity-60")}>{item.title}</span>
                       {pathname === item.url && (
                        <motion.div 
                          layoutId="active-nav-indicator-insight"
                          className="absolute left-[-12px] w-1.5 h-6 bg-primary rounded-r-full shadow-[4px_0_15px_rgba(251,191,36,0.4)]"
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}



