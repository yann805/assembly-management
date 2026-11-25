'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  FileText,
  BarChart3,
  KeyRound,
  Church,
  Wallet,
  LogOut,
  Settings,
  X,
  UserRound,
} from 'lucide-react';
import { useAuthStore, hasRole } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles?: string[];
}

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/assemblies', label: 'Assemblées', icon: Building2 },
  { href: '/admin/members', label: 'Membres', icon: Users },
  { href: '/admin/users', label: 'Comptes & mots de passe', icon: KeyRound },
  { href: '/admin/categories', label: 'Rubriques', icon: Tags },
  { href: '/admin/reports', label: 'Rapports', icon: FileText },
  { href: '/admin/statistics', label: 'Statistiques', icon: BarChart3 },
];

const treasurerNav: NavItem[] = [
  { href: '/treasurer', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/treasurer/statistics', label: 'Statistiques', icon: BarChart3 },
  { href: '/treasurer/members', label: 'Membres', icon: Users },
  { href: '/treasurer/contributions', label: 'Contributions', icon: Wallet },
  { href: '/treasurer/reports', label: 'Rapports mensuels', icon: FileText },
];

const leaderNav: NavItem[] = [
  { href: '/leader', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/leader/statistics', label: 'Statistiques', icon: BarChart3 },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  let nav = leaderNav;
  let title = 'Espace Dirigeant';
  let icon = Church;
  if (hasRole(user, 'GENERAL_TREASURY')) {
    nav = adminNav;
    title = 'Trésorerie Générale';
    icon = Settings;
  } else if (hasRole(user, 'ASSEMBLY_TREASURER')) {
    nav = treasurerNav;
    title = 'Espace Trésorier';
    icon = Wallet;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Navigation principale"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-emerald-950 bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-200 md:static md:z-auto md:h-screen md:w-64 md:translate-x-0 md:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-amber-300">
          {(() => {
            const Icon = icon;
          return <Icon className="h-5 w-5" />;
          })()}
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">{title}</p>
          <p className="text-xs text-slate-400">Assembly Management</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Fermer le menu"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-emerald-900 text-white shadow-sm shadow-emerald-950/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
              onClick={onClose}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Link
          href="/profile"
          className={cn(
            'mb-2 flex items-center gap-3 rounded-md p-2 transition-colors',
            pathname === '/profile' ? 'bg-emerald-900 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          )}
          onClick={onClose}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Profil</p>
            <p className="truncate text-xs text-slate-400">{user?.fullName}</p>
          </div>
          <UserRound className="h-4 w-4 shrink-0" />
        </Link>
        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
      </aside>
    </>
  );
}
