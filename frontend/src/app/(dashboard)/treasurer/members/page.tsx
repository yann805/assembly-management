'use client';

import { useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
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
import { useMembers, useMember, useMemberContributions } from '@/hooks/queries';
import { formatDate, formatFcfa, monthName } from '@/lib/utils';
import { MemberForm } from '@/components/forms/member-form';
import { Card, CardContent } from '@/components/ui/card';

export default function TreasurerMembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const { data, isLoading } = useMembers({ page, limit: 20, search });

  return (
    <div className="p-6">
      <PageHeader
        title="Membres de mon assemblée"
        description="Gérez les fiches des membres"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un membre
          </Button>
        }
      />

      <div className="mb-4 relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
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
                <TableHead>Téléphone</TableHead>
                <TableHead>Date d'arrivée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell>{m.gender === 'M' ? 'Homme' : m.gender === 'F' ? 'Femme' : '—'}</TableCell>
                  <TableCell>{m.contacts?.[0]?.contactValue || '—'}</TableCell>
                  <TableCell>{formatDate(m.arrivalDate)}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {m.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setViewId(m.id)} title="Voir la fiche">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Aucun membre.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {data.page} / {data.totalPages} — {data.total} membre(s)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
                <Button size="sm" variant="outline" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
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

      {viewId && <MemberDetailDialog id={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}

function MemberDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: member } = useMember(id);
  const { data: contributions } = useMemberContributions(id);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{member?.fullName}</DialogTitle>
        </DialogHeader>
        {member && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Sexe : </span>{member.gender === 'M' ? 'Homme' : member.gender === 'F' ? 'Femme' : '—'}</div>
                  <div><span className="text-muted-foreground">Naissance : </span>{formatDate(member.dateOfBirth)}</div>
                  <div><span className="text-muted-foreground">Conversion : </span>{formatDate(member.conversionDate)}</div>
                  <div><span className="text-muted-foreground">Baptême d'eau : </span>{formatDate(member.waterBaptismDate)}</div>
                  <div><span className="text-muted-foreground">Baptême Saint-Esprit : </span>{formatDate(member.holySpiritBaptismDate)}</div>
                  <div><span className="text-muted-foreground">Profession : </span>{member.profession || '—'}</div>
                  <div><span className="text-muted-foreground">Statut matrimonial : </span>{member.maritalStatus?.name || '—'}</div>
                  <div><span className="text-muted-foreground">Filière : </span>{member.filiere?.name || '—'}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Téléphone : </span>{member.contacts?.[0]?.contactValue || '—'}</div>
                </div>
              </CardContent>
            </Card>

            <div>
              <p className="mb-2 font-semibold">Historique des contributions</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Dîme</TableHead>
                    <TableHead className="text-right">Offrande</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Trésorier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions?.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.paymentDate)}</TableCell>
                      <TableCell className="text-right">{formatFcfa(c.titheAmount)}</TableCell>
                      <TableCell className="text-right">{formatFcfa(c.offeringAmount)}</TableCell>
                      <TableCell className="text-right font-bold">{formatFcfa(c.totalAmount)}</TableCell>
                      <TableCell>{c.recorder?.fullName}</TableCell>
                    </TableRow>
                  ))}
                  {(!contributions || contributions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Aucune contribution.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
