import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function SelectOrganization() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Nessuna Organizzazione</CardTitle>
          <CardDescription>
            Non sei ancora membro di nessun coro. Contatta un amministratore per ricevere un invito o accedi con un account demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2"><strong>Account Demo Disponibili:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Admin: admin@demo.com</li>
              <li>Direttore: director@demo.com</li>
              <li>Segretario: secretary@demo.com</li>
              <li>Corista: member@demo.com</li>
            </ul>
          </div>
          <Button 
            className="w-full" 
            onClick={() => window.location.href = getLoginUrl()}
          >
            Torna al Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
