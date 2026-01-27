import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditOrganizationDialogProps {
  organization: {
    id: number;
    name: string;
    billingEmail: string | null;
    phone: string | null;
    fiscalCode: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditOrganizationDialog({
  organization,
  open,
  onOpenChange,
  onSuccess,
}: EditOrganizationDialogProps) {
  const [formData, setFormData] = useState({
    name: organization.name,
    billingEmail: organization.billingEmail || "",
    phone: organization.phone || "",
    fiscalCode: organization.fiscalCode || "",
    vatNumber: organization.vatNumber || "",
    address: organization.address || "",
    city: organization.city || "",
    postalCode: organization.postalCode || "",
    country: organization.country || "IT",
  });

  // Update form when organization changes
  useEffect(() => {
    setFormData({
      name: organization.name,
      billingEmail: organization.billingEmail || "",
      phone: organization.phone || "",
      fiscalCode: organization.fiscalCode || "",
      vatNumber: organization.vatNumber || "",
      address: organization.address || "",
      city: organization.city || "",
      postalCode: organization.postalCode || "",
      country: organization.country || "IT",
    });
  }, [organization]);

  const updateOrgMutation = trpc.superadmin.updateOrganization.useMutation({
    onSuccess: () => {
      alert("Organizzazione aggiornata con successo!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate({
      orgId: organization.id,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Organizzazione</DialogTitle>
          <DialogDescription>
            Aggiorna i dati fiscali e i contatti dell'organizzazione
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dati Base */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Dati Base</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Organizzazione *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contatti */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contatti</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-billingEmail">Email Fatturazione</Label>
                <Input
                  id="edit-billingEmail"
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                  placeholder="fatture@esempio.it"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>
          </div>

          {/* Dati Fiscali */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Dati Fiscali</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-fiscalCode">Codice Fiscale</Label>
                <Input
                  id="edit-fiscalCode"
                  value={formData.fiscalCode}
                  onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value.toUpperCase() })}
                  placeholder="RSSMRA80A01H501U"
                  maxLength={16}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vatNumber">Partita IVA</Label>
                <Input
                  id="edit-vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  placeholder="12345678901"
                  maxLength={11}
                />
              </div>
            </div>
          </div>

          {/* Indirizzo */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Indirizzo</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address">Indirizzo</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Via Roma, 123"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Città</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Milano"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-postalCode">CAP</Label>
                  <Input
                    id="edit-postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="20100"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-country">Paese</Label>
                  <Input
                    id="edit-country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                    placeholder="IT"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateOrgMutation.isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={updateOrgMutation.isPending}>
              {updateOrgMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
