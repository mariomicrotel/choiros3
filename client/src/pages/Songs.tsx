import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Music, Search, Plus, Clock, TrendingUp, FileText } from "lucide-react";
import { CreateSongDialog } from "@/components/CreateSongDialog";

export default function Songs() {
  const { user } = useAuth();
  const [, params] = useRoute("/t/:slug/songs");
  const slug = params?.slug || "";

  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: songs, isLoading, refetch } = trpc.songs.list.useQuery({
    search: search || undefined,
    limit: 100,
  });

  // Director, admin possono gestire brani
  const canManage = user?.role === "admin" || user?.role === "director";

  const getDifficultyLabel = (difficulty?: number | null) => {
    if (!difficulty) return "N/D";
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
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Music className="w-8 h-8 text-primary" />
            Repository Brani
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci il repertorio musicale del coro
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Nuovo Brano
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cerca per titolo, compositore o arrangiatore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Songs List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : songs && songs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map((song) => (
            <Link key={song.id} href={`/t/${slug}/songs/${song.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {song.title}
                    </h3>
                    {song.composer && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Compositore:</span> {song.composer}
                      </p>
                    )}
                    {song.arranger && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Arrangiatore:</span> {song.arranger}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {song.difficulty && (
                    <Badge className={getDifficultyColor(song.difficulty)}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {getDifficultyLabel(song.difficulty)}
                    </Badge>
                  )}
                  {song.durationSeconds && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(song.durationSeconds / 60)}:{String(song.durationSeconds % 60).padStart(2, "0")}
                    </Badge>
                  )}
                  {song.key && (
                    <Badge variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      {song.key}
                    </Badge>
                  )}
                </div>

                {song.categories && song.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {song.categories.map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nessun brano trovato
          </h3>
          <p className="text-gray-600 mb-6">
            {search
              ? "Prova a modificare i criteri di ricerca"
              : "Inizia aggiungendo il primo brano al repertorio"}
          </p>
          {canManage && !search && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Aggiungi Primo Brano
            </Button>
          )}
        </Card>
      )}

      {/* Create Song Dialog */}
      {showCreateDialog && (
        <CreateSongDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            refetch();
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}
