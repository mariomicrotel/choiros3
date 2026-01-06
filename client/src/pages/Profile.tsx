import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ProfileCapoSezione from "./ProfileCapoSezione";
import ProfileSegretario from "./ProfileSegretario";
import ProfileDirettore from "./ProfileDirettore";
import ProfileAdmin from "./ProfileAdmin";
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
import { User, Mail, Phone, MapPin, Music, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const utils = trpc.useUtils();

  // Fetch membership to get role
  const { data: membership } = trpc.tenant.membership.useQuery(
    undefined,
    { enabled: !!user?.user?.id }
  );

  // Fetch user profile
  const { data: profile, isLoading } = trpc.users.get.useQuery(
    { userId: user?.user?.id || 0 },
    { enabled: !!user?.user?.id }
  );

  // Fetch attendance stats
  const { data: stats } = trpc.attendance.stats.useQuery({}, { enabled: !!user?.user?.id });

  // Fetch recent attendance
  const { data: recentAttendance = [] } = trpc.attendance.myAttendance.useQuery(
    undefined,
    { enabled: !!user?.user?.id }
  );

  // Fetch payments
  const { data: payments = [] } = trpc.payments.myPayments.useQuery(
    { limit: 10 },
    { enabled: !!user?.user?.id }
  );

  type VoiceSection = "soprano" | "mezzo_soprano" | "alto" | "tenor" | "baritone" | "bass";
  
  const [formData, setFormData] = useState<{
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    voiceSection: VoiceSection | "";
  }>({
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Italia",
    voiceSection: "",
  });

  // Update profile mutation
  const updateProfileMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Profilo aggiornato con successo!");
      utils.users.get.invalidate();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Errore durante l'aggiornamento: " + error.message);
    },
  });

  // Route to appropriate profile based on role (after all hooks)
  if (membership) {
    const role = membership.role;
    if (role === "admin") {
      return <ProfileAdmin />;
    } else if (role === "director") {
      return <ProfileDirettore />;
    } else if (role === "secretary") {
      return <ProfileSegretario />;
    } else if (role === "capo_section") {
      return <ProfileCapoSezione />;
    }
    // For member and guest, show default profile below
  }

  const handleEdit = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        country: profile.country || "Italia",
        voiceSection: profile.voiceSection || "",
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!user?.user?.id) return;

    updateProfileMutation.mutate({
      userId: user.user.id,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
      voiceSection: formData.voiceSection || undefined,
    } as any);
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Pagato</Badge>;
      case "pending":
        return <Badge variant="secondary">In Sospeso</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallito</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Profilo non trovato</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Il Mio Profilo</h1>
          <p className="text-muted-foreground mt-2">Gestisci le tue informazioni personali</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit}>Modifica Profilo</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="attendance">Presenze</TabsTrigger>
          <TabsTrigger value="payments">Pagamenti</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informazioni Personali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input value={user?.user?.name || ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input value={user?.user?.email || ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefono
                  </Label>
                  <Input
                    value={isEditing ? formData.phone : profile.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Sezione Vocale
                  </Label>
                  {isEditing ? (
                    <Select value={formData.voiceSection} onValueChange={(value) => setFormData({ ...formData, voiceSection: value as VoiceSection })}>
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
                  ) : (
                    <div className="text-lg font-semibold">{getVoiceSectionLabel(profile.voiceSection)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Stato</Label>
                  {getStatusBadge(profile.status)}
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Indirizzo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Indirizzo</Label>
                  <Input
                    value={isEditing ? formData.address : profile.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Città</Label>
                    <Input
                      value={isEditing ? formData.city : profile.city || ""}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CAP</Label>
                    <Input
                      value={isEditing ? formData.postalCode : profile.postalCode || ""}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Paese</Label>
                  <Input
                    value={isEditing ? formData.country : profile.country || ""}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                {profile.createdAt && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Membro dal</Label>
                    <div className="text-lg font-semibold">{format(new Date(profile.createdAt), "d MMMM yyyy", { locale: it })}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Card */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Le Mie Statistiche
                </CardTitle>
                <CardDescription>Riepilogo delle tue presenze</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Eventi Totali</p>
                    <p className="text-3xl font-bold">{stats.totalEvents}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Presenze</p>
                    <p className="text-3xl font-bold text-green-600">{stats.attendedEvents}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tasso Presenze</p>
                    <p className="text-3xl font-bold">{stats.attendanceRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Storico Presenze</CardTitle>
              <CardDescription>Le tue ultime presenze registrate</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna presenza registrata</p>
              ) : (
                <div className="space-y-2">
                  {recentAttendance.map((att) => (
                    <div key={att.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Evento #{att.eventId}</p>
                        <p className="text-sm text-muted-foreground">
                          Check-in: {format(new Date(att.checkInAt), "d MMM yyyy HH:mm", { locale: it })}
                        </p>
                      </div>
                      <Badge variant="default">Presente</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>I Miei Pagamenti</CardTitle>
              <CardDescription>Storico quote e pagamenti</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun pagamento registrato</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{payment.description || `Pagamento #${payment.id}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.dueAt && `Scadenza: ${format(new Date(payment.dueAt), "d MMM yyyy", { locale: it })}`}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold">€{(payment.amountCents / 100).toFixed(2)}</p>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
