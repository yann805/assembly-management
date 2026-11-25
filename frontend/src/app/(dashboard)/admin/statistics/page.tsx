'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboard, useAssemblies, useAuditLogs, useMemberFidelity, useMembers } from '@/hooks/queries';
import { formatFcfa, formatDateTime, monthName } from '@/lib/utils';
import { BarChart3, History, HeartHandshake, Users } from 'lucide-react';

export default function AdminStatisticsPage() {
  const [assemblyId, setAssemblyId] = useState('all');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [memberSearch, setMemberSearch] = useState('');
  const [memberId, setMemberId] = useState('');
  const { data } = useDashboard({
    assemblyId: assemblyId === 'all' ? undefined : assemblyId,
    year: Number(year),
  });
  const { data: assemblies } = useAssemblies();
  const { data: logs } = useAuditLogs({ limit: 20, assemblyId: assemblyId === 'all' ? undefined : assemblyId });
  const { data: members } = useMembers({
    page: 1,
    limit: 50,
    search: memberSearch || undefined,
    assemblyId: assemblyId === 'all' ? undefined : assemblyId,
  });
  const { data: fidelity, isLoading: isFidelityLoading } = useMemberFidelity(memberId, Number(year));
  const categoryStats = data?.categoryStats ?? [];
  const monthlyStats = data?.monthlyStats || [];
  const monthlyData = Array.from({ length: 12 }, (_, index) =>
    monthlyStats.find((item) => item.month === index + 1) || {
      month: index + 1,
      newMembers: 0,
      tithes: 0,
      offerings: 0,
      total: 0,
    },
  );
  const maxContribution = Math.max(1, ...monthlyData.map((item) => item.total));
  const maxNewMembers = Math.max(1, ...monthlyData.map((item) => item.newMembers));
  const maxAssemblyMembers = Math.max(1, ...(data?.assemblyStats || []).map((item) => item.activeMembers));
  const maxFidelityAmount = Math.max(
    1,
    ...(fidelity?.titheFidelity.monthsWithTithe.map((item) => item.amount) || []),
    ...(fidelity?.offeringFidelity.monthsWithOffering.map((item) => item.amount) || []),
  );
  const titheByMonth = new Map(fidelity?.titheFidelity.monthsWithTithe.map((item) => [item.month, item.amount]));
  const offeringByMonth = new Map(fidelity?.offeringFidelity.monthsWithOffering.map((item) => [item.month, item.amount]));

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Statistiques & Audit"
        description="Analyse globale et journal des actions"
        action={
          <div className="grid w-full grid-cols-[minmax(0,1fr)_5rem] gap-2 sm:flex sm:w-auto">
            <Select value={assemblyId} onValueChange={setAssemblyId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Toutes les assemblées" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les assemblées</SelectItem>
                {assemblies?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Dîmes" value={formatFcfa(data?.indicators.totalTithes || 0)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="Offrandes" value={formatFcfa(data?.indicators.totalOfferings || 0)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="Total collecté" value={formatFcfa(data?.indicators.totalAmount || 0)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="Contributions" value={data?.indicators.contributionsCount || 0} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-800" /> Évolution des contributions ({year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-800" /> Dîmes</span>
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Offrandes</span>
            </div>
            <div className="grid h-48 grid-cols-6 items-end gap-2 sm:grid-cols-12" role="img" aria-label={`Contributions mensuelles pour ${year}`}>
              {monthlyData.map((item) => (
                <div key={item.month} className="flex h-full flex-col items-center justify-end gap-2">
                  <div
                    className="flex w-full max-w-8 flex-col-reverse overflow-hidden rounded-t-md bg-slate-100"
                    style={{ height: `${Math.max(item.total ? 4 : 0, (item.total / maxContribution) * 100)}%` }}
                    title={`${monthName(item.month)} : ${formatFcfa(item.total)}`}
                  >
                    <div className="w-full bg-emerald-800" style={{ height: `${item.total ? (item.tithes / item.total) * 100 : 0}%` }} />
                    <div className="w-full bg-amber-400" style={{ height: `${item.total ? (item.offerings / item.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{monthName(item.month).slice(0, 3)}</span>
                </div>
              ))}
            </div>
            {!data?.indicators.contributionsCount && (
              <p className="mt-3 text-center text-sm text-muted-foreground">Aucune contribution sur cette période.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-800" /> Évolution des membres ({year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">Nouvelles arrivées par mois</p>
            <div className="grid h-48 grid-cols-6 items-end gap-2 sm:grid-cols-12" role="img" aria-label={`Nouvelles arrivées des membres pour ${year}`}>
              {monthlyData.map((item) => (
                <div key={item.month} className="flex h-full flex-col items-center justify-end gap-2">
                  <div
                    className="flex w-full max-w-8 items-end rounded-t-md bg-emerald-100"
                    style={{ height: `${Math.max(item.newMembers ? 4 : 0, (item.newMembers / maxNewMembers) * 100)}%` }}
                    title={`${monthName(item.month)} : ${item.newMembers} membre(s)`}
                  >
                    <div className="w-full rounded-t-md bg-emerald-800" style={{ height: '100%' }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{monthName(item.month).slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Membres actifs : {data?.indicators.activeMembers || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par assemblée</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.assemblyStats?.length ? (
              <div className="space-y-5">
                {data.assemblyStats.map((assembly) => (
                  <div key={assembly.id} className="grid gap-2 sm:grid-cols-[minmax(8rem,1fr)_3fr_auto] sm:items-center">
                    <span className="truncate text-sm font-medium">{assembly.name}</span>
                    <div
                      className="h-3 overflow-hidden rounded-full bg-emerald-50"
                      role="img"
                      aria-label={`${assembly.activeMembers} membres actifs`}
                      title={`${assembly.activeMembers} membres actifs`}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-800"
                        style={{ width: `${(assembly.activeMembers / maxAssemblyMembers) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between gap-4 text-xs sm:min-w-48 sm:justify-end">
                      <span className="font-semibold">{assembly.activeMembers} membre(s)</span>
                      <span className="text-muted-foreground">{formatFcfa(assembly.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune assemblée à afficher.</p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-800" /> Suivi de fidélité des membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(15rem,1.4fr)]">
              <Input
                placeholder="Rechercher un membre..."
                value={memberSearch}
                onChange={(event) => {
                  setMemberSearch(event.target.value);
                  setMemberId('');
                }}
                aria-label="Rechercher un membre pour le suivi de fidélité"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                aria-label="Choisir un membre"
              >
                <option value="">Choisir un membre</option>
                {members?.data.map((member) => (
                  <option key={member.id} value={member.id}>{member.fullName}</option>
                ))}
              </select>
            </div>

            {memberId && isFidelityLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chargement du suivi...</p>
            ) : memberId && fidelity ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <StatCard
                    label="Fidélité globale"
                    value={`${fidelity.summary.globalFidelityRate.toFixed(1)}%`}
                    description={`${fidelity.totalMonths} mois suivis`}
                    className="bg-emerald-50"
                  />
                  <StatCard
                    label="Fidélité aux dîmes"
                    value={`${fidelity.titheFidelity.rate.toFixed(1)}%`}
                    description={formatFcfa(fidelity.titheFidelity.cumulated)}
                    className="bg-white"
                  />
                  <StatCard
                    label="Fidélité aux offrandes"
                    value={`${fidelity.offeringFidelity.rate.toFixed(1)}%`}
                    description={formatFcfa(fidelity.offeringFidelity.cumulated)}
                    className="bg-amber-50"
                  />
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium">Contributions mensuelles — {year}</p>
                  <div className="grid h-40 grid-cols-6 items-end gap-2 sm:grid-cols-12" role="img" aria-label={`Suivi mensuel de fidélité pour ${year}`}>
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = index + 1;
                      const tithe = titheByMonth.get(month) || 0;
                      const offering = offeringByMonth.get(month) || 0;
                      return (
                        <div key={month} className="flex h-full flex-col items-center justify-end gap-2">
                          <div className="flex h-full w-full max-w-8 items-end justify-center gap-0.5" title={`${monthName(month)} : dîmes ${formatFcfa(tithe)}, offrandes ${formatFcfa(offering)}`}>
                            <div className="w-1/2 rounded-t-sm bg-emerald-800" style={{ height: `${(tithe / maxFidelityAmount) * 100}%` }} />
                            <div className="w-1/2 rounded-t-sm bg-amber-400" style={{ height: `${(offering / maxFidelityAmount) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{monthName(month).slice(0, 3)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>Mois sans dîme : {fidelity.titheFidelity.monthsWithoutTithe.map((item) => monthName(item.month).slice(0, 3)).join(', ') || 'aucun'}</p>
                    <p>Mois sans offrande : {fidelity.offeringFidelity.monthsWithoutOffering.map((item) => monthName(item.month).slice(0, 3)).join(', ') || 'aucun'}</p>
                  </div>
                </div>
              </>
            ) : memberId ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucun suivi de fidélité disponible pour ce membre.</p>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Recherchez puis sélectionnez un membre pour consulter son suivi mensuel.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {categoryStats.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Répartition par rubrique</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubrique</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Part</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryStats.map((c) => {
                  const total = categoryStats.reduce((s, x) => s + x.total, 0) || 1;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{formatFcfa(c.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{((c.total / total) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Journal d'audit (20 dernières actions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{formatDateTime(l.createdAt)}</TableCell>
                  <TableCell>{l.user?.fullName}</TableCell>
                  <TableCell><span className="font-mono text-xs">{l.action}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.entityType}</TableCell>
                </TableRow>
              ))}
              {logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Aucune action.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
