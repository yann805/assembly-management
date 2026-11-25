'use client';

import { useState } from 'react';
import { Plus, Building2, Users, Crown, Wallet, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAssemblies, useCreateAssembly, useUpdateAssembly, useToggleAssemblyStatus, useAssignResponsibility, useAssemblyMemberships } from '@/hooks/queries';
import { formatFcfa, formatDate } from '@/lib/utils';
import type { Assembly } from '@/types';

export default function AssembliesPage() {
  const { data: assemblies, isLoading } = useAssemblies();
  const createAssembly = useCreateAssembly();
  const toggleStatus = useToggleAssemblyStatus();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <PageHeader
        title="Assemblées"
        description="Gestion des assemblées et de leurs responsables"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle assemblée
          </Button>
        }
      />

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assemblies?.map((a) => (
            <AssemblyCard key={a.id} assembly={a} onToggle={() => toggleStatus.mutate(a.id, { onSuccess: () => toast.success('Statut modifié') })} />
          ))}
          {assemblies?.length === 0 && <p className="text-muted-foreground">Aucune assemblée enregistrée.</p>}
        </div>
      )}

      <CreateAssemblyDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function AssemblyCard({ assembly, onToggle }: { assembly: Assembly; onToggle: () => void }) {
  const [showAssign, setShowAssign] = useState(false);
  const { data: memberships } = useAssemblyMemberships(assembly.id);
  const leader = assembly.responsibilities?.find((r: any) => r.responsibilityType === 'LEADER' && r.isCurrent);
  const treasurer = assembly.responsibilities?.find((r: any) => r.responsibilityType === 'TREASURER' && r.isCurrent);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{assembly.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{assembly.location || '—'}</p>
          </div>
          <Badge variant={assembly.status === 'ACTIVE' ? 'success' : 'destructive'}>
            {assembly.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" /> Membres
          </span>
          <Badge variant="secondary">{assembly._count?.memberships || 0}</Badge>
        </div>
        <div className="text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Crown className="h-4 w-4" /> Dirigeant
          </span>
          <p className="mt-1 font-medium">
            {leader?.membership?.member?.fullName || 'Non désigné'}
          </p>
        </div>
        <div className="text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" /> Trésorier
          </span>
          <p className="mt-1 font-medium">
            {treasurer?.membership?.member?.fullName || 'Non désigné'}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Créée le {formatDate(assembly.creationDate)}
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowAssign(true)}>
            Désigner responsable
          </Button>
          <Button size="sm" variant="ghost" onClick={onToggle}>
            {assembly.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </CardContent>

      <AssignResponsibilityDialog
        open={showAssign}
        onOpenChange={setShowAssign}
        assembly={assembly}
        memberships={memberships || []}
      />
    </Card>
  );
}

function CreateAssemblyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const createAssembly = useCreateAssembly();
  const [form, setForm] = useState({ name: '', location: '', description: '', creationDate: '' });

  const submit = async () => {
    try {
      await createAssembly.mutateAsync(form);
      toast.success('Assemblée créée');
      setForm({ name: '', location: '', description: '', creationDate: '' });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une assemblée</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Localisation</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Date de création</Label>
            <Input type="date" value={form.creationDate} onChange={(e) => setForm({ ...form, creationDate: e.target.value })} />
          </div>
          <Button onClick={submit} disabled={createAssembly.isPending || !form.name} className="w-full">
            {createAssembly.isPending ? 'Création...' : 'Créer l\'assemblée'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignResponsibilityDialog({
  open,
  onOpenChange,
  assembly,
  memberships,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assembly: Assembly;
  memberships: any[];
}) {
  const assign = useAssignResponsibility();
  const [membershipId, setMembershipId] = useState('');
  const [type, setType] = useState<'LEADER' | 'TREASURER'>('TREASURER');
  const [credentials, setCredentials] = useState<{
    fullName: string;
    identifier: string;
    temporaryPassword: string;
  } | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCredentials(null);
      setMembershipId('');
    }
    onOpenChange(nextOpen);
  };

  const submit = async () => {
    if (!membershipId) {
      toast.error('Sélectionnez un membre');
      return;
    }
    try {
      const res = await assign.mutateAsync({ id: assembly.id, data: { membershipId, responsibilityType: type } });
      if (res.credentials) {
        setCredentials(res.credentials);
        toast.success('Responsable désigné et compte créé');
      } else {
        toast.success('Responsable désigné avec succès');
        handleOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {credentials ? 'Identifiants à transmettre' : `Désigner un responsable — ${assembly.name}`}
          </DialogTitle>
        </DialogHeader>
        {credentials ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <KeyRound className="h-4 w-4" />
                Compte créé pour {credentials.fullName}
              </div>
              <p className="text-xs leading-5 text-emerald-900">
                Transmettez ces identifiants au responsable. Le mot de passe temporaire ne sera plus affiché après fermeture.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border bg-white p-4">
              <div>
                <Label>Identifiant de connexion</Label>
                <p className="mt-1 break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-sm">{credentials.identifier}</p>
              </div>
              <div>
                <Label>Mot de passe temporaire</Label>
                <p className="mt-1 break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-sm">{credentials.temporaryPassword}</p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `Identifiant : ${credentials.identifier}\nMot de passe : ${credentials.temporaryPassword}`,
                  );
                  toast.success('Identifiants copiés');
                } catch {
                  toast.error('Impossible de copier les identifiants sur cet appareil.');
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copier les identifiants
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Type de responsabilité</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'LEADER' | 'TREASURER')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TREASURER">Trésorier</SelectItem>
                  <SelectItem value="LEADER">Responsable d’assemblée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Membre</Label>
              <Select value={membershipId} onValueChange={setMembershipId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un membre" />
                </SelectTrigger>
                <SelectContent>
                  {memberships.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {memberships.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Aucun membre dans cette assemblée.</p>
              )}
            </div>
            <Button onClick={submit} disabled={assign.isPending || !membershipId} className="w-full">
              {assign.isPending ? 'Assignation...' : 'Désigner et créer l’accès'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
