import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Music2, Youtube, Link as LinkIcon } from "lucide-react";

interface UploadAssetDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  songId: number;
}

export function UploadAssetDialog({ open, onClose, onSuccess, songId }: UploadAssetDialogProps) {
  const [assetType, setAssetType] = useState<string>("score_pdf");
  const [voiceSection, setVoiceSection] = useState<string>("all");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAssetMutation = trpc.songs.uploadAsset.useMutation({
    onSuccess: () => {
      toast.success("File caricato con successo");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
      setUploading(false);
    },
  });

  const resetForm = () => {
    setAssetType("score_pdf");
    setVoiceSection("all");
    setFile(null);
    setYoutubeUrl("");
    setLyricsText("");
    setUploading(false);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (max 16MB)
      if (selectedFile.size > 16 * 1024 * 1024) {
        toast.error("Il file è troppo grande. Dimensione massima: 16MB");
        return;
      }

      // Validate file type
      if (assetType === "score_pdf" && !selectedFile.type.includes("pdf")) {
        toast.error("Per gli spartiti è richiesto un file PDF");
        return;
      }

      if ((assetType === "reference_audio" || assetType === "section_stem") && 
          !selectedFile.type.includes("audio")) {
        toast.error("Per gli audio è richiesto un file audio (MP3, WAV, etc.)");
        return;
      }

      setFile(selectedFile);
    }
  };

  const uploadToS3 = async (file: File): Promise<{ url: string; fileKey: string }> => {
    // Simulate upload progress
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Generate unique file key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `songs/${songId}/${timestamp}-${randomSuffix}-${file.name}`;
    
    setUploadProgress(30);

    // Call S3 upload API (this should be implemented in your backend)
    // For now, we'll use a placeholder URL
    // In production, you would call your backend endpoint that uses storagePut()
    
    try {
      // TODO: Replace with actual S3 upload endpoint
      // const response = await fetch('/api/upload-to-s3', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();
      
      setUploadProgress(80);
      
      // Placeholder: In production, this would be the actual S3 URL
      const url = `https://storage.example.com/${fileKey}`;
      
      setUploadProgress(100);
      
      return { url, fileKey };
    } catch (error) {
      throw new Error("Errore durante l'upload del file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let url = "";
      let fileKey: string | undefined;
      let mimeType: string | undefined;
      let fileSize: number | undefined;

      if (assetType === "youtube_link") {
        if (!youtubeUrl.trim()) {
          toast.error("Inserisci un URL YouTube valido");
          setUploading(false);
          return;
        }
        url = youtubeUrl;
      } else if (assetType === "lyrics") {
        if (!lyricsText.trim()) {
          toast.error("Inserisci il testo del brano");
          setUploading(false);
          return;
        }
        // For lyrics, we'll store as a text file
        const blob = new Blob([lyricsText], { type: "text/plain" });
        const lyricsFile = new File([blob], "lyrics.txt", { type: "text/plain" });
        const uploadResult = await uploadToS3(lyricsFile);
        url = uploadResult.url;
        fileKey = uploadResult.fileKey;
        mimeType = "text/plain";
        fileSize = blob.size;
      } else {
        if (!file) {
          toast.error("Seleziona un file da caricare");
          setUploading(false);
          return;
        }
        const uploadResult = await uploadToS3(file);
        url = uploadResult.url;
        fileKey = uploadResult.fileKey;
        mimeType = file.type;
        fileSize = file.size;
      }

      uploadAssetMutation.mutate({
        songId,
        type: assetType as any,
        url,
        fileKey,
        voiceSection: voiceSection !== "all" ? (voiceSection as any) : undefined,
        mimeType,
        fileSize,
      });
    } catch (error) {
      toast.error("Errore durante l'upload");
      setUploading(false);
    }
  };

  const getAcceptedFileTypes = () => {
    if (assetType === "score_pdf") return ".pdf";
    if (assetType === "reference_audio" || assetType === "section_stem") return "audio/*";
    return "*";
  };

  const showFileUpload = assetType !== "youtube_link" && assetType !== "lyrics";
  const showYoutubeInput = assetType === "youtube_link";
  const showLyricsInput = assetType === "lyrics";
  const showVoiceSection = assetType === "section_stem";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Carica Materiale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Type */}
          <div>
            <Label htmlFor="assetType">Tipo di Materiale</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Spartito PDF
                  </div>
                </SelectItem>
                <SelectItem value="reference_audio">
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4" />
                    Audio Riferimento
                  </div>
                </SelectItem>
                <SelectItem value="section_stem">
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4" />
                    Traccia Sezione Vocale
                  </div>
                </SelectItem>
                <SelectItem value="lyrics">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Testo
                  </div>
                </SelectItem>
                <SelectItem value="youtube_link">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    Link YouTube
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Voice Section (only for section_stem) */}
          {showVoiceSection && (
            <div>
              <Label htmlFor="voiceSection">Sezione Vocale</Label>
              <Select value={voiceSection} onValueChange={setVoiceSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le voci</SelectItem>
                  <SelectItem value="soprano">Soprano</SelectItem>
                  <SelectItem value="mezzo_soprano">Mezzo-soprano</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="tenor">Tenore</SelectItem>
                  <SelectItem value="baritone">Baritono</SelectItem>
                  <SelectItem value="bass">Basso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload */}
          {showFileUpload && (
            <div>
              <Label htmlFor="file">File</Label>
              <div className="mt-2">
                <label
                  htmlFor="file"
                  className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {file ? file.name : "Clicca per selezionare un file"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {assetType === "score_pdf" ? "PDF" : "MP3, WAV, OGG"} - Max 16MB
                    </span>
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}

          {/* YouTube URL */}
          {showYoutubeInput && (
            <div>
              <Label htmlFor="youtubeUrl">URL YouTube</Label>
              <div className="flex items-center gap-2 mt-2">
                <LinkIcon className="w-5 h-5 text-gray-400" />
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
            </div>
          )}

          {/* Lyrics Text */}
          {showLyricsInput && (
            <div>
              <Label htmlFor="lyricsText">Testo del Brano</Label>
              <textarea
                id="lyricsText"
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                className="w-full h-48 px-3 py-2 mt-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Inserisci il testo completo del brano..."
                required
              />
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Caricamento in corso...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Annulla
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Caricamento..." : "Carica"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
