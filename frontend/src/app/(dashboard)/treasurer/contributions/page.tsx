'use client';

import { useState, useEffect } from 'react';
import { Plus, Wallet, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContributions, useCreateContribution, useAssemblyMemberships, useCategories } from '@/hooks/queries';
import { useAuthStore, getActiveAssemblyId } from '@/stores/auth-store';
import { formatDate, formatFcfa } from '@/lib/utils';

export default function ContributionsPage() {
  const { user } = useAuthStore();
  const assemblyId = getActiveAssemblyId(user) || '';
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));

  const { data, isLoading } = useContributions({
    assemblyId,
    month: Number(month),
    year: Number(year),
    limit: 50,
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Contributions"
        description="Enregistrez les paiements des membres"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle contribution
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2026, 2025, 2024].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Membre</TableHead>
              <TableHead className="text-right">Dîme</TableHead>
              <TableHead className="text-right">Offrande</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Répartition</TableHead>
              <TableHead>Trésorier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>{formatDate(c.paymentDate)}</TableCell>
                <TableCell className="font-medium">{c.membership?.member?.fullName}</TableCell>
                <TableCell className="text-right">{formatFcfa(c.titheAmount)}</TableCell>
                <TableCell className="text-right">{formatFcfa(c.offeringAmount)}</TableCell>
                <TableCell className="text-right font-bold">{formatFcfa(c.totalAmount)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.allocations?.map((a: any) => (
                      <Badge key={a.id} variant="outline" className="text-xs">
                        {a.category?.name}: {formatFcfa(a.amount)}
                      </Badge>
                    ))}
                    {c.allocations?.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>{c.recorder?.fullName}</TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucune contribution pour cette période.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <ContributionDialog open={open} onOpenChange={setOpen} assemblyId={assemblyId} />
    </div>
  );
}

function ContributionDialog({ open, onOpenChange, assemblyId }: { open: boolean; onOpenChange: (v: boolean) => void; assemblyId: string }) {
  const { data: memberships } = useAssemblyMemberships(assemblyId);
  const { data: categories } = useCategories();
  const create = useCreateContribution();

  const [membershipId, setMembershipId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [titheAmount, setTitheAmount] = useState('0');
  const [offeringAmount, setOfferingAmount] = useState('0');
  const [allocations, setAllocations] = useState<Array<{ categoryId: string; amount: number }>>([]);

  const totalOffering = Number(offeringAmount) || 0;
  const allocationsSum = allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const totalPayment = (Number(titheAmount) || 0) + totalOffering;
  const equalitiesOk = Math.abs(allocationsSum - totalOffering) < 0.01;

  const addAllocation = () => {
    setAllocations([...allocations, { categoryId: '', amount: 0 }]);
  };

  const updateAllocation = (idx: number, field: 'categoryId' | 'amount', value: string) => {
    const next = [...allocations];
    next[idx] = { ...next[idx], [field]: field === 'amount' ? Number(value) || 0 : value };
    setAllocations(next);
  };

  const removeAllocation = (idx: number) => {
    setAllocations(allocations.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!membershipId) { toast.error('Sélectionnez un membre'); return; }
    const t = Number(titheAmount);
    const o = Number(offeringAmount);
    if (t < 0 || o < 0) { toast.error('Les montants ne peuvent pas être négatifs'); return; }
    if (t === 0 && o === 0) { toast.error('Saisissez au moins un montant'); return; }
    if (o > 0 && allocations.length === 0) { toast.error('Répartissez l\'offrande entre les rubriques'); return; }
    if (!equalitiesOk) { toast.error(`La somme des répartitions (${allocationsSum}) ≠ offrande (${o})`); return; }

    // Vérifier qu'aucune rubrique n'est vide
    const emptyCat = allocations.find((a) => !a.categoryId);
    if (emptyCat) { toast.error('Sélectionnez une rubrique pour chaque ligne'); return; }

    try {
      await create.mutateAsync({
        membershipId,
        paymentDate,
        titheAmount: t,
        offeringAmount: o,
        allocations: o > 0 ? allocations : [],
      });
      toast.success('Contribution enregistrée');
      // Reset
      setMembershipId(''); setTitheAmount('0'); setOfferingAmount('0'); setAllocations([]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enregistrer une contribution</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Membre *</Label>
            <Select value={membershipId} onValueChange={setMembershipId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
              <SelectContent>
                {memberships?.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.member.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date du paiement *</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant de la dîme (FCFA)</Label>
              <Input type="number" min="0" value={titheAmount} onChange={(e) => setTitheAmount(e.target.value)} />
            </div>
            <div>
              <Label>Montant total de l'offrande (FCFA)</Label>
              <Input type="number" min="0" value={offeringAmount} onChange={(e) => setOfferingAmount(e.target.value)} />
            </div>
          </div>

          {totalOffering > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="font-semibold">Répartition de l'offrande</Label>
                  <Button size="sm" variant="outline" onClick={addAllocation}>
                    <Plus className="mr-1 h-3 w-3" /> Ajouter
                  </Button>
                </div>

                {allocations.length === 0 && (
                  <p className="text-sm text-muted-foreground">Cliquez sur « Ajouter » pour répartir l'offrande.</p>
                )}

                {allocations.map((a, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <Select value={a.categoryId} onValueChange={(v) => updateAllocation(idx, 'categoryId', v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Rubrique" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Montant"
                      className="w-32"
                      value={a.amount || ''}
                      onChange={(e) => updateAllocation(idx, 'amount', e.target.value)}
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeAllocation(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Somme des répartitions : <strong>{formatFcfa(allocationsSum)}</strong></span>
                  <span>Offrande : <strong>{formatFcfa(totalOffering)}</strong></span>
                </div>
                <div className={`mt-2 flex items-center gap-2 rounded-md p-2 text-sm ${equalitiesOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {equalitiesOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {equalitiesOk
                    ? 'Égalité respectée : la somme des répartitions correspond à l\'offrande.'
                    : 'Écart : la somme ne correspond pas au montant de l\'offrande.'}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="rounded-md bg-indigo-50 p-3 text-center">
            <span className="text-sm text-muted-foreground">Total du paiement : </span>
            <span className="text-lg font-bold text-indigo-700">{formatFcfa(totalPayment)}</span>
          </div>

          <Button onClick={submit} disabled={create.isPending} className="w-full">
            {create.isPending ? 'Enregistrement...' : 'Enregistrer la contribution'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
