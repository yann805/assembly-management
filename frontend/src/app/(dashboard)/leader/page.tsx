'use client';

import { useState } from 'react';
import { Building2, Eye, Users, Wallet } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useAssemblyMemberStats,
  useDashboard,
  useMember,
  useMemberContributions,
  useMemberFidelity,
  useReports,
} from '@/hooks/queries';
import { useAuthStore, getActiveAssemblyId } from '@/stores/auth-store';
import { formatFcfa, formatDate, monthName } from '@/lib/utils';

export default function LeaderDashboard() {
  const { user } = useAuthStore();
  const assemblyId = getActiveAssemblyId(user) || '';
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const { data, isLoading } = useDashboard({ year: Number(year) });
  const { data: reports } = useReports({ assemblyId });
  const { data: memberStats, isLoading: isMemberStatsLoading } = useAssemblyMemberStats(Number(year));

  const assemblyName = user?.roles?.find((r) => r.assemblyId)?.assemblyName || 'Mon assemblée';
  const ind = data?.indicators;

  return (
    <div className="p-6">
      <PageHeader
        title={`Espace Dirigeant — ${assemblyName}`}
        description="Suivi consultatif des contributions et de la fidélité des membres"
        action={
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((value) => (
                <SelectItem key={value} value={String(value)}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Membres actifs" value={ind?.activeMembers || 0} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Contributions" value={ind?.contributionsCount || 0} icon={<Wallet className="h-5 w-5" />} />
            <StatCard label="Dîmes" value={formatFcfa(ind?.totalTithes || 0)} icon={<Building2 className="h-5 w-5" />} />
            <StatCard label="Offrandes" value={formatFcfa(ind?.totalOfferings || 0)} icon={<Building2 className="h-5 w-5" />} />
          </div>

          <StatCard label="Total collecté" value={formatFcfa(ind?.totalAmount || 0)} className="mt-4 bg-white" />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Contributions et fidélité par membre — {year}</CardTitle>
            </CardHeader>
            <CardContent>
              {isMemberStatsLoading ? (
                <p>Chargement des membres...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Dîmes</TableHead>
                      <TableHead className="text-right">Offrandes</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Fidélité</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberStats?.map((member) => (
                      <TableRow key={member.membershipId}>
                        <TableCell className="font-medium">{member.memberName}</TableCell>
                        <TableCell>
                          <Badge variant={member.membershipStatus === 'ACTIVE' && member.memberStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                            {member.membershipStatus === 'ACTIVE' && member.memberStatus === 'ACTIVE' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatFcfa(member.totalTithes)}</TableCell>
                        <TableCell className="text-right">{formatFcfa(member.totalOfferings)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatFcfa(member.totalAmount)}</TableCell>
                        <TableCell className="text-right">{member.globalFidelityRate.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMemberId(member.memberId)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {memberStats?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">Aucun membre dans cette assemblée.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {reports && reports.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Rapports récents</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Soumis le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.slice(0, 10).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{monthName(report.month)} {report.year}</TableCell>
                        <TableCell className="text-right">{formatFcfa(report.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'CONFIRMED' ? 'success' : report.status === 'SUBMITTED' ? 'warning' : 'secondary'}>
                            {report.status === 'CONFIRMED' ? 'Validé' : report.status === 'SUBMITTED' ? 'Soumis' : 'Brouillon'}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.submittedAt ? formatDate(report.submittedAt) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800">
                <strong>Consultation uniquement :</strong> les opérations financières restent gérées par le trésorier de l&apos;assemblée.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {selectedMemberId && (
        <MemberContributionDialog
          memberId={selectedMemberId}
          year={Number(year)}
          onClose={() => setSelectedMemberId('')}
        />
      )}
    </div>
  );
}

function MemberContributionDialog({
  memberId,
  year,
  onClose,
}: {
  memberId: string;
  year: number;
  onClose: () => void;
}) {
  const { data: member } = useMember(memberId);
  const { data: contributions, isLoading: isContributionsLoading } = useMemberContributions(memberId);
  const { data: fidelity, isLoading: isFidelityLoading } = useMemberFidelity(memberId, year);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Suivi de {member?.fullName || 'ce membre'} — {year}</DialogTitle>
        </DialogHeader>
        {isFidelityLoading ? (
          <p>Chargement de la fidélité...</p>
        ) : fidelity ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Fidélité globale"
              value={`${fidelity.summary.globalFidelityRate.toFixed(1)}%`}
              description={`${fidelity.totalMonths} mois suivis`}
            />
            <StatCard
              label="Fidélité des dîmes"
              value={`${fidelity.titheFidelity.rate.toFixed(1)}%`}
              description={formatFcfa(fidelity.titheFidelity.cumulated)}
            />
            <StatCard
              label="Fidélité des offrandes"
              value={`${fidelity.offeringFidelity.rate.toFixed(1)}%`}
              description={formatFcfa(fidelity.offeringFidelity.cumulated)}
            />
          </div>
        ) : null}

        {fidelity && (
          <p className="text-sm text-muted-foreground">
            Mois sans dîme : {fidelity.titheFidelity.monthsWithoutTithe.map((item) => `${monthName(item.month).slice(0, 3)} ${item.year}`).join(', ') || 'aucun'}.
            {' '}Mois sans offrande : {fidelity.offeringFidelity.monthsWithoutOffering.map((item) => `${monthName(item.month).slice(0, 3)} ${item.year}`).join(', ') || 'aucun'}.
          </p>
        )}

        <div>
          <p className="mb-2 font-semibold">Historique des contributions</p>
          {isContributionsLoading ? (
            <p>Chargement des contributions...</p>
          ) : (
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
                {contributions?.map((contribution: any) => (
                  <TableRow key={contribution.id}>
                    <TableCell>{formatDate(contribution.paymentDate)}</TableCell>
                    <TableCell className="text-right">{formatFcfa(contribution.titheAmount)}</TableCell>
                    <TableCell className="text-right">{formatFcfa(contribution.offeringAmount)}</TableCell>
                    <TableCell className="text-right font-bold">{formatFcfa(contribution.totalAmount)}</TableCell>
                    <TableCell>{contribution.recorder?.fullName || '—'}</TableCell>
                  </TableRow>
                ))}
                {contributions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Aucune contribution.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
