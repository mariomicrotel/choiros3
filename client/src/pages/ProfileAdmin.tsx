import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield,
  Database,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ProfileAdmin() {
  // Fetch organization data
  const { data: organization } = trpc.tenant.get.useQuery();

  // Fetch all members
  const { data: members = [] } = trpc.users.list.useQuery({});

  // Fetch all events
  const { data: events = [] } = trpc.events.list.useQuery({});

  // Fetch all payments
  const { data: payments = [] } = trpc.payments.list.useQuery({});

  // Calculate statistics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "active").length;
  const suspendedMembers = members.filter((m) => m.status === "suspended").length;
  const exitedMembers = members.filter((m) => m.status === "exited").length;

  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.startAt) > new Date()).length;

  const totalPayments = payments.length;
  const completedPayments = payments.filter((p: any) => p.status === "completed").length;
  const pendingPayments = payments.filter((p: any) => p.status === "pending").length;
  const failedPayments = payments.filter((p: any) => p.status === "failed").length;

  // Calculate total revenue
  const totalRevenue = payments
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0);

  const pendingRevenue = payments
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0);

  // Group members by role
  const membersByRole = members.reduce((acc: Record<string, number>, member: any) => {
    const role = member.role || "member";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      director: "Direttore",
      secretary: "Segretario",
      capo_section: "Capo Sezione",
      member: "Membro",
      guest: "Ospite",
    };
    return labels[role] || role;
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profilo Amministratore</h1>
          <p className="text-muted-foreground mt-2">
            Gestione completa organizzazione e configurazione sistema
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <Shield className="h-5 w-5 mr-2" />
          Admin
        </Badge>
      </div>

      {/* Organization Info */}
      {organization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informazioni Organizzazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome Organizzazione</p>
                <p className="text-lg font-semibold">{organization.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <p className="text-lg font-mono">{organization.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logo</p>
                <p className="text-lg">{organization.logoUrl ? "Presente" : "Non configurato"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membri Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeMembers} attivi, {suspendedMembers} sospesi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">{upcomingEvents} programmati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Entrate Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              €{(totalRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedPayments} pagamenti completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Entrate Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              €{(pendingRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pendingPayments} in sospeso</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Membri</TabsTrigger>
          <TabsTrigger value="payments">Pagamenti</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stato Membri</CardTitle>
                <CardDescription>Distribuzione per stato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Attivi</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{activeMembers}</span>
                      <Badge variant="default">
                        {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(0) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Sospesi</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{suspendedMembers}</span>
                      <Badge variant="secondary">
                        {totalMembers > 0 ? ((suspendedMembers / totalMembers) * 100).toFixed(0) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Usciti</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{exitedMembers}</span>
                      <Badge variant="outline">
                        {totalMembers > 0 ? ((exitedMembers / totalMembers) * 100).toFixed(0) : 0}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Ruoli</CardTitle>
                <CardDescription>Membri per ruolo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(membersByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="font-medium">{getRoleLabel(role)}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pagamenti Completati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{completedPayments}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  €{(totalRevenue / 100).toFixed(2)} totali
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pagamenti Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{pendingPayments}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  €{(pendingRevenue / 100).toFixed(2)} attesi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pagamenti Falliti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{failedPayments}</div>
                <p className="text-sm text-muted-foreground mt-1">da gestire</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Finanziario</CardTitle>
              <CardDescription>Analisi entrate e pagamenti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Entrate Totali</p>
                    <p className="text-sm text-muted-foreground">
                      {completedPayments} pagamenti completati
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    €{(totalRevenue / 100).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Entrate Attese</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingPayments} pagamenti in sospeso
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    €{(pendingRevenue / 100).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/50">
                  <div>
                    <p className="font-medium">Totale Potenziale</p>
                    <p className="text-sm text-muted-foreground">Completati + Pending</p>
                  </div>
                  <div className="text-2xl font-bold">
                    €{((totalRevenue + pendingRevenue) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Statistiche Sistema
              </CardTitle>
              <CardDescription>Informazioni tecniche e utilizzo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Utenti Registrati
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Eventi Totali
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{totalEvents}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Transazioni Totali
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{totalPayments}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Tasso Attività
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funzionalità Amministrative</CardTitle>
              <CardDescription>Azioni disponibili per gli amministratori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
                  <div>
                    <p className="font-medium">Gestione Completa Utenti</p>
                    <p className="text-muted-foreground">
                      Modifica ruoli, stato e permessi di tutti i membri
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
                  <div>
                    <p className="font-medium">Configurazione Organizzazione</p>
                    <p className="text-muted-foreground">
                      Modifica impostazioni, colori e preferenze del coro
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
                  <div>
                    <p className="font-medium">Gestione Finanziaria</p>
                    <p className="text-muted-foreground">
                      Accesso completo a pagamenti, quote e statistiche finanziarie
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
                  <div>
                    <p className="font-medium">Export e Backup Dati</p>
                    <p className="text-muted-foreground">
                      Esportazione completa dei dati in formati CSV/PDF
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
