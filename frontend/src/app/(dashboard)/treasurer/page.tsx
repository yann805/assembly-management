'use client';

import { useState } from 'react';
import { Users, Wallet, TrendingUp, FileText } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboard } from '@/hooks/queries';
import { useAuthStore } from '@/stores/auth-store';
import { formatFcfa, monthName } from '@/lib/utils';
import Link from 'next/link';

export default function TreasurerDashboard() {
  const { user } = useAuthStore();
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState<string>(String(month));
  const [filterYear, setFilterYear] = useState<string>(String(year));

  const { data, isLoading } = useDashboard({
    month: Number(filterMonth),
    year: Number(filterYear),
  });

  const assemblyName = user?.roles?.find((r) => r.assemblyId)?.assemblyName || 'Mon assemblée';
  const ind = data?.indicators;

  return (
    <div className="p-6">
      <PageHeader
        title={`Tableau de bord — ${assemblyName}`}
        description="Vue d'ensemble de votre assemblée"
        action={
          <div className="flex gap-2">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{monthName(i + 1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Membres actifs" value={ind?.activeMembers || 0} icon={<Users className="h-5 w-5" />} description={`${ind?.newMembers || 0} nouveaux ce mois`} />
            <StatCard label="Contributions" value={ind?.contributionsCount || 0} icon={<Wallet className="h-5 w-5" />} />
            <StatCard label="Total dîmes" value={formatFcfa(ind?.totalTithes || 0)} icon={<TrendingUp className="h-5 w-5" />} className="bg-emerald-50" />
            <StatCard label="Total offrandes" value={formatFcfa(ind?.totalOfferings || 0)} icon={<TrendingUp className="h-5 w-5" />} className="bg-amber-50" />
          </div>

          <StatCard
            label="TOTAL collecté"
            value={formatFcfa(ind?.totalAmount || 0)}
            icon={<Wallet className="h-5 w-5" />}
            className="mt-4 bg-white"
          />

          {data?.categoryStats && data.categoryStats.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Répartition des offrandes par rubrique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.categoryStats.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="secondary">{formatFcfa(c.total)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data?.recentReports && data.recentReports.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Rapports récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentReports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-medium">{monthName(r.month)} {r.year}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{formatFcfa(r.totalAmount)}</span>
                      </div>
                      <Badge variant={r.status === 'CONFIRMED' ? 'success' : r.status === 'SUBMITTED' ? 'warning' : 'secondary'}>
                        {r.status === 'CONFIRMED' ? 'Validé' : r.status === 'SUBMITTED' ? 'Soumis' : 'Brouillon'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex gap-2">
            <Link href="/treasurer/contributions">
              <Button>Enregistrer une contribution</Button>
            </Link>
            <Link href="/treasurer/members">
              <Button variant="outline">Gérer les membres</Button>
            </Link>
            <Link href="/treasurer/reports">
              <Button variant="outline">Générer un rapport</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
