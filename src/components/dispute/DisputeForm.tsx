import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Upload, Loader2, X, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const disputeSchema = z.object({
  reason: z.enum(["no_show", "poor_quality", "inappropriate_behavior", "payment_issue", "damage", "other"]),
  description: z.string().min(50, "Descrizione troppo breve (min 50 caratteri)").max(2000, "Descrizione troppo lunga"),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

interface UploadedFile {
  name: string;
  type: "image" | "document";
  file: File;
  preview?: string;
}

interface DisputeFormProps {
  reporterId: string;
  reporterType: "professional" | "client";
  reportedId: string;
  reportedType: "professional" | "client";
  reportedName: string;
  bookingId?: string;
  conversationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const reasonLabels = {
  no_show: "Mancata presentazione",
  poor_quality: "Qualità del servizio scadente",
  inappropriate_behavior: "Comportamento inappropriato",
  payment_issue: "Problema con il pagamento",
  damage: "Danni causati",
  other: "Altro",
};

export function DisputeForm({
  reporterId,
  reporterType,
  reportedId,
  reportedType,
  reportedName,
  bookingId,
  conversationId,
  onSuccess,
  onCancel,
}: DisputeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const form = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: "other",
      description: "",
    },
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const newFile: UploadedFile = {
        name: file.name,
        type: isImage ? "image" : "document",
        file,
      };

      if (isImage) {
        newFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(newFile);
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  }

  async function onSubmit(data: DisputeFormData) {
    setIsSubmitting(true);

    try {
      // Create dispute
      const { data: dispute, error: disputeError } = await supabase
        .from("disputes")
        .insert({
          reporter_id: reporterId,
          reporter_type: reporterType,
          reported_id: reportedId,
          reported_type: reportedType,
          booking_id: bookingId || null,
          conversation_id: conversationId || null,
          reason: data.reason,
          description: data.description,
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Upload evidence files
      for (const uploadedFile of uploadedFiles) {
        const fileExt = uploadedFile.name.split(".").pop();
        const fileName = `${reporterId}/${dispute.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("dispute-evidence")
          .upload(fileName, uploadedFile.file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("dispute-evidence")
          .getPublicUrl(fileName);

        await supabase.from("dispute_evidence").insert({
          dispute_id: dispute.id,
          uploader_id: reporterId,
          file_type: uploadedFile.type,
          file_url: urlData.publicUrl,
          file_name: uploadedFile.name,
        });
      }

      toast({
        title: "Segnalazione inviata",
        description: "Il nostro team esaminerà il caso il prima possibile",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Dispute submission error:", error);
      toast({
        title: "Errore",
        description: "Non è stato possibile inviare la segnalazione",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-warning">Attenzione</p>
          <p className="text-sm text-muted-foreground mt-1">
            Stai per aprire una disputa contro <strong>{reportedName}</strong>. 
            Le false segnalazioni possono comportare sanzioni.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo della segnalazione</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona motivo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(reasonLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrizione dettagliata</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrivi cosa è successo nel dettaglio. Più informazioni fornisci, più velocemente potremo risolvere il problema..."
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Minimo 50 caratteri. Includi date, orari e dettagli rilevanti.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File upload */}
          <div className="space-y-3">
            <FormLabel>Prove (foto, documenti, screenshot)</FormLabel>
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Trascina i file qui o clicca per caricarli
              </p>
              <Input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="evidence-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("evidence-upload")?.click()}
              >
                Scegli file
              </Button>
            </div>

            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    {file.type === "image" && file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : file.type === "image" ? (
                      <ImageIcon className="w-12 h-12 p-2 text-muted-foreground" />
                    ) : (
                      <File className="w-12 h-12 p-2 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Annulla
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Invia segnalazione
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
