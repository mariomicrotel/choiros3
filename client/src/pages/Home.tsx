import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Music, Calendar, Users, CreditCard, QrCode, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, show a simple message to access tenant URL
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Benvenuto in ChoirOS</CardTitle>
            <CardDescription>
              Per accedere alla dashboard del tuo coro, usa l'URL completo con il nome dell'organizzazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="mb-2"><strong>Esempio:</strong></p>
              <code className="block bg-muted p-2 rounded text-xs">
                /t/coro-demo/dashboard
              </code>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = "/t/coro-demo/dashboard"}
            >
              Vai a Coro Demo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ChoirOS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={getLoginUrl()}>
              <Button>Accedi</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            La piattaforma completa per
            <br />
            <span className="text-primary">gestire il tuo coro</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gestisci eventi, presenze, pagamenti e repertorio musicale in un'unica soluzione moderna e intuitiva
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <a href={getLoginUrl()}>
              <Button size="lg">Inizia Ora</Button>
            </a>
            <Button size="lg" variant="outline">
              Scopri di più
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tutto ciò che serve per il tuo coro</h2>
            <p className="text-muted-foreground text-lg">Funzionalità pensate per semplificare la gestione quotidiana</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Calendario Eventi</CardTitle>
                <CardDescription>
                  Organizza prove, concerti e riunioni con un calendario intuitivo. I coristi possono confermare la loro presenza in un
                  click.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <QrCode className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Check-in Presenze</CardTitle>
                <CardDescription>
                  Sistema di check-in con QR code. Funziona anche offline e sincronizza automaticamente quando torni online.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Gestione Coristi</CardTitle>
                <CardDescription>
                  Anagrafica completa con sezioni vocali, contatti, documenti e statistiche presenze per ogni membro del coro.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pagamenti e Quote</CardTitle>
                <CardDescription>
                  Traccia quote associative e pagamenti con stati chiari. Notifiche automatiche per scadenze imminenti.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Music className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Repository Brani</CardTitle>
                <CardDescription>
                  Gestisci il repertorio con spartiti PDF e audio MP3. Crea setlist per ogni concerto e condividile con i coristi.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Notifiche Email</CardTitle>
                <CardDescription>
                  Sistema automatico di notifiche per inviti eventi, promemoria 24h prima e conferme iscrizioni.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl font-bold">Pronto a semplificare la gestione del tuo coro?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Unisciti ai cori che hanno già scelto ChoirOS per organizzare le loro attività
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" variant="secondary">
              Inizia Gratuitamente
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ChoirOS. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
