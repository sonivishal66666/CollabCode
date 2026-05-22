'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, LayoutDashboard, FolderCode, Plus, LogOut, Settings, Users, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/rooms', icon: FolderCode, label: 'My Rooms' },
  { href: '/dashboard/rooms/new', icon: Plus, label: 'New Room' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center animate-pulse">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div className="text-text-secondary text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isRoomPage = pathname.startsWith('/dashboard/rooms/') && !pathname.endsWith('/new');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-primary">
      {/* Mobile Top Header */}
      {!isRoomPage && (
        <header className="md:hidden h-16 border-b border-border-default bg-bg-secondary/80 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 relative">
          <button
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-accent-cyan" />
            <span className="text-[14px] font-extrabold tracking-wider bg-gradient-to-r from-white via-white to-text-secondary bg-clip-text text-transparent">
              COLLABCODE
            </span>
          </div>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-xs font-bold text-white border border-white/10">
            {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </header>
      )}

      {/* Mobile Sliding Drawer */}
      <AnimatePresence>
        {!isRoomPage && isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-45 md:hidden"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-bg-secondary/95 backdrop-blur-xl border-r border-border-default/60 z-50 flex flex-col p-5 shadow-2xl md:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-border-default/40">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-accent-cyan" />
                  <span className="text-sm font-extrabold tracking-wider text-white">COLLABCODE</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 py-6 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-accent-violet/10 text-white border-l-2 border-accent-violet'
                          : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
                      }`}
                    >
                      <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-accent-cyan' : 'text-text-secondary'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User and Logout */}
              <div className="border-t border-border-default/40 pt-4">
                <div className="flex items-center gap-3 mb-4 px-2 py-1.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{user?.display_name || 'User'}</p>
                    <p className="text-[10px] text-text-secondary truncate font-mono">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    router.push('/login');
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-accent-rose/10 hover:border-accent-rose/30 border border-transparent transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 text-text-secondary" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop only) */}
      {!isRoomPage && (
        <aside className="hidden md:flex w-64 border-r border-border-default flex-col glass-panel-strong shrink-0 relative overflow-hidden">
          {/* Subtle Ambient Sidebar Orbs */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-accent-violet/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-20 -right-12 w-24 h-24 bg-accent-cyan/10 rounded-full blur-2xl pointer-events-none" />

          {/* Sidebar Brand Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-border-default/60 relative z-10 bg-black/10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-lg blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-9 h-9 rounded-lg bg-bg-primary flex items-center justify-center border border-white/10">
                <Code2 className="w-5 h-5 text-accent-cyan group-hover:text-accent-violet transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-extrabold tracking-wider bg-gradient-to-r from-white via-white to-text-secondary bg-clip-text text-transparent">
                COLLABCODE
              </span>
              <span className="text-[10px] text-accent-cyan/70 tracking-widest font-mono font-bold -mt-0.5 uppercase">
                Workspace
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-gradient-to-r from-accent-violet/15 to-accent-cyan/5 rounded-xl border-l-2 border-accent-violet"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3 w-full">
                    <item.icon
                      className={`w-4.5 h-4.5 transition-all duration-300 ${
                        isActive
                          ? 'text-accent-cyan scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                          : 'text-text-secondary group-hover:text-text-primary'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User Section / Footer */}
          <div className="border-t border-border-default/60 p-4 relative z-10 bg-black/10">
            <div className="flex items-center gap-3 mb-4 px-2 py-1.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
              <div className="relative group/avatar shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-violet to-accent-cyan rounded-xl blur-sm opacity-55 group-hover/avatar:opacity-100 transition duration-300" />
                <div className="relative w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-sm font-extrabold text-white border border-white/10">
                  {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate leading-snug">
                  {user?.display_name || 'User'}
                </p>
                <p className="text-[11px] text-text-secondary truncate leading-none mt-0.5 font-mono">
                  {user?.email || 'user@collabcode.com'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-accent-rose/10 hover:border-accent-rose/30 border border-transparent transition-all duration-300 group/btn"
            >
              <LogOut className="w-4 h-4 text-text-secondary group-hover/btn:text-accent-rose group-hover/btn:translate-x-0.5 transition-all" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
