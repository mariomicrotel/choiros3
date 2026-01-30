import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditSongDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  song: {
    id: number;
    title: string;
    composer?: string | null;
    arranger?: string | null;
    language?: string | null;
    durationSeconds?: number | null;
    difficulty?: number | null;
    tempoBpm?: number | null;
    key?: string | null;
  };
}

export function EditSongDialog({ open, onClose, onSuccess, song }: EditSongDialogProps) {
  const [formData, setFormData] = useState({
    title: song.title,
    composer: song.composer || "",
    arranger: song.arranger || "",
    language: song.language || "",
    durationSeconds: song.durationSeconds?.toString() || "",
    difficulty: song.difficulty?.toString() || "",
    tempoBpm: song.tempoBpm?.toString() || "",
    key: song.key || "",
  });

  useEffect(() => {
    setFormData({
      title: song.title,
      composer: song.composer || "",
      arranger: song.arranger || "",
      language: song.language || "",
      durationSeconds: song.durationSeconds?.toString() || "",
      difficulty: song.difficulty?.toString() || "",
      tempoBpm: song.tempoBpm?.toString() || "",
      key: song.key || "",
    });
  }, [song]);

  const updateMutation = trpc.songs.update.useMutation({
    onSuccess: () => {
      toast.success("Brano aggiornato con successo");
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

    updateMutation.mutate({
      songId: song.id,
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
          <DialogTitle>Modifica Brano</DialogTitle>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
