import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Check,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  Shield,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  fileSize?: number;
}

interface ProfessionalData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  fiscalCode?: string;
  birthDate?: string;
  bio?: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "suspended";
  services: string[];
  documents: Document[];
  createdAt: string;
  rating?: number;
  reviewCount?: number;
}

interface ProfessionalReviewPanelProps {
  professional: ProfessionalData;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  onClose: () => void;
}

const documentTypeLabels: Record<string, string> = {
  id_card: "Carta d'identità",
  fiscal_code: "Codice fiscale",
  certificate: "Certificato",
  insurance: "Assicurazione",
  other: "Altro",
};

const statusConfig = {
  pending: { label: "In attesa", className: "bg-warning/10 text-warning" },
  in_review: { label: "In revisione", className: "bg-info/10 text-info" },
  approved: { label: "Approvato", className: "bg-success/10 text-success" },
  rejected: { label: "Rifiutato", className: "bg-destructive/10 text-destructive" },
  suspended: { label: "Sospeso", className: "bg-muted text-muted-foreground" },
};

export function ProfessionalReviewPanel({
  professional,
  onApprove,
  onReject,
  onClose,
}: ProfessionalReviewPanelProps) {
  const [adminNotes, setAdminNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const { toast } = useToast();

  // Generate signed URL for private bucket documents
  const getSignedUrl = useCallback(async (fileUrl: string): Promise<string | null> => {
    try {
      // Extract the file path from the URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
      // or it might just be the path
      let filePath = fileUrl;
      if (fileUrl.includes('/storage/v1/object/')) {
        const match = fileUrl.match(/\/storage\/v1\/object\/(?:public|authenticated)\/professional-documents\/(.+)/);
        if (match) {
          filePath = match[1];
        }
      }
      
      const { data, error } = await supabase.storage
        .from('professional-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  }, []);

  const handleViewDocument = async (doc: Document) => {
    setSelectedDocument(doc);
    setLoadingDocument(true);
    setDocumentPreviewUrl(null);
    
    const signedUrl = await getSignedUrl(doc.url);
    setDocumentPreviewUrl(signedUrl);
    setLoadingDocument(false);
  };

  const handleDownloadDocument = async (doc: Document) => {
    const signedUrl = await getSignedUrl(doc.url);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast({
        title: "Errore download",
        description: "Impossibile scaricare il documento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const initials = `${professional.firstName[0]}${professional.lastName[0]}`;
  const fullName = `${professional.firstName} ${professional.lastName}`;
  const status = statusConfig[professional.status];

  const handleApprove = () => {
    onApprove(professional.id, adminNotes);
    toast({
      title: "Professionista approvato",
      description: `${fullName} è stato approvato e sarà visibile ai clienti.`,
    });
    onClose();
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      toast({
        title: "Note richieste",
        description: "Inserisci una motivazione per il rifiuto.",
        variant: "destructive",
      });
      return;
    }
    onReject(professional.id, adminNotes);
    toast({
      title: "Professionista rifiutato",
      description: `${fullName} è stato rifiutato.`,
    });
    setShowRejectDialog(false);
    onClose();
  };

  const pendingDocs = professional.documents.filter((d) => d.status === "pending");
  const allDocsReviewed = pendingDocs.length === 0 && professional.documents.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={status.className}>{status.label}</Badge>
              {professional.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span>{professional.rating}</span>
                  <span className="text-muted-foreground">
                    ({professional.reviewCount} recensioni)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informazioni personali</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{professional.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{professional.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{professional.address || professional.city}</span>
          </div>
          {professional.birthDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(professional.birthDate), "d MMMM yyyy", {
                  locale: it,
                })}
              </span>
            </div>
          )}
          {professional.fiscalCode && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{professional.fiscalCode}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Servizi offerti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {professional.services.map((service) => (
              <Badge key={service} variant="secondary">
                {service}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Documenti ({professional.documents.length})
          </CardTitle>
          <CardDescription>
            Verifica i documenti caricati dal professionista
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {professional.documents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nessun documento caricato</p>
            </div>
          ) : (
            professional.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {documentTypeLabels[doc.type] || doc.type} •{" "}
                      {format(new Date(doc.uploadedAt), "d MMM yyyy", {
                        locale: it,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      doc.status === "approved"
                        ? "bg-success/10 text-success"
                        : doc.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {doc.status === "approved"
                      ? "Verificato"
                      : doc.status === "rejected"
                      ? "Rifiutato"
                      : "Da verificare"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDownloadDocument(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note admin</CardTitle>
          <CardDescription>
            Aggiungi note per il professionista (visibili in caso di rifiuto)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Inserisci note o motivazioni..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {(professional.status === "pending" || professional.status === "in_review") && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="h-4 w-4" />
            Rifiuta
          </Button>
          <Button
            className="flex-1 gap-2 bg-success hover:bg-success/90"
            onClick={handleApprove}
            disabled={!allDocsReviewed}
          >
            <Check className="h-4 w-4" />
            Approva
          </Button>
        </div>
      )}

      {!allDocsReviewed && professional.documents.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Ci sono {pendingDocs.length} documenti da verificare prima dell'approvazione
          </span>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma rifiuto</DialogTitle>
            <DialogDescription>
              Stai per rifiutare la richiesta di {fullName}. Assicurati di aver
              inserito una motivazione nelle note.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Conferma rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => {
        setSelectedDocument(null);
        setDocumentPreviewUrl(null);
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {loadingDocument ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : documentPreviewUrl ? (
              <img
                src={documentPreviewUrl}
                alt={selectedDocument?.name}
                className="max-h-full max-w-full object-contain rounded-lg"
                onError={(e) => {
                  // If image fails to load, it might be a PDF or other file type
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-center">
                <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Anteprima non disponibile</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedDocument(null);
              setDocumentPreviewUrl(null);
            }}>
              Chiudi
            </Button>
            {selectedDocument && (
              <Button onClick={() => handleDownloadDocument(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
