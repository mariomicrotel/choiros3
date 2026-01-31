import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building2, HardDrive, Cloud } from "lucide-react";

export default function AdminOrganizations() {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedStorageType, setSelectedStorageType] = useState<"local" | "s3">("s3");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch all organizations (superadmin only)
  const { data: organizations, isLoading: loadingOrgs } = trpc.superadmin.listOrganizations.useQuery();

  // Update storage type mutation
  const updateStorageMutation = trpc.organizations.updateStorageType.useMutation({
    onSuccess: () => {
      toast.success("Il tipo di storage è stato modificato con successo.");
      setShowConfirmDialog(false);
      setSelectedOrgId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Impossibile aggiornare il tipo di storage.");
    },
  });

  const handleUpdateStorage = () => {
    if (!selectedOrgId) return;
    updateStorageMutation.mutate({
      organizationId: selectedOrgId,
      storageType: selectedStorageType,
    });
  };

  const selectedOrg = organizations?.find((org) => org.id === selectedOrgId);

  if (loadingOrgs) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento organizzazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestione Organizzazioni</h1>
        <p className="text-muted-foreground mt-2">
          Configura le impostazioni delle organizzazioni (solo superadmin)
        </p>
      </div>

      <div className="grid gap-6">
        {/* Storage Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Configurazione Storage
            </CardTitle>
            <CardDescription>
              Scegli il tipo di storage per i file delle organizzazioni (spartiti, audio, documenti)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization Selector */}
            <div className="space-y-2">
              <Label htmlFor="org-select">Organizzazione</Label>
              <Select
                value={selectedOrgId?.toString() || ""}
                onValueChange={(value) => {
                  const orgId = parseInt(value);
                  setSelectedOrgId(orgId);
                  const org = organizations?.find((o) => o.id === orgId);
                  if (org) {
                    setSelectedStorageType((org.storageType as "local" | "s3") || "s3");
                  }
                }}
              >
                <SelectTrigger id="org-select">
                  <SelectValue placeholder="Seleziona un'organizzazione" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {org.name} ({org.slug})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Storage Type Selector */}
            {selectedOrgId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="storage-type">Tipo di Storage</Label>
                  <Select
                    value={selectedStorageType}
                    onValueChange={(value) => setSelectedStorageType(value as "local" | "s3")}
                  >
                    <SelectTrigger id="storage-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          Filesystem Locale
                        </div>
                      </SelectItem>
                      <SelectItem value="s3">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          Amazon S3 (Cloud)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Storage Type Info */}
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">
                    {selectedStorageType === "local" ? "Filesystem Locale" : "Amazon S3"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedStorageType === "local" ? (
                      <>
                        I file verranno salvati sul filesystem del server in{" "}
                        <code className="bg-background px-1 rounded">/storage/organizations/{selectedOrgId}/</code>.
                        Ideale per installazioni on-premise o tenant con requisiti di data residency.
                      </>
                    ) : (
                      <>
                        I file verranno salvati su Amazon S3 con isolamento per tenant.
                        Ideale per scalabilità, backup automatici e accesso distribuito.
                      </>
                    )}
                  </p>
                </div>

                {/* Current Storage Type */}
                {selectedOrg && (
                  <div className="text-sm text-muted-foreground">
                    Storage attuale: <strong>{selectedOrg.storageType === "local" ? "Filesystem Locale" : "Amazon S3"}</strong>
                  </div>
                )}

                {/* Save Button */}
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={updateStorageMutation.isPending || selectedOrg?.storageType === selectedStorageType}
                >
                  {updateStorageMutation.isPending ? "Salvataggio..." : "Salva Configurazione"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Cambio Storage</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Stai per cambiare il tipo di storage per <strong>{selectedOrg?.name}</strong> da{" "}
                <strong>{selectedOrg?.storageType === "local" ? "Filesystem Locale" : "Amazon S3"}</strong> a{" "}
                <strong>{selectedStorageType === "local" ? "Filesystem Locale" : "Amazon S3"}</strong>.
              </p>
              <p className="text-amber-600 dark:text-amber-500 font-medium">
                ⚠️ Attenzione: I file esistenti NON verranno migrati automaticamente.
                Dovrai migrare manualmente i file dal vecchio storage al nuovo.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateStorage}>
              Conferma Cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
