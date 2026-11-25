'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuthStore, hasRole } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Church } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  // Vérification que l'utilisateur a au moins un rôle reconnu
  const validRole =
    hasRole(user, 'GENERAL_TREASURY') ||
    hasRole(user, 'ASSEMBLY_TREASURER') ||
    hasRole(user, 'ASSEMBLY_LEADER');

  if (!validRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">Vous n&apos;avez aucun rôle assigné.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ouvrir le menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Church className="h-5 w-5 text-emerald-800" />
            <span className="truncate">Gestion des Assemblées</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
