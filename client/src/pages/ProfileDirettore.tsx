import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Users, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ProfileDirettore() {
  // Fetch all members
  const { data: members = [] } = trpc.users.list.useQuery({});

  // Fetch all events
  const { data: events = [] } = trpc.events.list.useQuery({});

  // Fetch songs
  const { data: songs = [] } = trpc.songs.list.useQuery({});

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

  // Calculate statistics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "active").length;
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.startAt) > new Date()).length;
  const pastEvents = totalEvents - upcomingEvents;

  // Group members by voice section
  const membersBySection = members.reduce((acc: Record<string, number>, member) => {
    const section = member.voiceSection || "unassigned";
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {});

  // Group events by type
  const eventsByType = events.reduce((acc: Record<string, number>, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rehearsal: "Prova",
      concert: "Concerto",
      meeting: "Riunione",
      other: "Altro",
    };
    return labels[type] || type;
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profilo Direttore</h1>
          <p className="text-muted-foreground mt-2">
            Dashboard statistiche e gestione artistica del coro
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <Music2 className="h-5 w-5 mr-2" />
          Direttore
        </Badge>
      </div>

      {/* Main Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membri Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">su {totalMembers} totali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventi Programmati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">{pastEvents} eventi passati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Brani Repertorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{songs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">brani attivi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasso Attività
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">membri attivi</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Sezioni Vocali</TabsTrigger>
          <TabsTrigger value="events">Eventi</TabsTrigger>
          <TabsTrigger value="repertoire">Repertorio</TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuzione Sezioni Vocali
              </CardTitle>
              <CardDescription>Composizione del coro per sezione vocale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(membersBySection).map(([section, count]) => (
                  <div key={section} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getVoiceSectionLabel(section)}</span>
                      <span className="text-muted-foreground">
                        {count} membri ({totalMembers > 0 ? ((count / totalMembers) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${totalMembers > 0 ? (count / totalMembers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membri per Sezione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(membersBySection).map(([section, count]) => (
                  <div key={section} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{getVoiceSectionLabel(section)}</p>
                        <p className="text-sm text-muted-foreground">{count} membri</p>
                      </div>
                      <div className="text-3xl font-bold text-primary">{count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiche Eventi
              </CardTitle>
              <CardDescription>Analisi eventi per tipologia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(eventsByType).map(([type, count]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getEventTypeLabel(type)}</span>
                      <span className="text-muted-foreground">
                        {count} eventi ({totalEvents > 0 ? ((count / totalEvents) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{
                          width: `${totalEvents > 0 ? (count / totalEvents) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prossimi Eventi</CardTitle>
              <CardDescription>{upcomingEvents} eventi programmati</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun evento programmato
                </p>
              ) : (
                <div className="space-y-3">
                  {events
                    .filter((e) => new Date(e.startAt) > new Date())
                    .slice(0, 5)
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                        <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repertoire Tab */}
        <TabsContent value="repertoire" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="h-5 w-5" />
                Repertorio Musicale
              </CardTitle>
              <CardDescription>{songs.length} brani nel repertorio</CardDescription>
            </CardHeader>
            <CardContent>
              {songs.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground">Nessun brano nel repertorio</p>
                  <p className="text-sm text-muted-foreground">
                    Inizia ad aggiungere brani per costruire il repertorio del coro
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {songs.map((song: any) => (
                    <div key={song.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">{song.title}</p>
                        {song.composer && (
                          <p className="text-sm text-muted-foreground">{song.composer}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {song.genre && <Badge variant="outline">{song.genre}</Badge>}
                      </div>
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
