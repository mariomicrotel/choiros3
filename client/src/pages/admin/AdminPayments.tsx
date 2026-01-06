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
import { CreditCard, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

type PaymentStatus = "pending" | "completed" | "failed";
type PaymentType = "membership_fee" | "event_fee" | "donation";

export default function AdminPayments() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    userId: "",
    type: "membership_fee" as PaymentType,
    amountCents: "",
    currency: "EUR",
    description: "",
    dueAt: "",
  });

  const utils = trpc.useUtils();

  // Fetch payments
  const { data: payments = [], isLoading } = trpc.payments.list.useQuery({
    status: filterStatus !== "all" ? (filterStatus as any) : undefined,
    type: filterType !== "all" ? (filterType as any) : undefined,
    limit: 100,
  });

  // Create payment mutation
  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Pagamento creato con successo!");
      utils.payments.list.invalidate();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Errore durante la creazione: " + error.message);
    },
  });

  // Update payment status mutation
  const updateStatusMutation = trpc.payments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Stato aggiornato con successo!");
      utils.payments.list.invalidate();
    },
    onError: (error) => {
      toast.error("Errore durante l'aggiornamento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      userId: "",
      type: "membership_fee",
      amountCents: "",
      currency: "EUR",
      description: "",
      dueAt: "",
    });
  };

  const handleCreatePayment = () => {
    if (!formData.userId || !formData.amountCents) {
      toast.error("Compila i campi obbligatori");
      return;
    }

    createPaymentMutation.mutate({
      userId: parseInt(formData.userId),
      type: formData.type,
      amountCents: parseInt(formData.amountCents),
      currency: formData.currency,
      description: formData.description || undefined,
      dueAt: formData.dueAt ? new Date(formData.dueAt) : undefined,
    });
  };

  const handleUpdateStatus = (paymentId: number, status: PaymentStatus) => {
    if (confirm(`Confermi di voler impostare lo stato a "${status}"?`)) {
      updateStatusMutation.mutate({ paymentId, status });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completato
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            In Sospeso
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Fallito
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "membership_fee":
        return <Badge>Quota Associativa</Badge>;
      case "event_fee":
        return <Badge variant="secondary">Quota Evento</Badge>;
      case "donation":
        return <Badge variant="outline">Donazione</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Calculate statistics
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amountCents, 0) / 100;
  const totalCompleted = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amountCents, 0) / 100;
  const totalAmount = payments.reduce((sum, p) => sum + p.amountCents, 0) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Pagamenti</h1>
          <p className="text-muted-foreground mt-2">Quote associative e pagamenti</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Pagamento
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Incassato</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalCompleted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pagamenti completati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Sospeso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Da incassare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{payments.length} pagamenti</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pending">In Sospeso</SelectItem>
                <SelectItem value="completed">Completati</SelectItem>
                <SelectItem value="failed">Falliti</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="membership_fee">Quote Associative</SelectItem>
                <SelectItem value="event_fee">Quote Eventi</SelectItem>
                <SelectItem value="donation">Donazioni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamenti ({payments.length})</CardTitle>
          <CardDescription>Lista completa dei pagamenti registrati</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nessun pagamento trovato</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell>Utente #{payment.userId}</TableCell>
                    <TableCell>{getTypeBadge(payment.type)}</TableCell>
                    <TableCell className="font-semibold">
                      €{(payment.amountCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {payment.dueAt ? format(new Date(payment.dueAt), "d MMM yyyy", { locale: it }) : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      {payment.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(payment.id, "completed")}
                          >
                            Segna Pagato
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(payment.id, "failed")}
                          >
                            Segna Fallito
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Nuovo Pagamento</DialogTitle>
            <DialogDescription>Registra un nuovo pagamento per un corista</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID Utente *</Label>
              <Input
                type="number"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Es. 123"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as PaymentType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membership_fee">Quota Associativa</SelectItem>
                  <SelectItem value="event_fee">Quota Evento</SelectItem>
                  <SelectItem value="donation">Donazione</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Importo (centesimi) *</Label>
                <Input
                  type="number"
                  value={formData.amountCents}
                  onChange={(e) => setFormData({ ...formData, amountCents: e.target.value })}
                  placeholder="Es. 5000 per €50.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Valuta</Label>
                <Input value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Es. Quota annuale 2025"
              />
            </div>

            <div className="space-y-2">
              <Label>Scadenza</Label>
              <Input type="date" value={formData.dueAt} onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreatePayment} disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? "Creazione..." : "Crea Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
