'use client';

import { useState } from 'react';
import { FileText, CheckCircle, Clock, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReports, useReport, useConfirmReport } from '@/hooks/queries';
import { useAuthStore } from '@/stores/auth-store';
import { formatFcfa, formatDate, monthName } from '@/lib/utils';
import api from '@/lib/api';
import type { MonthlyReport } from '@/types';

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  SUBMITTED: { label: 'Soumis', variant: 'warning' },
  CONFIRMED: { label: 'Validé', variant: 'success' },
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { data, isLoading } = useReports({ status: status || undefined, year: year || undefined });

  return (
    <div className="p-6">
      <PageHeader title="Rapports mensuels" description="Tous les rapports de toutes les assemblées" />

      <div className="mb-4 flex gap-2">
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="SUBMITTED">Soumis</option>
          <option value="CONFIRMED">Validé</option>
        </select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Toutes les années</option>
          {[2026, 2025, 2024].map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assemblée</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Total dîmes</TableHead>
              <TableHead>Total offrandes</TableHead>
              <TableHead>Total général</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Soumis le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((r: MonthlyReport) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.assembly?.name}</TableCell>
                <TableCell>{monthName(r.month)} {r.year}</TableCell>
                <TableCell>{formatFcfa(r.totalTithes)}</TableCell>
                <TableCell>{formatFcfa(r.totalOfferings)}</TableCell>
                <TableCell className="font-bold">{formatFcfa(r.totalAmount)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_LABELS[r.status].variant}>{STATUS_LABELS[r.status].label}</Badge>
                </TableCell>
                <TableCell>{r.submittedAt ? formatDate(r.submittedAt) : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewId(r.id)} title="Voir">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {r.status === 'SUBMITTED' && (
                      <Button size="sm" onClick={() => setConfirmId(r.id)}>
                        Confirmer réception
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/reports/${r.id}/export/excel`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `rapport_${r.assembly?.name}_${r.month}_${r.year}.xlsx`.replace(/\s+/g, '_'));
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (e: any) {
                          toast.error('Export impossible');
                        }
                      }}
                      title="Exporter Excel"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Aucun rapport.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {viewId && <ReportDetailDialog id={viewId} onClose={() => setViewId(null)} />}
      {confirmId && <ConfirmDialog id={confirmId} onClose={() => setConfirmId(null)} />}
    </div>
  );
}

function ReportDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useReport(id);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rapport — {data ? `${data.assembly?.name} — ${monthName(data.month)} ${data.year}` : ''}</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <p>Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Statut : </span><Badge variant={STATUS_LABELS[data.status].variant as any}>{STATUS_LABELS[data.status].label}</Badge></div>
              <div><span className="text-muted-foreground">Trésorier : </span>{data.submitter?.fullName}</div>
              <div><span className="text-muted-foreground">Membres : </span>{data.totalMembers}</div>
              <div><span className="text-muted-foreground">Contributeurs : </span>{data.contributingMembers}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Total dîmes" value={formatFcfa(data.totalTithes)} />
              <StatCard label="Total offrandes" value={formatFcfa(data.totalOfferings)} />
              <StatCard label="TOTAL" value={formatFcfa(data.totalAmount)} />
            </div>
            {data.categoryTotals && data.categoryTotals.length > 0 && (
              <div>
                <p className="mb-2 font-semibold text-sm">Répartition par rubrique :</p>
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
              </div>
            )}
            {data.confirmations && data.confirmations.length > 0 && (
              <div className="rounded-md bg-green-50 p-3 text-sm">
                <p className="font-semibold text-green-800">Réception confirmée</p>
                <p className="text-green-700">Par : {data.confirmations[0].confirmer?.fullName}</p>
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

function ConfirmDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useReport(id);
  const confirm = useConfirmReport();
  const [received, setReceived] = useState('');
  const [notes, setNotes] = useState('');

  const submit = async () => {
    const amount = Number(received);
    if (!amount) {
      toast.error('Saisissez un montant');
      return;
    }
    try {
      await confirm.mutateAsync({ reportId: id, data: { receivedAmount: amount, notes } });
      toast.success('Réception confirmée. Rapport validé.');
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la réception</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-3">
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <p>Rapport : <strong>{data.assembly?.name}</strong> — {monthName(data.month)} {data.year}</p>
              <p>Montant déclaré : <strong>{formatFcfa(data.totalAmount)}</strong></p>
              <p className="mt-1 text-xs">⚠️ Le montant reçu doit être exactement égal au montant déclaré.</p>
            </div>
            <div>
              <Label>Montant reçu (FCFA) *</Label>
              <Input type="number" value={received} onChange={(e) => setReceived(e.target.value)} placeholder={String(data.totalAmount)} />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={confirm.isPending} className="w-full">
              {confirm.isPending ? 'Confirmation...' : 'Confirmer la réception'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
