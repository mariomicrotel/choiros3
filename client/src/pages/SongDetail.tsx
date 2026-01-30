import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  FileText,
  Music2,
  Youtube,
  Clock,
  TrendingUp,
  User,
  Languages,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { EditSongDialog } from "@/components/EditSongDialog";
import { UploadAssetDialog } from "@/components/UploadAssetDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SongDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/t/:slug/songs/:id");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  const songId = parseInt(params?.id || "0");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);

  const { data: song, isLoading, refetch } = trpc.songs.get.useQuery({ songId });

  const deleteMutation = trpc.songs.delete.useMutation({
    onSuccess: () => {
      toast.success("Brano eliminato con successo");
      setLocation(`/t/${slug}/songs`);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const deleteAssetMutation = trpc.songs.deleteAsset.useMutation({
    onSuccess: () => {
      toast.success("Asset eliminato con successo");
      refetch();
      setDeleteAssetId(null);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

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

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "score_pdf":
        return <FileText className="w-5 h-5" />;
      case "reference_audio":
      case "section_stem":
        return <Music2 className="w-5 h-5" />;
      case "youtube_link":
        return <Youtube className="w-5 h-5" />;
      case "lyrics":
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case "score_pdf":
        return "Spartito PDF";
      case "reference_audio":
        return "Audio Riferimento";
      case "section_stem":
        return "Traccia Sezione";
      case "youtube_link":
        return "Link YouTube";
      case "lyrics":
        return "Testo";
      default:
        return type;
    }
  };

  const getVoiceSectionLabel = (section?: string | null) => {
    if (!section) return null;
    const labels: Record<string, string> = {
      soprano: "Soprano",
      mezzo_soprano: "Mezzo-soprano",
      alto: "Alto",
      tenor: "Tenore",
      baritone: "Baritono",
      bass: "Basso",
      all: "Tutte le voci",
    };
    return labels[section] || section;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <Card className="p-6">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </Card>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-12 text-center">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brano non trovato</h3>
          <p className="text-gray-600 mb-6">Il brano richiesto non esiste o è stato eliminato</p>
          <Link href={`/t/${slug}/songs`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla lista
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/t/${slug}/songs`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla lista
          </Button>
        </Link>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifica
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </Button>
          </div>
        )}
      </div>

      {/* Song Info Card */}
      <Card className="p-8 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-4 bg-primary/10 rounded-lg">
            <Music className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{song.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
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
                  <Music2 className="w-3 h-3 mr-1" />
                  {song.key}
                </Badge>
              )}
              {song.tempoBpm && (
                <Badge variant="outline">
                  <Gauge className="w-3 h-3 mr-1" />
                  {song.tempoBpm} BPM
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
          {song.composer && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Compositore</p>
                <p className="text-base text-gray-900">{song.composer}</p>
              </div>
            </div>
          )}
          {song.arranger && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Arrangiatore</p>
                <p className="text-base text-gray-900">{song.arranger}</p>
              </div>
            </div>
          )}
          {song.language && (
            <div className="flex items-start gap-3">
              <Languages className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Lingua</p>
                <p className="text-base text-gray-900">{song.language}</p>
              </div>
            </div>
          )}
        </div>

        {/* Categories and Tags */}
        {song.categories && song.categories.length > 0 && (
          <div className="pt-6 border-t mt-6">
            <p className="text-sm font-medium text-gray-500 mb-3">Categorie</p>
            <div className="flex flex-wrap gap-2">
              {song.categories.map((cat, idx) => (
                <Badge key={idx} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {song.tags && song.tags.length > 0 && (
          <div className="pt-6 border-t mt-6">
            <p className="text-sm font-medium text-gray-500 mb-3">Tag</p>
            <div className="flex flex-wrap gap-2">
              {song.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Assets Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Materiali</h2>
          {canManage && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Carica File
            </Button>
          )}
        </div>

        {song.assets && song.assets.length > 0 ? (
          <div className="space-y-3">
            {song.assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-primary/10 rounded">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{getAssetTypeLabel(asset.type)}</p>
                      {asset.voiceSection && asset.voiceSection !== "all" && (
                        <Badge variant="outline" className="text-xs">
                          {getVoiceSectionLabel(asset.voiceSection)}
                        </Badge>
                      )}
                    </div>
                    {asset.fileSize && (
                      <p className="text-sm text-gray-500">
                        {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(asset.url, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {asset.type === "youtube_link" ? "Apri" : "Scarica"}
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteAssetId(asset.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Nessun materiale caricato</p>
            {canManage && (
              <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                <Download className="w-4 h-4 mr-2" />
                Carica Primo File
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditSongDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            refetch();
            setShowEditDialog(false);
          }}
          song={song}
        />
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <UploadAssetDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSuccess={() => {
            refetch();
            setShowUploadDialog(false);
          }}
          songId={songId}
        />
      )}

      {/* Delete Song Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il brano "{song.title}"? Questa azione non può essere annullata.
              Tutti i materiali associati verranno eliminati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ songId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Asset Confirmation */}
      <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione materiale</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo materiale? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteAssetId) {
                  deleteAssetMutation.mutate({ assetId: deleteAssetId, songId });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
