import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ListMusic,
  Plus,
  Search,
  Calendar,
  Music,
  ChevronRight,
} from "lucide-react";
import { CreateSetlistDialog } from "@/components/CreateSetlistDialog";

export default function Setlists() {
  const { user } = useAuth();
  const [, params] = useRoute("/t/:slug/setlists");
  const slug = params?.slug || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: setlists, isLoading, refetch } = trpc.setlists.list.useQuery();

  const canManage = user?.role === "admin" || user?.role === "director";

  const filteredSetlists = setlists?.filter((setlist) =>
    setlist.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <ListMusic className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scalette</h1>
            <p className="text-gray-600">Gestisci le scalette dei brani per gli eventi</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuova Scaletta
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Cerca scalette..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Setlists List */}
      {filteredSetlists && filteredSetlists.length > 0 ? (
        <div className="space-y-4">
          {filteredSetlists.map((setlist) => (
            <Link key={setlist.id} href={`/t/${slug}/setlists/${setlist.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {setlist.title}
                      </h3>
                      {setlist.event && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(setlist.event.startAt).toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Badge>
                      )}
                    </div>

                    {setlist.event && (
                      <p className="text-sm text-gray-600 mb-2">
                        Evento: <span className="font-medium">{setlist.event.title}</span>
                      </p>
                    )}

                    {setlist.notes && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {setlist.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        <span>{setlist._count?.items || 0} brani</span>
                      </div>
                      <div>
                        Creata il{" "}
                        {new Date(setlist.createdAt).toLocaleDateString("it-IT")}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ListMusic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? "Nessuna scaletta trovata" : "Nessuna scaletta creata"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? "Prova a modificare i criteri di ricerca"
              : "Crea la prima scaletta per organizzare i brani degli eventi"}
          </p>
          {canManage && !searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crea Prima Scaletta
            </Button>
          )}
        </Card>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateSetlistDialog
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
