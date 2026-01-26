import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

export default function SuperadminDashboard() {
  // Auto-refresh session to ensure we have latest role/permissions
  const { isRefreshing } = useSessionRefresh();
  
  const { data: stats, isLoading } = trpc.superadmin.stats.useQuery();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Errore nel caricamento delle statistiche</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Superadmin</h1>
        <p className="text-muted-foreground mt-2">
          Panoramica globale di tutte le organizzazioni e sottoscrizioni
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Organizations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizzazioni Totali</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.organizations.active} attive, {stats.organizations.suspended} sospese
            </p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sottoscrizioni Attive</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.organizations.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.organizations.active / stats.organizations.total) * 100).toFixed(1)}% del totale
            </p>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Mensile)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.revenue.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ARR: {formatCurrency(stats.revenue.arr)}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rinnovi Prossimi 30gg</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.upcomingRenewals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sottoscrizioni in scadenza
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
          <CardDescription>
            Gestisci organizzazioni e sottoscrizioni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="/superadmin/organizations"
            className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Gestione Organizzazioni</p>
                <p className="text-sm text-muted-foreground">
                  Visualizza, crea e modifica organizzazioni
                </p>
              </div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
