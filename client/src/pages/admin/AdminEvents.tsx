import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

type EventType = "rehearsal" | "concert" | "meeting" | "other";

export default function AdminEvents() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    type: "rehearsal" as EventType,
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    locationString: "",
    notes: "",
  });

  const utils = trpc.useUtils();

  // Fetch events
  const { data: events = [], isLoading } = trpc.events.list.useQuery({
    type: filterType !== "all" ? (filterType as any) : undefined,
    limit: 100,
  });

  // Create event mutation
  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Evento creato con successo!");
      utils.events.list.invalidate();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Errore durante la creazione: " + error.message);
    },
  });

  // Update event mutation
  const updateEventMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Evento aggiornato con successo!");
      utils.events.list.invalidate();
      setEditDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error("Errore durante l'aggiornamento: " + error.message);
    },
  });

  // Delete event mutation
  const deleteEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento eliminato con successo!");
      utils.events.list.invalidate();
    },
    onError: (error) => {
      toast.error("Errore durante l'eliminazione: " + error.message);
    },
  });

  // Fetch RSVP list
  const { data: rsvpList = [] } = trpc.events.getRsvpList.useQuery(
    { eventId: selectedEvent?.id || 0 },
    { enabled: rsvpDialogOpen && !!selectedEvent }
  );

  const resetForm = () => {
    setFormData({
      type: "rehearsal",
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      locationString: "",
      notes: "",
    });
  };

  const handleCreateEvent = () => {
    if (!formData.title || !formData.startAt) {
      toast.error("Compila i campi obbligatori");
      return;
    }

    createEventMutation.mutate({
      type: formData.type,
      title: formData.title,
      description: formData.description || undefined,
      startAt: new Date(formData.startAt),
      endAt: formData.endAt ? new Date(formData.endAt) : undefined,
      locationString: formData.locationString || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      type: event.type,
      title: event.title,
      description: event.description || "",
      startAt: format(new Date(event.startAt), "yyyy-MM-dd'T'HH:mm"),
      endAt: event.endAt ? format(new Date(event.endAt), "yyyy-MM-dd'T'HH:mm") : "",
      locationString: event.locationString || "",
      notes: event.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent || !formData.title || !formData.startAt) {
      toast.error("Compila i campi obbligatori");
      return;
    }

    updateEventMutation.mutate({
      eventId: selectedEvent.id,
      type: formData.type,
      title: formData.title,
      description: formData.description || undefined,
      startAt: new Date(formData.startAt),
      endAt: formData.endAt ? new Date(formData.endAt) : undefined,
      locationString: formData.locationString || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Sei sicuro di voler eliminare questo evento?")) {
      deleteEventMutation.mutate({ eventId });
    }
  };

  const handleViewRsvp = (event: any) => {
    setSelectedEvent(event);
    setRsvpDialogOpen(true);
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "concert":
        return <Badge variant="default">Concerto</Badge>;
      case "rehearsal":
        return <Badge variant="secondary">Prova</Badge>;
      case "meeting":
        return <Badge>Riunione</Badge>;
      default:
        return <Badge variant="outline">Altro</Badge>;
    }
  };

  const getRsvpStatusBadge = (status: string) => {
    switch (status) {
      case "attending":
        return <Badge variant="default">Presente</Badge>;
      case "not_attending":
        return <Badge variant="destructive">Assente</Badge>;
      case "maybe":
        return <Badge variant="secondary">Forse</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Eventi</h1>
          <p className="text-muted-foreground mt-2">Organizza prove, concerti e riunioni</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Evento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli eventi</SelectItem>
              <SelectItem value="rehearsal">Prove</SelectItem>
              <SelectItem value="concert">Concerti</SelectItem>
              <SelectItem value="meeting">Riunioni</SelectItem>
              <SelectItem value="other">Altro</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">Caricamento...</CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Nessun evento trovato</CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{event.title}</CardTitle>
                      {getEventTypeBadge(event.type)}
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.startAt), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}
                      </div>
                      {event.locationString && <div className="mt-1">📍 {event.locationString}</div>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewRsvp(event)}>
                      <Users className="h-4 w-4 mr-2" />
                      RSVP
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {event.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Evento</DialogTitle>
            <DialogDescription>Aggiungi un nuovo evento al calendario</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rehearsal">Prova</SelectItem>
                    <SelectItem value="concert">Concerto</SelectItem>
                    <SelectItem value="meeting">Riunione</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Titolo *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inizio *</Label>
                <Input type="datetime-local" value={formData.startAt} onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Fine</Label>
                <Input type="datetime-local" value={formData.endAt} onChange={(e) => setFormData({ ...formData, endAt: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Luogo</Label>
              <Input
                value={formData.locationString}
                onChange={(e) => setFormData({ ...formData, locationString: e.target.value })}
                placeholder="Es. Sala prove, Teatro comunale..."
              />
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateEvent} disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? "Creazione..." : "Crea Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Evento</DialogTitle>
            <DialogDescription>Aggiorna i dettagli dell'evento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rehearsal">Prova</SelectItem>
                    <SelectItem value="concert">Concerto</SelectItem>
                    <SelectItem value="meeting">Riunione</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Titolo *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inizio *</Label>
                <Input type="datetime-local" value={formData.startAt} onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Fine</Label>
                <Input type="datetime-local" value={formData.endAt} onChange={(e) => setFormData({ ...formData, endAt: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Luogo</Label>
              <Input
                value={formData.locationString}
                onChange={(e) => setFormData({ ...formData, locationString: e.target.value })}
                placeholder="Es. Sala prove, Teatro comunale..."
              />
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateEvent} disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RSVP List Dialog */}
      <Dialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lista Partecipanti</DialogTitle>
            <DialogDescription>Risposte dei coristi per {selectedEvent?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {rsvpList.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nessuna risposta ancora</p>
            ) : (
              rsvpList.map((rsvp) => (
                <div key={rsvp.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Utente #{rsvp.userId}</p>
                    {rsvp.motivation && <p className="text-sm text-muted-foreground">{rsvp.motivation}</p>}
                  </div>
                  {getRsvpStatusBadge(rsvp.status)}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
