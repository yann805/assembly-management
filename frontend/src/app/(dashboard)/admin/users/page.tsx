'use client';

import { useState } from 'react';
import { CheckCircle, KeyRound, LockKeyhole, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useManagedUsers, useResetManagedUserCredentials, useToggleManagedUserActive } from '@/hooks/queries';
import type { ManagedUser, RoleName } from '@/types';

const roleLabels: Record<RoleName, string> = {
  GENERAL_TREASURY: 'Super administrateur',
  ASSEMBLY_TREASURER: 'Trésorier',
  ASSEMBLY_LEADER: 'Responsable',
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response;
    if (response && typeof response === 'object' && 'data' in response) {
      const data = response.data;
      if (data && typeof data === 'object' && 'message' in data) {
        return Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      }
    }
  }
  return error instanceof Error ? error.message : 'Une erreur est survenue.';
}

export default function AdminUsersPage() {
  const { data: users, isLoading, isError } = useManagedUsers();
  const resetCredentials = useResetManagedUserCredentials();
  const toggleActive = useToggleManagedUserActive();
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
      setNewPassword('');
      setConfirmation('');
    }
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmation) {
      toast.error('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      await resetCredentials.mutateAsync({ id: selectedUser.id, newPassword });
      toast.success(`Mot de passe mis à jour pour ${selectedUser.fullName}.`);
      closeDialog(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const setAccountActive = async (user: ManagedUser) => {
    try {
      await toggleActive.mutateAsync(user.id);
      toast.success(user.isActive ? 'Compte désactivé.' : 'Compte activé.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Comptes & mots de passe"
        description="Gérez les accès des trésoriers et responsables d’assemblée."
      />

      <Card className="mb-6 border-emerald-100 bg-emerald-50/70">
        <CardContent className="flex items-start gap-3 pt-5 text-sm text-emerald-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
          <p>
            Les mots de passe ne sont jamais affichés. Vous pouvez définir un nouveau mot de passe ou
            suspendre un compte sans supprimer son historique.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement des comptes...</p>
      ) : isError ? (
        <p role="alert" className="text-destructive">Impossible de charger les comptes utilisateurs.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle(s)</TableHead>
                  <TableHead>Identifiant</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-900">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roleAssignments.length ? user.roleAssignments.map((assignment) => (
                          <Badge key={assignment.role.name + (assignment.assembly?.id || '')} variant="secondary">
                            {roleLabels[assignment.role.name] || assignment.role.name}
                            {assignment.assembly?.name ? ` · ${assignment.assembly.name}` : ''}
                          </Badge>
                        )) : <span className="text-sm text-muted-foreground">Aucun rôle</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.email || user.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogOpen(true);
                          }}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Réinitialiser
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={toggleActive.isPending}
                          onClick={() => void setAccountActive(user)}
                          aria-label={user.isActive ? `Désactiver ${user.fullName}` : `Activer ${user.fullName}`}
                        >
                          {user.isActive
                            ? <><XCircle className="mr-2 h-4 w-4" /> Désactiver</>
                            : <><CheckCircle className="mr-2 h-4 w-4" /> Activer</>}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Aucun compte utilisateur.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-emerald-800" />
              Réinitialiser le mot de passe
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Définir un nouveau mot de passe pour {selectedUser?.fullName}.
          </p>
          <form className="space-y-4" onSubmit={savePassword}>
            <div className="space-y-2">
              <Label htmlFor="managed-new-password">Nouveau mot de passe</Label>
              <Input
                id="managed-new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managed-confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="managed-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetCredentials.isPending}>
              {resetCredentials.isPending ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
