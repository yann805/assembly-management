'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Church, Loader2, LockKeyhole, ShieldCheck, Wallet } from 'lucide-react';
import { useAuthStore, getHomeRoute, hasRole } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoleName } from '@/types';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email ou téléphone requis'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type LoginValues = z.infer<typeof loginSchema>;

const roleDetails: Record<RoleName, { title: string; description: string; icon: typeof ShieldCheck }> = {
  GENERAL_TREASURY: {
    title: 'Super administrateur',
    description: 'Gérez les assemblées, les équipes et le suivi général.',
    icon: ShieldCheck,
  },
  ASSEMBLY_TREASURER: {
    title: 'Trésorier',
    description: 'Retrouvez les les Dimes, les Offrandes et les rapports de votre assemblée.',
    icon: Wallet,
  },
  ASSEMBLY_LEADER: {
    title: 'Responsable d’assemblée',
    description: 'Accédez à votre espace de suivi et de coordination.',
    icon: Church,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleName | null>(null);

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get('role');
    if (role && role in roleDetails) setSelectedRole(role as RoleName);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const user = await login(values.identifier, values.password);
      if (selectedRole && !hasRole(user, selectedRole)) {
        useAuthStore.getState().logout();
        toast.error(`Ce compte n'a pas accès à l'espace ${roleDetails[selectedRole].title.toLowerCase()}.`);
        return;
      }
      toast.success(`Bienvenue, ${user.fullName}`);
      router.replace(getHomeRoute(user));
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Échec de la connexion';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = selectedRole ? roleDetails[selectedRole].icon : LockKeyhole;

  return (
    <main className="flex min-h-screen bg-[#f7f7f2]">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-emerald-950 p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-emerald-700/40 blur-3xl" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-amber-300"><Church className="h-5 w-5" /></span>
          <span className="text-sm font-semibold">Gestion des Assemblées</span>
        </Link>
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Un même esprit, une même vision</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight xl:text-6xl">
            Servir avec confiance. <span className="font-serif italic text-amber-300">Grandir ensemble.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-emerald-100/75">
            Un espace sécurisé pour accompagner les équipes et veiller sereinement sur la vie de chaque assemblée.
          </p>
        </div>
        <p className="relative text-xs text-emerald-100/50">Une plateforme au service de vos équipes.</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-9 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
          </Link>
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900 text-amber-300 shadow-lg shadow-emerald-950/15">
              <RoleIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Espace sécurisé</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {selectedRole ? `Connexion ${roleDetails[selectedRole].title.toLowerCase()}` : 'Heureux de vous retrouver'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedRole ? roleDetails[selectedRole].description : 'Connectez-vous avec les identifiants qui vous ont été remis.'}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email ou téléphone</Label>
              <Input
                id="identifier"
                placeholder="votre@email.com ou numéro de téléphone"
                autoComplete="username"
                className="h-12 rounded-xl border-slate-200 bg-white"
                {...register('identifier')}
              />
              {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                className="h-12 rounded-xl border-slate-200 bg-white"
                {...register('password')}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl bg-emerald-900 text-sm hover:bg-emerald-800" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
              Se connecter
            </Button>
          </form>
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <p className="font-semibold text-slate-900">Vous êtes responsable ?</p>
            <p className="mt-1 leading-6 text-slate-600">Votre trésorier général vous remet vos identifiants de connexion.</p>
            <Link href="/" className="mt-3 inline-flex font-semibold text-emerald-900 hover:underline">
              Choisir un autre espace
            </Link>
          </div>
          <p className="mt-7 text-center text-xs text-slate-400">Vos informations restent protégées et accessibles selon votre rôle.</p>
        </div>
      </section>
    </main>
  );
}
