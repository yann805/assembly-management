'use client';

import { useState } from 'react';
import { Building2, Users, Wallet, FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/layout/page-header';
import { useDashboard } from '@/hooks/queries';
import { useAuthStore } from '@/stores/auth-store';
import { formatFcfa } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const { data, isLoading } = useDashboard({ year: Number(year) });

  const ind = data?.indicators;

  return (
    <div className="p-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue globale de toutes les assemblées"
        action={
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2026, 2025, 2024, 2023].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Assemblées" value={ind?.totalAssemblies || 0} icon={<Building2 className="h-5 w-5" />} description={`${ind?.activeAssemblies || 0} active(s)`} />
            <StatCard label="Membres" value={ind?.totalMembers || 0} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Trésoriers" value={ind?.totalTreasurers || 0} icon={<Wallet className="h-5 w-5" />} />
            <StatCard label="Dirigeants" value={ind?.totalLeaders || 0} icon={<Users className="h-5 w-5" />} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total des dîmes" value={formatFcfa(ind?.totalTithes || 0)} icon={<TrendingUp className="h-5 w-5" />} className="bg-emerald-50" />
            <StatCard label="Total des offrandes" value={formatFcfa(ind?.totalOfferings || 0)} icon={<TrendingUp className="h-5 w-5" />} className="bg-amber-50" />
            <StatCard label="Total collecté" value={formatFcfa(ind?.totalAmount || 0)} icon={<Wallet className="h-5 w-5" />} className="bg-white" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Rapports soumis" value={ind?.reportsSubmitted || 0} icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Rapports confirmés" value={ind?.reportsConfirmed || 0} icon={<CheckCircle className="h-5 w-5" />} />
            <StatCard label="Montant reçu" value={formatFcfa(ind?.confirmedReceivedAmount || 0)} icon={<Wallet className="h-5 w-5" />} />
          </div>

          {data?.categoryStats && data.categoryStats.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Totaux par rubrique ({year})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.categoryStats.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{cat.name}</span>
                      <Badge variant="secondary">{formatFcfa(cat.total)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
