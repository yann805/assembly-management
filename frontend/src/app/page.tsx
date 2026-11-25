'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Church,
  Landmark,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAuthStore, getHomeRoute } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getHomeRoute(user));
    }
  }, [isAuthenticated, user, router]);

  const signInOptions = [
    {
      role: 'GENERAL_TREASURY',
      title: 'Super administrateur',
      description: 'Pilotez les assemblées, les équipes et la trésorerie générale.',
      icon: ShieldCheck,
      href: '/login?role=GENERAL_TREASURY',
      accent: 'bg-amber-100 text-amber-800',
    },
    {
      role: 'ASSEMBLY_TREASURER',
      title: 'Trésorier',
      description: 'Suivez les contributions et préparez les rapports de votre assemblée.',
      icon: Wallet,
      href: '/login?role=ASSEMBLY_TREASURER',
      accent: 'bg-emerald-100 text-emerald-800',
    },
    {
      role: 'ASSEMBLY_LEADER',
      title: 'Responsable d’assemblée',
      description: 'Accédez à votre espace de suivi et accompagnez votre communauté.',
      icon: Church,
      href: '/login?role=ASSEMBLY_LEADER',
      accent: 'bg-sky-100 text-sky-800',
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f2] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Accueil">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/10">
            <Church className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight">Assemblée PSU-DANG</span>
            <span className="block text-xs text-slate-500">Gestion & confiance</span>
          </span>
        </Link>
        <Link href="/login" className="hidden sm:block">
          <Button variant="outline" className="rounded-full border-slate-300 bg-white px-5">
            Se connecter <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:pb-24 md:pt-14">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <Sparkles className="h-3.5 w-3.5" />
            Un espace pour servir avec clarté
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            La gestion de votre assemblée,{' '}
            <span className="font-serif italic text-emerald-800">en harmonie.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Rassemblez vos équipes, suivez les les Dimes et le Offrandes et gardez une vision claire de la vie de vos assemblées — en toute simplicité.
          </p>
          <a href="#espaces" className="mt-8 inline-flex h-12 items-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-emerald-900">
            Découvrir mon espace <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Accès sécurisé par rôle</span>
            <span className="inline-flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-emerald-700" /> Suivi clair et partagé</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-amber-200/60 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-emerald-200/70 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Votre communauté</p>
                <p className="mt-1 text-lg font-semibold">Grandir ensemble</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Landmark className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f7f7f2] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm"><Church className="h-4 w-4" /></div>
                <p className="mt-6 text-2xl font-semibold">Ensemble</p>
                <p className="mt-1 text-xs text-slate-500">Des équipes unies</p>
              </div>
              <div className="rounded-2xl bg-emerald-900 p-4 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-300"><BarChart3 className="h-4 w-4" /></div>
                <p className="mt-6 text-2xl font-semibold">En confiance</p>
                <p className="mt-1 text-xs text-emerald-100/70">Des comptes lisibles</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex -space-x-2">
                {['bg-amber-200', 'bg-sky-200', 'bg-emerald-200'].map((color, index) => (
                  <span key={index} className={`h-9 w-9 rounded-full border-2 border-white ${color}`} />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">Une organisation à votre image</p>
                <p className="mt-0.5 text-xs text-slate-500">Simple à prendre en main, sur tous vos écrans.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="espaces" className="bg-white px-5 py-16 sm:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Accès à votre espace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Bienvenue, choisissez votre connexion.</h2>
            <p className="mt-3 text-slate-600">Chaque responsable accède aux outils adaptés à sa mission.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {signInOptions.map(({ title, description, icon: Icon, href, accent }) => (
              <Link key={title} href={href} className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-600">{description}</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-900">
                  Se connecter <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Gestion des Assemblées</p>
        <p>Une plateforme au service de vos équipes.</p>
      </footer>
    </main>
  );
}
