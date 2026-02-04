import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  status: string;
  uploaded_at: string;
}

const requiredDocuments = [
  {
    type: "id_card",
    name: "Carta d'Identità",
    description: "Fronte e retro del documento",
    required: true,
  },
  {
    type: "fiscal_code",
    name: "Codice Fiscale / Tessera Sanitaria",
    description: "Scansione o foto leggibile",
    required: false,
  },
  {
    type: "certificate",
    name: "Certificati / Attestati",
    description: "Eventuali certificazioni professionali",
    required: false,
  },
];

const statusConfig = {
  pending: { label: "In attesa", color: "text-warning", icon: Clock },
  approved: { label: "Approvato", color: "text-[hsl(var(--sage-dark))]", icon: CheckCircle },
  rejected: { label: "Rifiutato", color: "text-destructive", icon: XCircle },
};

export default function DocumentsUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/professional/auth");
      return;
    }

    setUserId(session.user.id);

    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!prof) {
      navigate("/professional/onboarding/personal");
      return;
    }

    setProfessionalId(prof.id);

    const { data: docs } = await supabase
      .from("professional_documents")
      .select("*")
      .eq("professional_id", prof.id)
      .order("uploaded_at", { ascending: false });

    if (docs) {
      setDocuments(docs as Document[]);
    }
  };

  const handleFileSelect = async (docType: string, file: File) => {
    if (!professionalId || !userId) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Il file non può superare i 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato file non supportato. Usa JPG, PNG, WebP o PDF");
      return;
    }

    setUploading(docType);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${docType}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("professional-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("professional-documents")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("professional_documents")
        .insert({
          professional_id: professionalId,
          document_type: docType,
          document_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          status: "pending",
        });

      if (dbError) throw dbError;

      toast.success("Documento caricato!");
      loadData();
    } catch (err) {
      toast.error("Errore nel caricamento del documento");
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId: string, fileUrl: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return;

    try {
      const urlParts = fileUrl.split("/");
      const filePath = urlParts.slice(-2).join("/");

      await supabase.storage.from("professional-documents").remove([filePath]);
      await supabase.from("professional_documents").delete().eq("id", docId);

      toast.success("Documento eliminato");
      loadData();
    } catch (err) {
      toast.error("Errore nell'eliminazione");
      console.error(err);
    }
  };

  const handleSubmitForReview = async () => {
    if (!professionalId) return;

    const hasIdCard = documents.some((d) => d.document_type === "id_card");
    if (!hasIdCard) {
      toast.error("Devi caricare la carta d'identità");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("professionals")
        .update({
          status: "in_review",
          documents_submitted: true,
        })
        .eq("id", professionalId);

      if (error) throw error;

      toast.success("Profilo inviato per la verifica!");
      navigate("/professional/dashboard");
    } catch (err) {
      toast.error("Errore nell'invio");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentsForType = (type: string) => {
    return documents.filter((d) => d.document_type === type);
  };

  const progress = 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/professional/onboarding/availability")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Documenti</h1>
          <div className="w-9" />
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-[hsl(var(--sage-light))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--sage))] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6 pb-40">
        <div className="bg-[hsl(var(--sage-light))] border border-[hsl(var(--sage))]/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[hsl(var(--sage-dark))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[hsl(var(--sage-dark))]">Verifica Manuale</p>
              <p className="text-sm text-muted-foreground">
                I documenti saranno verificati manualmente dal nostro team prima dell'approvazione del profilo.
              </p>
            </div>
          </div>
        </div>

        {requiredDocuments.map((docConfig) => {
          const uploadedDocs = getDocumentsForType(docConfig.type);
          const isUploading = uploading === docConfig.type;

          return (
            <div
              key={docConfig.type}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--sage-light))] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[hsl(var(--sage-dark))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{docConfig.name}</h3>
                    {docConfig.required && (
                      <span className="text-xs text-destructive">*</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {docConfig.description}
                  </p>
                </div>
              </div>

              {uploadedDocs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {uploadedDocs.map((doc) => {
                    const status = statusConfig[doc.status as keyof typeof statusConfig];
                    const StatusIcon = status?.icon || Clock;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-[hsl(var(--sage-light))]/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusIcon className={cn("w-4 h-4 flex-shrink-0", status?.color)} />
                          <span className="text-sm truncate">{doc.document_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs", status?.color)}>
                            {status?.label}
                          </span>
                          {doc.status === "pending" && (
                            <button
                              onClick={() => handleDelete(doc.id, doc.file_url)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <input
                type="file"
                ref={(el) => (fileInputRefs.current[docConfig.type] = el)}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(docConfig.type, file);
                  e.target.value = "";
                }}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full border-[hsl(var(--sage))] text-[hsl(var(--sage-dark))] hover:bg-[hsl(var(--sage-light))]"
                disabled={isUploading}
                onClick={() => fileInputRefs.current[docConfig.type]?.click()}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[hsl(var(--sage))] border-t-transparent rounded-full animate-spin mr-2" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Carica Documento
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 space-y-3">
        <Button
          onClick={handleSubmitForReview}
          className="w-full h-14 text-base rounded-2xl bg-[hsl(var(--sage))] hover:bg-[hsl(var(--sage-dark))]"
          size="lg"
          disabled={loading || !documents.some((d) => d.document_type === "id_card")}
        >
          {loading ? "Invio in corso..." : "Invia per Verifica"}
        </Button>
        <button
          onClick={() => navigate("/professional/onboarding/availability")}
          className="w-full text-center text-[hsl(var(--sage-dark))] font-medium py-2"
        >
          Indietro
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Dopo l'invio, il tuo profilo sarà verificato dal nostro team
        </p>
      </div>
    </div>
  );
}
