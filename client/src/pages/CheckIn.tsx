import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle2, XCircle, WifiOff, Wifi } from "lucide-react";
import QrScanner from "qr-scanner";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { toast } from "sonner";

export default function CheckIn() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  const { isOnline, pendingCount, savePendingAttendance, syncPendingRecords } = useOfflineStorage();

  const utils = trpc.useUtils();

  // Check-in mutation
  const checkInMutation = trpc.attendance.checkIn.useMutation({
    onSuccess: () => {
      setScanSuccess(true);
      toast.success("Check-in registrato con successo!");
      utils.attendance.myAttendance.invalidate();

      setTimeout(() => {
        setScanSuccess(false);
        setLastScan(null);
      }, 3000);
    },
    onError: (error) => {
      toast.error("Errore durante il check-in: " + error.message);
      setScanSuccess(false);
    },
  });

  useEffect(() => {
    if (videoRef.current && !scanner) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleScan(result.data),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      setScanner(qrScanner);
    }

    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, []);

  const handleScan = async (data: string) => {
    if (!user?.user?.id) {
      toast.error("Devi essere autenticato per effettuare il check-in");
      return;
    }

    try {
      const qrData = JSON.parse(data);

      // Validate QR code
      if (qrData.type !== "choiros-checkin") {
        toast.error("QR code non valido");
        return;
      }

      // Check if QR code is still valid
      if (qrData.validUntil && Date.now() > qrData.validUntil) {
        toast.error("QR code scaduto");
        return;
      }

      setLastScan(qrData);

      // If online, send to server immediately
      if (isOnline) {
        checkInMutation.mutate({
          eventId: qrData.eventId,
        });
      } else {
        // If offline, save to IndexedDB
        await savePendingAttendance({
          eventId: qrData.eventId,
          userId: user.user.id,
          checkInAt: new Date().toISOString(),
        });

        setScanSuccess(true);
        toast.success("Check-in salvato offline. Verrà sincronizzato quando tornerai online.");

        setTimeout(() => {
          setScanSuccess(false);
          setLastScan(null);
        }, 3000);
      }

      // Stop scanning after successful scan
      if (scanner) {
        scanner.stop();
        setScanning(false);
      }
    } catch (error) {
      console.error("Failed to parse QR code:", error);
      toast.error("QR code non valido o danneggiato");
    }
  };

  const startScanning = async () => {
    if (!scanner) return;

    try {
      await scanner.start();
      setScanning(true);
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast.error("Impossibile accedere alla fotocamera. Verifica i permessi.");
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      setScanning(false);
    }
  };

  const handleSync = async () => {
    await syncPendingRecords();
    toast.success("Sincronizzazione avviata");
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in Presenze</h1>
          <p className="text-muted-foreground mt-2">Scansiona il QR code per registrare la tua presenza</p>
        </div>
        <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Offline Status */}
      {!isOnline && pendingCount > 0 && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Hai {pendingCount} check-in {pendingCount === 1 ? "in attesa" : "in attesa"} di sincronizzazione
            </span>
            <Button size="sm" variant="outline" onClick={handleSync}>
              Sincronizza ora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle>Scanner QR Code</CardTitle>
          <CardDescription>Inquadra il QR code dell'evento per registrare la presenza</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" />

            {!scanning && !scanSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white space-y-4">
                  <Camera className="h-16 w-16 mx-auto" />
                  <p className="text-lg font-medium">Premi il pulsante per iniziare la scansione</p>
                </div>
              </div>
            )}

            {scanSuccess && lastScan && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/90">
                <div className="text-center text-white space-y-4">
                  <CheckCircle2 className="h-16 w-16 mx-auto" />
                  <div>
                    <p className="text-2xl font-bold">Check-in Completato!</p>
                    <p className="text-lg mt-2">{lastScan.eventTitle}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!scanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Avvia Scanner
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Ferma Scanner
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Come funziona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Premi "Avvia Scanner" per attivare la fotocamera</li>
            <li>Inquadra il QR code dell'evento mostrato all'ingresso</li>
            <li>Il check-in verrà registrato automaticamente</li>
            <li>
              <strong>Modalità Offline:</strong> Se non hai connessione, il check-in verrà salvato localmente e sincronizzato
              automaticamente quando tornerai online
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
