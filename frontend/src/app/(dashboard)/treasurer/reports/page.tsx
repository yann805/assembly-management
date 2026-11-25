'use client';

import { useState } from 'react';
import { FileText, Plus, Send, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useReports, useReport, useGenerateReport, useSubmitReport } from '@/hooks/queries';
import { useAuthStore, getActiveAssemblyId } from '@/stores/auth-store';
import { formatFcfa, formatDate, monthName } from '@/lib/utils';
import api from '@/lib/api';
import type { MonthlyReport } from '@/types';

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  SUBMITTED: { label: 'Soumis', variant: 'warning' },
  CONFIRMED: { label: 'Validé', variant: 'success' },
};

export default function TreasurerReportsPage() {
  const { user } = useAuthStore();
  const assemblyId = getActiveAssemblyId(user) || '';
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const { data, isLoading } = useReports({ assemblyId });

  return (
    <div className="p-6">
      <PageHeader
        title="Rapports mensuels"
        description="Générez et soumettez vos rapports"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Générer un rapport
          </Button>
        }
      />

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Période</TableHead>
              <TableHead className="text-right">Dîmes</TableHead>
              <TableHead className="text-right">Offrandes</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Soumis le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((r: MonthlyReport) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{monthName(r.month)} {r.year}</TableCell>
                <TableCell className="text-right">{formatFcfa(r.totalTithes)}</TableCell>
                <TableCell className="text-right">{formatFcfa(r.totalOfferings)}</TableCell>
                <TableCell className="text-right font-bold">{formatFcfa(r.totalAmount)}</TableCell>
                <TableCell><Badge variant={STATUS_LABELS[r.status].variant as any}>{STATUS_LABELS[r.status].label}</Badge></TableCell>
                <TableCell>{r.submittedAt ? formatDate(r.submittedAt) : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewId(r.id)}><Eye className="h-4 w-4" /></Button>
                    {r.status === 'DRAFT' && <SubmitButton id={r.id} />}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Exporter Excel"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/reports/${r.id}/export/excel`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `rapport_${r.month}_${r.year}.xlsx`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch { toast.error('Export impossible'); }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">Aucun rapport.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <GenerateDialog open={open} onOpenChange={setOpen} assemblyId={assemblyId} />
      {viewId && <ReportDetailDialog id={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}

function SubmitButton({ id }: { id: string }) {
  const submit = useSubmitReport();
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await submit.mutateAsync(id);
          toast.success('Rapport soumis à la trésorerie générale');
        } catch (e: any) {
          toast.error(e.message);
        }
      }}
    >
      <Send className="mr-1 h-3 w-3" /> Soumettre
    </Button>
  );
}

function GenerateDialog({ open, onOpenChange, assemblyId }: { open: boolean; onOpenChange: (v: boolean) => void; assemblyId: string }) {
  const generate = useGenerateReport();
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const submit = async () => {
    try {
      await generate.mutateAsync({ assemblyId, month: Number(month), year: Number(year) });
      toast.success('Rapport généré (brouillon)');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer un rapport mensuel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mois</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Année</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Le rapport sera calculé à partir des contributions enregistrées pour cette période.
          </p>
          <Button onClick={submit} disabled={generate.isPending} className="w-full">
            {generate.isPending ? 'Génération...' : 'Générer le rapport'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useReport(id);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data ? `${monthName(data.month)} ${data.year}` : 'Rapport'}</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <p>Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Dîmes" value={formatFcfa(data.totalTithes)} />
              <StatCard label="Offrandes" value={formatFcfa(data.totalOfferings)} />
              <StatCard label="TOTAL" value={formatFcfa(data.totalAmount)} />
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Membres : <strong>{data.totalMembers}</strong></div>
                  <div>Contributeurs : <strong>{data.contributingMembers}</strong></div>
                  <div>Statut : <Badge variant={STATUS_LABELS[data.status].variant as any}>{STATUS_LABELS[data.status].label}</Badge></div>
                  <div>Trésorier : <strong>{data.submitter?.fullName}</strong></div>
                </div>
              </CardContent>
            </Card>
            {data.categoryTotals && data.categoryTotals.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Répartition par rubrique</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rubrique</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.categoryTotals.map((ct) => (
                        <TableRow key={ct.id}>
                          <TableCell>{ct.categoryNameSnapshot}</TableCell>
                          <TableCell className="text-right font-medium">{formatFcfa(ct.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {data.confirmations && data.confirmations.length > 0 && (
              <div className="rounded-md bg-green-50 p-3 text-sm">
                <p className="font-semibold text-green-800">✓ Réception confirmée par la trésorerie générale</p>
                <p className="text-green-700">Montant reçu : {formatFcfa(data.confirmations[0].receivedAmount)}</p>
                <p className="text-green-700">Date : {formatDate(data.confirmations[0].confirmedAt)}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
