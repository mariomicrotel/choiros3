import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function EventQRCode() {
  const params = useParams();
  const eventId = params.id ? parseInt(params.id) : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  const { data: event, isLoading } = trpc.events.get.useQuery({ eventId });

  useEffect(() => {
    if (event && canvasRef.current) {
      generateQRCode();
    }
  }, [event]);

  const generateQRCode = async () => {
    if (!event || !canvasRef.current) return;

    try {
      const qrData = JSON.stringify({
        type: "choiros-checkin",
        eventId: event.id,
        eventTitle: event.title,
        timestamp: Date.now(),
        validUntil: new Date(event.startAt).getTime() + 24 * 60 * 60 * 1000, // Valid for 24h after event start
      });

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrGenerated(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `qr-event-${eventId}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handlePrint = () => {
    window.print();
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

  if (!event) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Evento non trovato</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Code Check-in</h1>
        <p className="text-muted-foreground mt-2">Codice QR per il check-in all'evento</p>
      </div>

      {/* QR Code Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Evento</CardTitle>
            <CardDescription>Informazioni sull'evento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Titolo</p>
              <p className="text-lg font-semibold">{event.title}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Data e Ora</p>
              <p className="text-lg">{format(new Date(event.startAt), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
            </div>

            {event.locationString && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Luogo</p>
                <p className="text-lg">{event.locationString}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Il QR code è valido per 24 ore dall'inizio dell'evento. I coristi possono scansionarlo per registrare la loro presenza.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scansiona per registrare la presenza</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>

            {qrGenerated && (
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Scarica
                </Button>
                <Button onClick={handlePrint} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Stampa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Istruzioni per l'uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Stampa o proietta questo QR code all'ingresso della sede dell'evento</li>
            <li>I coristi devono aprire l'app ChoirOS sul loro smartphone</li>
            <li>Accedere alla sezione "Check-in" e scansionare il QR code</li>
            <li>La presenza verrà registrata automaticamente</li>
            <li>Se offline, la presenza verrà sincronizzata quando tornerà la connessione</li>
          </ol>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          canvas, canvas * {
            visibility: visible;
          }
          canvas {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
