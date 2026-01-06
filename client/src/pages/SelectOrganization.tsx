import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";

export default function SelectOrganization() {
  const [, setLocation] = useLocation();
  const { data: organizations, isLoading } = trpc.auth.myOrganizations.useQuery();

  useEffect(() => {
    // If user has only one organization, redirect automatically
    if (organizations && organizations.length === 1) {
      const org = organizations[0];
      // Redirect to organization URL
      window.location.href = `/t/${org.slug}/`;
    }
  }, [organizations]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Nessuna Organizzazione</CardTitle>
            <CardDescription>
              Non sei ancora membro di nessun coro. Contatta un amministratore per ricevere un invito.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Seleziona Organizzazione</CardTitle>
          <CardDescription>
            Scegli il coro a cui vuoi accedere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.map((org: any) => (
            <Button
              key={org.id}
              variant="outline"
              className="w-full h-auto py-4 px-6 flex items-start justify-between text-left"
              onClick={() => {
                window.location.href = `/t/${org.slug}/`;
              }}
            >
              <div className="flex items-start gap-4">
                <Building2 className="h-6 w-6 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-lg">{org.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Ruolo: <span className="capitalize">{org.role}</span>
                  </div>
                  {org.status !== "active" && (
                    <div className="text-sm text-orange-600 mt-1">
                      Stato: {org.status}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">→</div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
