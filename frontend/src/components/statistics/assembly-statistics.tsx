'use client';

import { useMemo, useState } from 'react';
import { BarChart3, HeartHandshake, Users } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAssemblyMemberStats, useDashboard, useMemberFidelity } from '@/hooks/queries';
import { useAuthStore, getActiveAssemblyId } from '@/stores/auth-store';
import { formatFcfa, monthName } from '@/lib/utils';

export function AssemblyStatistics() {
  const { user } = useAuthStore();
  const assemblyId = getActiveAssemblyId(user);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const { data, isLoading } = useDashboard({ assemblyId, year: Number(year) });
  const { data: members, isLoading: isMembersLoading } = useAssemblyMemberStats(Number(year));
  const { data: fidelity, isLoading: isFidelityLoading } = useMemberFidelity(selectedMemberId, Number(year));
  const assemblyName = user?.roles?.find((role) => role.assemblyId)?.assemblyName || 'Mon assemblée';

  const monthlyData = useMemo(
    () => Array.from({ length: 12 }, (_, index) => data?.monthlyStats?.find((item) => item.month === index + 1) ?? {
      month: index + 1,
      newMembers: 0,
      tithes: 0,
      offerings: 0,
      total: 0,
    }),
    [data?.monthlyStats],
  );
  const maxContribution = Math.max(1, ...monthlyData.map((item) => item.total));
  const maxNewMembers = Math.max(1, ...monthlyData.map((item) => item.newMembers));
  const filteredMembers = members?.filter((member) => member.memberName.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const maxFidelityAmount = Math.max(
    1,
    ...(fidelity?.titheFidelity.monthsWithTithe.map((item) => item.amount) || []),
    ...(fidelity?.offeringFidelity.monthsWithOffering.map((item) => item.amount) || []),
  );
  const titheByMonth = new Map(
    fidelity?.titheFidelity.monthsWithTithe.map((item) => [item.month, item.amount]),
  );
  const offeringByMonth = new Map(
    fidelity?.offeringFidelity.monthsWithOffering.map((item) => [item.month, item.amount]),
  );

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={`Statistiques — ${assemblyName}`}
        description="Suivi des contributions et de la fidélité des membres de votre assemblée"
        action={
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full sm:w-32">
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Membres actifs" value={data?.indicators.activeMembers || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Dîmes" value={formatFcfa(data?.indicators.totalTithes || 0)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="Offrandes" value={formatFcfa(data?.indicators.totalOfferings || 0)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="Total collecté" value={formatFcfa(data?.indicators.totalAmount || 0)} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des contributions ({year})</CardTitle>
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
            {!isLoading && !data?.indicators.contributionsCount && (
              <p className="mt-3 text-center text-sm text-muted-foreground">Aucune contribution sur cette période.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution des membres ({year})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">Nouvelles arrivées dans l&apos;assemblée par mois</p>
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
              Membres actifs : {data?.indicators.activeMembers || 0} / {data?.indicators.totalMembers || 0}
            </p>
          </CardContent>
        </Card>

        {data?.categoryStats && data.categoryStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition des offrandes par rubrique</CardTitle>
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
                  {data.categoryStats.map((category) => {
                    const categoryTotal = data.categoryStats?.reduce((sum, item) => sum + item.total, 0) || 1;
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">{formatFcfa(category.total)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{((category.total / categoryTotal) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-800" /> Suivi de fidélité des membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              className="mb-4 max-w-md"
              placeholder="Rechercher un membre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher un membre"
            />
            {isMembersLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Chargement des membres...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Dîmes</TableHead>
                    <TableHead className="text-right">Offrandes</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Fidélité globale</TableHead>
                    <TableHead>Suivi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers?.map((member) => (
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
                        <button
                          type="button"
                          className="text-sm font-medium text-emerald-800 underline-offset-4 hover:underline"
                          onClick={() => setSelectedMemberId(member.memberId)}
                        >
                          Voir
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMembers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">Aucun membre trouvé.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {selectedMemberId && (
              <div className="mt-6 rounded-lg border p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    Fidélité de {members?.find((member) => member.memberId === selectedMemberId)?.memberName || 'ce membre'} — {year}
                  </h3>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedMemberId('')}
                  >
                    Fermer
                  </button>
                </div>
                {isFidelityLoading ? (
                  <p className="py-4 text-sm text-muted-foreground">Chargement du suivi...</p>
                ) : fidelity ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <StatCard label="Fidélité globale" value={`${fidelity.summary.globalFidelityRate.toFixed(1)}%`} description={`${fidelity.totalMonths} mois suivis`} className="bg-emerald-50" />
                      <StatCard label="Fidélité aux dîmes" value={`${fidelity.titheFidelity.rate.toFixed(1)}%`} description={formatFcfa(fidelity.titheFidelity.cumulated)} />
                      <StatCard label="Fidélité aux offrandes" value={`${fidelity.offeringFidelity.rate.toFixed(1)}%`} description={formatFcfa(fidelity.offeringFidelity.cumulated)} className="bg-amber-50" />
                    </div>
                    <div className="mt-5">
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
                        <p>Mois sans dîme : {fidelity.titheFidelity.monthsWithoutTithe.map((item) => `${monthName(item.month).slice(0, 3)} ${item.year}`).join(', ') || 'aucun'}</p>
                        <p>Mois sans offrande : {fidelity.offeringFidelity.monthsWithoutOffering.map((item) => `${monthName(item.month).slice(0, 3)} ${item.year}`).join(', ') || 'aucun'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">Aucun suivi de fidélité disponible pour ce membre.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
