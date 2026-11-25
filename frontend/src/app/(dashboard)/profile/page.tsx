'use client';

import { useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { RoleName } from '@/types';

const roleLabels: Record<RoleName, string> = {
  GENERAL_TREASURY: 'Trésorerie générale',
  ASSEMBLY_TREASURER: 'Trésorier d’assemblée',
  ASSEMBLY_LEADER: 'Dirigeant d’assemblée',
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="p-6">
      <PageHeader title="Profil" description="Consultez les informations de votre compte et gérez sa sécurité." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
                <CardDescription>Les informations associées à votre compte.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileField label="Nom complet" value={user?.fullName} />
            <ProfileField label="Adresse e-mail" value={user?.email} />
            <ProfileField label="Téléphone" value={user?.phone} />
            <div className="space-y-1">
              <p className="text-sm font-medium">Statut du compte</p>
              <Badge variant={user?.isActive ? 'success' : 'destructive'}>
                {user?.isActive ? 'Actif' : 'Désactivé'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accès et sécurité</CardTitle>
            <CardDescription>Vos responsabilités et les paramètres de sécurité du compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Rôles</p>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map((role) => (
                  <Badge key={`${role.name}-${role.assemblyId || 'general'}`} variant="secondary">
                    {roleLabels[role.name]}
                  </Badge>
                ))}
              </div>
            </div>
            {user?.roles?.some((role) => role.assemblyName) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Assemblées</p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(user.roles.flatMap((role) => role.assemblyName ? [role.assemblyName] : []))].map((name) => (
                    <Badge key={name} variant="outline">{name}</Badge>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Changer mon mot de passe
            </Button>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value || 'Non renseigné'}</p>
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmation) {
      toast.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Impossible de modifier le mot de passe.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer mon mot de passe</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Modification...' : 'Enregistrer le nouveau mot de passe'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
