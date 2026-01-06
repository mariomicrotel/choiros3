import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserCheck, UserX, Users, ClipboardList, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ProfileSegretario() {
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [motivation, setMotivation] = useState("");

  const utils = trpc.useUtils();

  // Fetch pending registrations
  const { data: pendingRegistrations = [] } = trpc.registrations.list.useQuery();

  // Fetch all members
  const { data: members = [] } = trpc.users.list.useQuery({});

  // Approve registration mutation
  const approveMutation = trpc.registrations.approve.useMutation({
    onSuccess: () => {
      toast.success("Iscrizione approvata con successo!");
      utils.registrations.list.invalidate();
      setShowApproveDialog(false);
      setSelectedRegistration(null);
    },
    onError: (error) => {
      toast.error("Errore durante l'approvazione: " + error.message);
    },
  });

  // Reject registration mutation
  const rejectMutation = trpc.registrations.reject.useMutation({
    onSuccess: () => {
      toast.success("Iscrizione rifiutata");
      utils.registrations.list.invalidate();
      setShowRejectDialog(false);
      setSelectedRegistration(null);
      setMotivation("");
    },
    onError: (error) => {
      toast.error("Errore durante il rifiuto: " + error.message);
    },
  });

  const handleApprove = (registration: any) => {
    setSelectedRegistration(registration);
    setShowApproveDialog(true);
  };

  const handleReject = (registration: any) => {
    setSelectedRegistration(registration);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (!selectedRegistration) return;
    approveMutation.mutate({ registrationId: selectedRegistration.id });
  };

  const confirmReject = () => {
    if (!selectedRegistration) return;
    rejectMutation.mutate({
      registrationId: selectedRegistration.id,
      reason: motivation || "Non specificato",
    });
  };

  const getVoiceSectionLabel = (section: string | null) => {
    if (!section) return "Non assegnata";
    const labels: Record<string, string> = {
      soprano: "Soprano",
      mezzo_soprano: "Mezzosoprano",
      alto: "Alto",
      tenor: "Tenore",
      baritone: "Baritono",
      bass: "Basso",
    };
    return labels[section] || section;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Attivo</Badge>;
      case "suspended":
        return <Badge variant="secondary">Sospeso</Badge>;
      case "exited":
        return <Badge variant="destructive">Uscito</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeMembers = members.filter((m) => m.status === "active").length;
  const suspendedMembers = members.filter((m) => m.status === "suspended").length;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profilo Segretario</h1>
          <p className="text-muted-foreground mt-2">
            Gestione iscrizioni e anagrafica membri
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <ClipboardList className="h-5 w-5 mr-2" />
          Segretario
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Iscrizioni Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {pendingRegistrations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membri Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membri Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membri Sospesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{suspendedMembers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registrations">Iscrizioni Pending</TabsTrigger>
          <TabsTrigger value="members">Tutti i Membri</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Richieste di Iscrizione
              </CardTitle>
              <CardDescription>
                {pendingRegistrations.length} richieste in attesa di approvazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRegistrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessuna richiesta di iscrizione pending
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingRegistrations.map((registration: any) => (
                    <div
                      key={registration.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {registration.fullName?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{registration.fullName}</p>
                              <p className="text-sm text-muted-foreground">{registration.email}</p>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Telefono:</span>
                          <p className="font-medium">{registration.phone || "Non fornito"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sezione Vocale:</span>
                          <p className="font-medium">
                            {getVoiceSectionLabel(registration.voiceSection)}
                          </p>
                        </div>
                      </div>

                      {registration.motivation && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Motivazione:</span>
                          <p className="mt-1 italic">{registration.motivation}</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Richiesta il{" "}
                        {format(new Date(registration.createdAt), "d MMMM yyyy 'alle' HH:mm", {
                          locale: it,
                        })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleApprove(registration)}
                          className="flex-1"
                          variant="default"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Approva
                        </Button>
                        <Button
                          onClick={() => handleReject(registration)}
                          className="flex-1"
                          variant="destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Rifiuta
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Anagrafica Completa
              </CardTitle>
              <CardDescription>{members.length} membri registrati</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun membro registrato</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {member.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <Badge variant="outline">
                            {getVoiceSectionLabel(member.voiceSection)}
                          </Badge>
                        </div>
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Approvazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler approvare l'iscrizione di{" "}
              <strong>{selectedRegistration?.fullName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              L'utente riceverà una notifica e potrà accedere al sistema come membro del coro.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Annulla
            </Button>
            <Button onClick={confirmApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "Approvazione..." : "Conferma Approvazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Iscrizione</DialogTitle>
            <DialogDescription>
              Stai per rifiutare l'iscrizione di{" "}
              <strong>{selectedRegistration?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivation">Motivazione (opzionale)</Label>
              <Textarea
                id="motivation"
                placeholder="Inserisci una motivazione per il rifiuto..."
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
