import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreateSongDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSongDialog({ open, onClose, onSuccess }: CreateSongDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    composer: "",
    arranger: "",
    language: "",
    durationSeconds: "",
    difficulty: "",
    tempoBpm: "",
    key: "",
  });

  const createMutation = trpc.songs.create.useMutation({
    onSuccess: () => {
      toast.success("Brano creato con successo");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Il titolo è obbligatorio");
      return;
    }

    createMutation.mutate({
      title: formData.title,
      composer: formData.composer || undefined,
      arranger: formData.arranger || undefined,
      language: formData.language || undefined,
      durationSeconds: formData.durationSeconds ? parseInt(formData.durationSeconds) : undefined,
      difficulty: formData.difficulty ? parseInt(formData.difficulty) : undefined,
      tempoBpm: formData.tempoBpm ? parseInt(formData.tempoBpm) : undefined,
      key: formData.key || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Brano</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titolo */}
          <div>
            <Label htmlFor="title">
              Titolo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Es: Ave Maria"
              required
            />
          </div>

          {/* Compositore e Arrangiatore */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="composer">Compositore</Label>
              <Input
                id="composer"
                value={formData.composer}
                onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                placeholder="Es: Franz Schubert"
              />
            </div>
            <div>
              <Label htmlFor="arranger">Arrangiatore</Label>
              <Input
                id="arranger"
                value={formData.arranger}
                onChange={(e) => setFormData({ ...formData, arranger: e.target.value })}
                placeholder="Es: John Rutter"
              />
            </div>
          </div>

          {/* Lingua e Tonalità */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Lingua</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="Es: Latino, Italiano"
              />
            </div>
            <div>
              <Label htmlFor="key">Tonalità</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="Es: Do maggiore, La minore"
              />
            </div>
          </div>

          {/* Durata, Difficoltà, Tempo */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="durationSeconds">Durata (secondi)</Label>
              <Input
                id="durationSeconds"
                type="number"
                value={formData.durationSeconds}
                onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                placeholder="Es: 240"
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficoltà (1-5)</Label>
              <Input
                id="difficulty"
                type="number"
                min="1"
                max="5"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                placeholder="1-5"
              />
            </div>
            <div>
              <Label htmlFor="tempoBpm">Tempo (BPM)</Label>
              <Input
                id="tempoBpm"
                type="number"
                value={formData.tempoBpm}
                onChange={(e) => setFormData({ ...formData, tempoBpm: e.target.value })}
                placeholder="Es: 120"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creazione..." : "Crea Brano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
