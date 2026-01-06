import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Search, UserPlus, Edit, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminMembers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");

  const utils = trpc.useUtils();

  // Fetch members
  const { data: members = [], isLoading } = trpc.users.list.useQuery({
    role: filterRole !== "all" ? filterRole : undefined,
    voiceSection: filterSection !== "all" ? filterSection : undefined,
    limit: 100,
  });

  // Update member mutation
  const updateMemberMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Membro aggiornato con successo!");
      utils.users.list.invalidate();
      setEditDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error) => {
      toast.error("Errore durante l'aggiornamento: " + error.message);
    },
  });

  // Change role mutation
  const changeRoleMutation = trpc.users.changeRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo aggiornato con successo!");
      utils.users.list.invalidate();
      setRoleDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error) => {
      toast.error("Errore durante il cambio ruolo: " + error.message);
    },
  });

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchQuery === "" ||
      (member.phone && member.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.city && member.city.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const handleChangeRole = (member: any) => {
    setSelectedMember(member);
    setNewRole("");
    setRoleDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMember) return;

    updateMemberMutation.mutate({
      userId: selectedMember.userId,
      phone: selectedMember.phone,
      address: selectedMember.address,
      city: selectedMember.city,
      postalCode: selectedMember.postalCode,
      country: selectedMember.country,
      voiceSection: selectedMember.voiceSection,
    });
  };

  const handleSaveRole = () => {
    if (!selectedMember || !newRole) return;

    changeRoleMutation.mutate({
      userId: selectedMember.userId,
      newRole: newRole as any,
    });
  };

  const getRoleBadge = (status: string) => {
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

  const getVoiceSectionLabel = (section: string | null) => {
    if (!section) return "-";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Membri</h1>
          <p className="text-muted-foreground mt-2">Anagrafica completa dei coristi</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuovo Membro
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per telefono, città..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger>
                <SelectValue placeholder="Sezione vocale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le sezioni</SelectItem>
                <SelectItem value="soprano">Soprano</SelectItem>
                <SelectItem value="mezzo_soprano">Mezzosoprano</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="tenor">Tenore</SelectItem>
                <SelectItem value="baritone">Baritono</SelectItem>
                <SelectItem value="bass">Basso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="suspended">Sospesi</SelectItem>
                <SelectItem value="exited">Usciti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membri ({filteredMembers.length})</CardTitle>
          <CardDescription>Lista completa dei coristi registrati</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nessun membro trovato</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Sezione</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.userId}</TableCell>
                    <TableCell>{getVoiceSectionLabel(member.voiceSection)}</TableCell>
                    <TableCell>{member.phone || "-"}</TableCell>
                    <TableCell>{member.city || "-"}</TableCell>
                    <TableCell>{getRoleBadge(member.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditMember(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleChangeRole(member)}>
                        <Shield className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Membro</DialogTitle>
            <DialogDescription>Aggiorna i dati del corista</DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input
                  value={selectedMember.phone || ""}
                  onChange={(e) => setSelectedMember({ ...selectedMember, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Indirizzo</Label>
                <Input
                  value={selectedMember.address || ""}
                  onChange={(e) => setSelectedMember({ ...selectedMember, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input
                    value={selectedMember.city || ""}
                    onChange={(e) => setSelectedMember({ ...selectedMember, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input
                    value={selectedMember.postalCode || ""}
                    onChange={(e) => setSelectedMember({ ...selectedMember, postalCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sezione Vocale</Label>
                <Select
                  value={selectedMember.voiceSection || ""}
                  onValueChange={(value) => setSelectedMember({ ...selectedMember, voiceSection: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona sezione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soprano">Soprano</SelectItem>
                    <SelectItem value="mezzo_soprano">Mezzosoprano</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="tenor">Tenore</SelectItem>
                    <SelectItem value="baritone">Baritono</SelectItem>
                    <SelectItem value="bass">Basso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMemberMutation.isPending}>
              {updateMemberMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Ruolo</DialogTitle>
            <DialogDescription>Assegna un nuovo ruolo al membro</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nuovo Ruolo</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="director">Direttore</SelectItem>
                  <SelectItem value="secretary">Segretario</SelectItem>
                  <SelectItem value="capo_section">Capo Sezione</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="guest">Ospite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveRole} disabled={changeRoleMutation.isPending || !newRole}>
              {changeRoleMutation.isPending ? "Salvataggio..." : "Cambia Ruolo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
