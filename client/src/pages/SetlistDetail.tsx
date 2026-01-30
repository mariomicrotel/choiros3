import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ListMusic,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Calendar,
  Clock,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { AddSongsDialog } from "@/components/AddSongsDialog";

interface SortableItemProps {
  id: number;
  song: {
    id: number;
    title: string;
    composer?: string | null;
    arranger?: string | null;
    durationSeconds?: number | null;
  };
  order: number;
  onRemove: () => void;
  canManage: boolean;
}

function SortableItem({ id, song, order, onRemove, canManage }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-white border rounded-lg">
      {canManage && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full flex-shrink-0">
        <span className="text-sm font-semibold text-primary">{order}</span>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/t/${window.location.pathname.split("/")[2]}/songs/${song.id}`}>
          <h4 className="font-medium text-gray-900 hover:text-primary transition-colors cursor-pointer">
            {song.title}
          </h4>
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
          {song.composer && <span>{song.composer}</span>}
          {song.arranger && <span className="text-gray-400">arr. {song.arranger}</span>}
          {song.durationSeconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(song.durationSeconds / 60)}:{String(song.durationSeconds % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
      {canManage && (
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      )}
    </div>
  );
}

export default function SetlistDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/t/:slug/setlists/:id");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  const setlistId = parseInt(params?.id || "0");

  const [showAddSongsDialog, setShowAddSongsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [removeSongId, setRemoveSongId] = useState<number | null>(null);

  const { data: setlist, isLoading, refetch } = trpc.setlists.get.useQuery({ setlistId });

  const deleteMutation = trpc.setlists.delete.useMutation({
    onSuccess: () => {
      toast.success("Scaletta eliminata con successo");
      setLocation(`/t/${slug}/setlists`);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const removeSongMutation = trpc.setlists.removeSong.useMutation({
    onSuccess: () => {
      toast.success("Brano rimosso dalla scaletta");
      refetch();
      setRemoveSongId(null);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const reorderMutation = trpc.setlists.reorderItems.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
      refetch(); // Revert on error
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const canManage = user?.role === "admin" || user?.role === "director";

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !setlist?.items) {
      return;
    }

    const oldIndex = setlist.items.findIndex((item) => item.id === active.id);
    const newIndex = setlist.items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(setlist.items, oldIndex, newIndex);
    const itemOrders = newItems.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));

    reorderMutation.mutate({ setlistId, itemOrders });
  };

  const getTotalDuration = () => {
    if (!setlist?.items) return 0;
    return setlist.items.reduce((total, item) => {
      return total + (item.song.durationSeconds || 0);
    }, 0);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  if (!setlist) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-12 text-center">
          <ListMusic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Scaletta non trovata</h3>
          <p className="text-gray-600 mb-6">La scaletta richiesta non esiste o è stata eliminata</p>
          <Link href={`/t/${slug}/setlists`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla lista
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const totalDuration = getTotalDuration();

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/t/${slug}/setlists`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla lista
          </Button>
        </Link>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </Button>
          </div>
        )}
      </div>

      {/* Setlist Info Card */}
      <Card className="p-8 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-4 bg-primary/10 rounded-lg">
            <ListMusic className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{setlist.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {setlist.event && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {setlist.event.title} -{" "}
                  {new Date(setlist.event.startAt).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                {setlist.items?.length || 0} brani
              </Badge>
              {totalDuration > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Durata totale: {formatDuration(totalDuration)}
                </Badge>
              )}
            </div>
            {setlist.notes && (
              <p className="text-gray-600 mt-4 whitespace-pre-wrap">{setlist.notes}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Songs List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Brani</h2>
          {canManage && (
            <Button onClick={() => setShowAddSongsDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Brani
            </Button>
          )}
        </div>

        {setlist.items && setlist.items.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={setlist.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {setlist.items.map((item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    song={item.song}
                    order={item.order}
                    onRemove={() => setRemoveSongId(item.id)}
                    canManage={canManage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Nessun brano nella scaletta</p>
            {canManage && (
              <Button variant="outline" onClick={() => setShowAddSongsDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Primo Brano
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Add Songs Dialog */}
      {showAddSongsDialog && (
        <AddSongsDialog
          open={showAddSongsDialog}
          onClose={() => setShowAddSongsDialog(false)}
          onSuccess={() => {
            refetch();
            setShowAddSongsDialog(false);
          }}
          setlistId={setlistId}
        />
      )}

      {/* Delete Setlist Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la scaletta "{setlist.title}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ setlistId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Song Confirmation */}
      <AlertDialog open={!!removeSongId} onOpenChange={() => setRemoveSongId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma rimozione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere questo brano dalla scaletta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeSongId) {
                  removeSongMutation.mutate({ itemId: removeSongId });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
