import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2, Calendar, Euro } from "lucide-react";

export default function SuperadminOrganizations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    billingEmail: "",
    phone: "",
    fiscalCode: "",
    vatNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "IT",
    plan: "monthly" as "monthly" | "annual",
    priceMonthly: 0,
    priceAnnual: 0,
  });

  const { data: organizations, isLoading, refetch } = trpc.superadmin.listOrganizations.useQuery();
  const createOrgMutation = trpc.superadmin.createOrganization.useMutation({
    onSuccess: () => {
      alert("Organizzazione creata con successo!");
      setIsCreateDialogOpen(false);
      refetch();
      // Reset form
      setFormData({
        slug: "",
        name: "",
        billingEmail: "",
        phone: "",
        fiscalCode: "",
        vatNumber: "",
        address: "",
        city: "",
        postalCode: "",
        country: "IT",
        plan: "monthly",
        priceMonthly: 0,
        priceAnnual: 0,
      });
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrgMutation.mutate({
      ...formData,
      priceMonthly: Math.round(formData.priceMonthly * 100), // Convert to cents
      priceAnnual: formData.plan === "annual" ? Math.round(formData.priceAnnual * 100) : undefined,
      startDate: new Date(),
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Nessuna sottoscrizione</Badge>;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      suspended: "secondary",
      expired: "destructive",
      cancelled: "outline",
    };
    
    const labels: Record<string, string> = {
      active: "Attiva",
      suspended: "Sospesa",
      expired: "Scaduta",
      cancelled: "Cancellata",
    };

    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "€0.00";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("it-IT");
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Organizzazioni</h1>
          <p className="text-muted-foreground mt-2">
            {organizations?.length || 0} organizzazioni totali
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Organizzazione
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Crea Nuova Organizzazione</DialogTitle>
                <DialogDescription>
                  Inserisci i dati dell'organizzazione e configura la sottoscrizione SaaS
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Informazioni Base</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="coro-demo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Coro Polifonico Demo"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Contatti</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingEmail">Email Fatturazione</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={formData.billingEmail}
                        onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                        placeholder="fatture@coro.it"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+39 123 456 7890"
                      />
                    </div>
                  </div>
                </div>

                {/* Fiscal Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Dati Fiscali</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                      <Input
                        id="fiscalCode"
                        value={formData.fiscalCode}
                        onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })}
                        placeholder="12345678901"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">Partita IVA</Label>
                      <Input
                        id="vatNumber"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                        placeholder="IT12345678901"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-medium">Indirizzo</h3>
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Via Roma, 123"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Città</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Milano"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">CAP</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="20100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Paese</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="IT"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription */}
                <div className="space-y-4">
                  <h3 className="font-medium">Sottoscrizione SaaS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan">Piano *</Label>
                      <Select
                        value={formData.plan}
                        onValueChange={(value: "monthly" | "annual") =>
                          setFormData({ ...formData, plan: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensile</SelectItem>
                          <SelectItem value="annual">Annuale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priceMonthly">Prezzo Mensile (€) *</Label>
                      <Input
                        id="priceMonthly"
                        type="number"
                        step="0.01"
                        value={formData.priceMonthly}
                        onChange={(e) =>
                          setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="29.00"
                        required
                      />
                    </div>
                  </div>
                  {formData.plan === "annual" && (
                    <div className="space-y-2">
                      <Label htmlFor="priceAnnual">Prezzo Annuale (€)</Label>
                      <Input
                        id="priceAnnual"
                        type="number"
                        step="0.01"
                        value={formData.priceAnnual}
                        onChange={(e) =>
                          setFormData({ ...formData, priceAnnual: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="290.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createOrgMutation.isPending}>
                  {createOrgMutation.isPending ? "Creazione..." : "Crea Organizzazione"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations List */}
      <div className="space-y-4">
        {organizations?.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle>{org.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">/{org.slug}</p>
                  </div>
                </div>
                {getStatusBadge(org.subscriptionStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Piano</p>
                  <p className="font-medium">
                    {org.subscriptionPlan === "monthly" ? "Mensile" : org.subscriptionPlan === "annual" ? "Annuale" : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prezzo</p>
                  <p className="font-medium flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {formatCurrency(org.priceMonthly)}/mese
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prossimo Rinnovo</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(org.subscriptionNextBillingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Creazione</p>
                  <p className="font-medium">{formatDate(org.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {organizations?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nessuna organizzazione presente. Crea la prima organizzazione per iniziare.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
