'use client';

import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMembers, useCreateMember, useReferenceData, useAssemblies } from '@/hooks/queries';
import { formatDate } from '@/lib/utils';
import { MemberForm } from '@/components/forms/member-form';

export default function AdminMembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [assemblyId, setAssemblyId] = useState('');
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useMembers({ page, limit: 20, search, assemblyId: assemblyId || undefined });
  const { data: assemblies } = useAssemblies();

  return (
    <div className="p-6">
      <PageHeader
        title="Membres"
        description="Tous les membres de toutes les assemblées"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={assemblyId}
          onChange={(e) => {
            setAssemblyId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes les assemblées</option>
          {assemblies?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Assemblée</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Date d'arrivée</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell>{m.gender === 'M' ? 'Homme' : m.gender === 'F' ? 'Femme' : '—'}</TableCell>
                  <TableCell>{m.memberships?.[0]?.assembly?.name || '—'}</TableCell>
                  <TableCell>{m.contacts?.[0]?.contactValue || '—'}</TableCell>
                  <TableCell>{formatDate(m.arrivalDate)}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {m.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun membre trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.page} / {data.totalPages} — {data.total} membre(s)
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Précédent
                </Button>
                <Button size="sm" variant="outline" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
          </DialogHeader>
          <MemberForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
