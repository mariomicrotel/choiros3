import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Music } from "lucide-react";
import { toast } from "sonner";

interface AddSongsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setlistId: number;
}

export function AddSongsDialog({ open, onClose, onSuccess, setlistId }: AddSongsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(new Set());

  const { data: songs, isLoading } = trpc.songs.list.useQuery({
    search: searchQuery || undefined,
  });

  const addSongsMutation = trpc.setlists.addSong.useMutation({
    onSuccess: () => {
      toast.success("Brani aggiunti alla scaletta");
      onSuccess();
      setSelectedSongIds(new Set());
      setSearchQuery("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const toggleSong = (songId: number) => {
    const newSelected = new Set(selectedSongIds);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongIds(newSelected);
  };

  const handleAddSongs = () => {
    if (selectedSongIds.size === 0) {
      toast.error("Seleziona almeno un brano");
      return;
    }

    // Add songs sequentially
    const songIds = Array.from(selectedSongIds);
    let completed = 0;

    songIds.forEach((songId, index) => {
      addSongsMutation.mutate(
        { setlistId, songId, order: index + 1 },
        {
          onSuccess: () => {
            completed++;
            if (completed === songIds.length) {
              onSuccess();
              setSelectedSongIds(new Set());
              setSearchQuery("");
            }
          },
        }
      );
    });
  };

  const getDifficultyLabel = (difficulty?: number | null) => {
    if (!difficulty) return null;
    if (difficulty <= 2) return "Facile";
    if (difficulty <= 4) return "Medio";
    return "Difficile";
  };

  const getDifficultyColor = (difficulty?: number | null) => {
    if (!difficulty) return "bg-gray-100 text-gray-800";
    if (difficulty <= 2) return "bg-green-100 text-green-800";
    if (difficulty <= 4) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Aggiungi Brani alla Scaletta</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Cerca brani per titolo, compositore, arrangiatore..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Caricamento brani...</div>
          ) : songs && songs.length > 0 ? (
            <div className="divide-y">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                  onClick={() => toggleSong(song.id)}
                >
                  <Checkbox
                    checked={selectedSongIds.has(song.id)}
                    onCheckedChange={() => toggleSong(song.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{song.title}</h4>
                      {song.difficulty && (
                        <Badge className={getDifficultyColor(song.difficulty)}>
                          {getDifficultyLabel(song.difficulty)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {song.composer && <span>{song.composer}</span>}
                      {song.arranger && <span className="text-gray-400">arr. {song.arranger}</span>}
                      {song.durationSeconds && (
                        <span>
                          {Math.floor(song.durationSeconds / 60)}:
                          {String(song.durationSeconds % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchQuery ? "Nessun brano trovato" : "Nessun brano disponibile"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedSongIds.size > 0 && (
              <span>
                {selectedSongIds.size} {selectedSongIds.size === 1 ? "brano selezionato" : "brani selezionati"}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button
              onClick={handleAddSongs}
              disabled={selectedSongIds.size === 0 || addSongsMutation.isPending}
            >
              {addSongsMutation.isPending ? "Aggiunta..." : "Aggiungi Selezionati"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
