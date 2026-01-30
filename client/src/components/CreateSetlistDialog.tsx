import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CreateSetlistDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSetlistDialog({ open, onClose, onSuccess }: CreateSetlistDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [eventId, setEventId] = useState<string>("");

  // Fetch upcoming events for selection
  const { data: events } = trpc.events.list.useQuery({
    startDate: new Date(),
    limit: 50,
  });

  const createMutation = trpc.setlists.create.useMutation({
    onSuccess: () => {
      toast.success("Scaletta creata con successo");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setEventId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Il titolo è obbligatorio");
      return;
    }

    createMutation.mutate({
      title,
      notes: notes || undefined,
      eventId: eventId ? parseInt(eventId) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuova Scaletta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              Titolo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es: Concerto di Natale 2026"
              required
            />
          </div>

          {/* Event Selection */}
          <div>
            <Label htmlFor="eventId">Evento Associato (opzionale)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un evento..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessun evento</SelectItem>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title} -{" "}
                    {new Date(event.startAt).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Associa questa scaletta a un evento specifico del calendario
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note per il direttore o i coristi..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creazione..." : "Crea Scaletta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
