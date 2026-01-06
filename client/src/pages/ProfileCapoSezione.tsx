import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Music, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ProfileCapoSezione() {
  const { user } = useAuth();

  // Fetch user profile to get voice section
  const { data: profile } = trpc.users.get.useQuery(
    { userId: user?.user?.id || 0 },
    { enabled: !!user?.user?.id }
  );

  // Fetch members of the same voice section
  const { data: sectionMembers = [] } = trpc.users.list.useQuery(
    {
      voiceSection: profile?.voiceSection || undefined,
      status: "active",
    },
    { enabled: !!profile?.voiceSection }
  );

  // Fetch all events
  const { data: events = [] } = trpc.events.list.useQuery({});

  const getVoiceSectionLabel = (section: string | null) => {
    if (!section) return "Non assegnata";
    const labels: Record<string, string> = {
      soprano: "Soprano",
      mezzo_soprano: "Mezzosoprano",
      alto: "Alto",
      tenor: "Tenore",
      baritone: "Baritono",
      bass: "Basso",
    };
    return labels[section] || section;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Attivo</Badge>;
      case "suspended":
        return <Badge variant="secondary">Sospeso</Badge>;
      case "exited":
        return <Badge variant="destructive">Uscito</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!profile) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Caricamento profilo...
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate section statistics
  const totalMembers = sectionMembers.length;
  const activeMembers = sectionMembers.filter((m) => m.status === "active").length;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profilo Capo Sezione</h1>
          <p className="text-muted-foreground mt-2">
            Gestione Sezione {getVoiceSectionLabel(profile.voiceSection)}
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <Music className="h-5 w-5 mr-2" />
          {getVoiceSectionLabel(profile.voiceSection)}
        </Badge>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Membri Sezione</TabsTrigger>
          <TabsTrigger value="stats">Statistiche</TabsTrigger>
          <TabsTrigger value="events">Eventi</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membri della Sezione {getVoiceSectionLabel(profile.voiceSection)}
              </CardTitle>
              <CardDescription>
                {activeMembers} membri attivi su {totalMembers} totali
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sectionMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun membro nella sezione
                </p>
              ) : (
                <div className="space-y-3">
                  {sectionMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-semibold text-primary">
                              {member.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.phone && (
                          <div className="text-sm text-muted-foreground">{member.phone}</div>
                        )}
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Membri Totali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalMembers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Membri Attivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{activeMembers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasso Attività
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(0) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Presenze Sezione
              </CardTitle>
              <CardDescription>
                Statistiche presenze per la sezione {getVoiceSectionLabel(profile.voiceSection)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Funzionalità in sviluppo: Report presenze dettagliato per sezione con grafici e
                  trend temporali.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prossimi Eventi
              </CardTitle>
              <CardDescription>Eventi programmati per il coro</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun evento programmato</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.startAt), "d MMMM yyyy 'alle' HH:mm", {
                            locale: it,
                          })}
                        </p>
                        {event.locationString && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {event.locationString}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
