import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Users, Music, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const userId = user?.user?.id;

  // Fetch upcoming events
  const { data: events = [] } = trpc.events.list.useQuery(
    {
      limit: 5,
      startDate: new Date(),
    },
    { enabled: !!userId }
  );

  // Fetch user payments
  const { data: payments = [] } = trpc.payments.list.useQuery(
    {
      userId: userId,
      limit: 5,
    },
    { enabled: !!userId }
  );

  // Fetch user attendance
  const { data: attendance = [] } = trpc.attendance.myAttendance.useQuery(undefined, { enabled: !!userId });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const attendanceRate = attendance.length > 0 ? (attendance.filter((a) => a.status === "present").length / attendance.length) * 100 : 0;

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Benvenuto, {user?.user?.name || "Corista"}!</h1>
        <p className="text-muted-foreground mt-2">Ecco un riepilogo delle tue attività nel coro</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prossimi Eventi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Nei prossimi 30 giorni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamenti in Sospeso</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">Quote da pagare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Presenze</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Su {attendance.length} eventi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repertorio</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Brani attivi</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Prossimi Eventi</CardTitle>
          <CardDescription>Eventi programmati nelle prossime settimane</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessun evento programmato</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant={event.type === "concert" ? "default" : event.type === "rehearsal" ? "secondary" : "outline"}>
                        {event.type === "concert" ? "Concerto" : event.type === "rehearsal" ? "Prova" : event.type === "meeting" ? "Riunione" : "Altro"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startAt), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </p>
                    {event.locationString && <p className="text-sm text-muted-foreground">📍 {event.locationString}</p>}
                  </div>
                  <Link href={`/events/${event.id}`}>
                    <Button variant="outline" size="sm">
                      Dettagli
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Pagamenti</CardTitle>
          <CardDescription>Quote associative e pagamenti</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessun pagamento registrato</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{payment.description || "Pagamento"}</h3>
                      {payment.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {payment.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                      {payment.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.amountCents / 100} {payment.currency}
                      {payment.dueAt && ` - Scadenza: ${format(new Date(payment.dueAt), "d MMM yyyy", { locale: it })}`}
                    </p>
                  </div>
                  <Badge
                    variant={payment.status === "completed" ? "default" : payment.status === "pending" ? "secondary" : "destructive"}
                  >
                    {payment.status === "completed" ? "Pagato" : payment.status === "pending" ? "In Sospeso" : "Fallito"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/calendar">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendario
              </CardTitle>
              <CardDescription>Visualizza tutti gli eventi</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/repertoire">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Repertorio
              </CardTitle>
              <CardDescription>Spartiti e brani</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profilo
              </CardTitle>
              <CardDescription>I tuoi dati personali</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
