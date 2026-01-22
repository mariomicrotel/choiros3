import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Music, 
  Calendar, 
  TrendingUp, 
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  CalendarCheck,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
// Storage upload will be handled via tRPC

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Fetch complete profile stats
  const { data: profileData, isLoading } = trpc.profile.stats.useQuery(
    undefined,
    { enabled: !!user?.user?.id }
  );

  // Fetch membership to get role
  const { data: membership } = trpc.tenant.membership.useQuery(
    undefined,
    { enabled: !!user?.user?.id }
  );

  const [formData, setFormData] = useState<{
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    voiceSection: "soprano" | "mezzo_soprano" | "alto" | "tenor" | "baritone" | "bass" | "";
  }>({
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Italia",
    voiceSection: "",
  });

  // Update form data when profile loads
  useState(() => {
    if (profileData?.profile) {
      setFormData({
        phone: profileData.profile.phone || "",
        address: profileData.profile.address || "",
        city: profileData.profile.city || "",
        postalCode: profileData.profile.postalCode || "",
        country: profileData.profile.country || "Italia",
        voiceSection: profileData.profile.voiceSection || "",
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Profilo aggiornato con successo!");
      utils.profile.stats.invalidate();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Errore durante l'aggiornamento: " + error.message);
    },
  });

  // Update photo mutation
  const updatePhotoMutation = trpc.profile.updatePhoto.useMutation({
    onSuccess: () => {
      toast.success("Foto profilo aggiornata!");
      utils.profile.stats.invalidate();
      setIsUploadingPhoto(false);
    },
    onError: (error) => {
      toast.error("Errore durante l'upload: " + error.message);
      setIsUploadingPhoto(false);
    },
  });

  const handleSave = () => {
    if (!user?.user?.id) return;

    updateProfileMutation.mutate({
      userId: user.user.id,
      ...formData,
      voiceSection: formData.voiceSection || undefined,
    } as any);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Il file è troppo grande. Dimensione massima: 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un'immagine valida (JPG, PNG, etc.)");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert file to base64 for demo
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // For now, use a placeholder URL
        // In production, implement proper S3 upload via tRPC
        updatePhotoMutation.mutate({ photoUrl: base64String });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante l'upload della foto");
      setIsUploadingPhoto(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      active: { variant: "default", icon: CheckCircle2 },
      suspended: { variant: "secondary", icon: Clock },
      exited: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status === "active" ? "Attivo" : status === "suspended" ? "Sospeso" : "Uscito"}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" }> = {
      completed: { variant: "default" },
      pending: { variant: "secondary" },
      failed: { variant: "destructive" },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant}>
        {status === "completed" ? "Completato" : status === "pending" ? "In Sospeso" : "Fallito"}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      membership_fee: "Quota Associativa",
      event_fee: "Quota Evento",
      donation: "Donazione",
    };

    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getVoiceSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      soprano: "Soprano",
      mezzo_soprano: "Mezzosoprano",
      alto: "Contralto",
      tenor: "Tenore",
      baritone: "Baritono",
      bass: "Basso",
    };
    return labels[section] || section;
  };

  if (isLoading || !profileData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  const { profile, attendance, payments, registration } = profileData;
  const userName = user?.user?.name || user?.user?.email || "Utente";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header con foto profilo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profilePhotoUrl || undefined} alt={userName} />
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Info utente */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{userName}</h1>
                {profile.status && getStatusBadge(profile.status)}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {user?.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.user.email}
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
                {profile.voiceSection && (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    {getVoiceSectionLabel(profile.voiceSection)}
                  </div>
                )}
                {membership?.role && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Ruolo: <Badge variant="secondary">{membership.role}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiche rapide */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{attendance.total}</div>
                <div className="text-xs text-muted-foreground">Presenze</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{attendance.rate.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Tasso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{payments.completed}</div>
                <div className="text-xs text-muted-foreground">Pagamenti</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs con dettagli */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="attendance">Partecipazione</TabsTrigger>
          <TabsTrigger value="payments">Pagamenti</TabsTrigger>
          <TabsTrigger value="history">Cronologia</TabsTrigger>
        </TabsList>

        {/* Tab Informazioni */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dati Anagrafici</CardTitle>
                  <CardDescription>Le tue informazioni personali</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Modifica</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                      Salva
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voiceSection">Sezione Vocale</Label>
                  <Select
                    value={formData.voiceSection}
                    onValueChange={(value) => setFormData({ ...formData, voiceSection: value as any })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona sezione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soprano">Soprano</SelectItem>
                      <SelectItem value="mezzo_soprano">Mezzosoprano</SelectItem>
                      <SelectItem value="alto">Contralto</SelectItem>
                      <SelectItem value="tenor">Tenore</SelectItem>
                      <SelectItem value="baritone">Baritono</SelectItem>
                      <SelectItem value="bass">Basso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Città</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">CAP</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Paese</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Partecipazione */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Presenze Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendance.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Su {attendance.totalEvents} eventi totali
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tasso Presenza</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{attendance.rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Media partecipazione</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Eventi Recenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendance.recent.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Ultimi check-in</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storico Presenze</CardTitle>
              <CardDescription>Le tue ultime partecipazioni agli eventi</CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.recent.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessuna presenza registrata
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.recent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.eventTitle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.eventType}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.eventStartAt
                            ? format(new Date(item.eventStartAt), "d MMM yyyy", { locale: it })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "present" ? "default" : "secondary"}>
                            {item.status === "present" ? "Presente" : "Assente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pagamenti */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Totale Pagato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  €{(payments.totalAmount / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.completed} pagamenti completati
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">In Sospeso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  €{(payments.pendingAmount / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.pending} pagamenti da completare
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pagamenti Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{payments.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Tutte le transazioni</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storico Pagamenti</CardTitle>
              <CardDescription>I tuoi ultimi pagamenti registrati</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.recent.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun pagamento registrato
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.recent.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{getPaymentTypeBadge(payment.type)}</TableCell>
                        <TableCell>{payment.description || "-"}</TableCell>
                        <TableCell className="font-semibold">
                          €{(payment.amountCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {payment.dueAt
                            ? format(new Date(payment.dueAt), "d MMM yyyy", { locale: it })
                            : "-"}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Cronologia */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronologia Iscrizione</CardTitle>
              <CardDescription>La tua storia con l'organizzazione</CardDescription>
            </CardHeader>
            <CardContent>
              {registration ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Richiesta Iscrizione</h3>
                        <Badge
                          variant={
                            registration.status === "approved"
                              ? "default"
                              : registration.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {registration.status === "approved"
                            ? "Approvata"
                            : registration.status === "pending"
                            ? "In Attesa"
                            : "Rifiutata"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Inviata il {format(new Date(registration.createdAt), "d MMMM yyyy", { locale: it })}
                      </p>
                      {registration.reviewedAt && (
                        <p className="text-sm text-muted-foreground">
                          Revisionata il{" "}
                          {format(new Date(registration.reviewedAt), "d MMMM yyyy", { locale: it })}
                        </p>
                      )}
                      {registration.rejectionReason && (
                        <p className="text-sm text-destructive mt-2">
                          Motivo rifiuto: {registration.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {profile.createdAt && (
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Membro Attivo</h3>
                        <p className="text-sm text-muted-foreground">
                          Dal {format(new Date(profile.createdAt), "d MMMM yyyy", { locale: it })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nessuna cronologia disponibile
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
