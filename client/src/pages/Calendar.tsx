import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

type RsvpStatus = "attending" | "not_attending" | "maybe";

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>("attending");
  const [motivation, setMotivation] = useState("");

  const utils = trpc.useUtils();

  // Fetch events for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: events = [] } = trpc.events.list.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
    type: filterType !== "all" ? (filterType as any) : undefined,
    limit: 100,
  });

  // RSVP mutation
  const rsvpMutation = trpc.events.rsvp.useMutation({
    onSuccess: () => {
      toast.success("Risposta registrata con successo!");
      utils.events.list.invalidate();
      setSelectedEvent(null);
      setMotivation("");
    },
    onError: (error) => {
      toast.error("Errore durante la registrazione: " + error.message);
    },
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Add padding days to start from Monday
    const firstDayOfWeek = start.getDay();
    const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const paddedDays = [
      ...Array(paddingStart)
        .fill(null)
        .map((_, i) => new Date(start.getTime() - (paddingStart - i) * 24 * 60 * 60 * 1000)),
      ...days,
    ];

    return paddedDays;
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startAt), day));
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleRsvp = () => {
    if (!selectedEvent) return;

    rsvpMutation.mutate({
      eventId: selectedEvent.id,
      status: rsvpStatus,
      motivation: motivation || undefined,
    });
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario Eventi</h1>
          <p className="text-muted-foreground mt-2">Visualizza e gestisci gli eventi del coro</p>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtra per tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli eventi</SelectItem>
            <SelectItem value="rehearsal">Prove</SelectItem>
            <SelectItem value="concert">Concerti</SelectItem>
            <SelectItem value="meeting">Riunioni</SelectItem>
            <SelectItem value="other">Altro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">{format(currentDate, "MMMM yyyy", { locale: it })}</CardTitle>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg ${
                    !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
                  } ${isToday ? "border-primary border-2" : ""} hover:bg-accent/50 transition-colors`}
                >
                  <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors truncate"
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-muted-foreground">{format(new Date(event.startAt), "HH:mm")}</div>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">+{dayEvents.length - 2} altri</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.title}
              <Badge
                variant={
                  selectedEvent?.type === "concert"
                    ? "default"
                    : selectedEvent?.type === "rehearsal"
                    ? "secondary"
                    : "outline"
                }
              >
                {selectedEvent?.type === "concert"
                  ? "Concerto"
                  : selectedEvent?.type === "rehearsal"
                  ? "Prova"
                  : selectedEvent?.type === "meeting"
                  ? "Riunione"
                  : "Altro"}
              </Badge>
            </DialogTitle>
            <DialogDescription>Dettagli dell'evento e conferma partecipazione</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedEvent.startAt), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}</span>
                </div>
                {selectedEvent.locationString && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.locationString}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="text-sm text-muted-foreground mt-4">
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
                {selectedEvent.notes && (
                  <div className="text-sm bg-muted p-3 rounded-lg mt-4">
                    <p className="font-medium mb-1">Note:</p>
                    <p>{selectedEvent.notes}</p>
                  </div>
                )}
              </div>

              {/* RSVP Section */}
              {user && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Conferma la tua partecipazione
                  </h3>

                  <Select value={rsvpStatus} onValueChange={(value) => setRsvpStatus(value as RsvpStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attending">✅ Parteciperò</SelectItem>
                      <SelectItem value="not_attending">❌ Non posso partecipare</SelectItem>
                      <SelectItem value="maybe">❓ Forse</SelectItem>
                    </SelectContent>
                  </Select>

                  {rsvpStatus === "not_attending" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Motivazione (opzionale)</label>
                      <Textarea
                        placeholder="Indica il motivo dell'assenza..."
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <Button onClick={handleRsvp} disabled={rsvpMutation.isPending} className="w-full">
                    {rsvpMutation.isPending ? "Salvataggio..." : "Conferma Risposta"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
