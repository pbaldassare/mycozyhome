import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Upload, X, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppHeader } from "@/components/client/AppHeader";
import { TrustIndicator } from "@/components/client/TrustIndicator";
import { useToast } from "@/hooks/use-toast";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const disputeSchema = z.object({
  reason: z.string().min(1, "Seleziona un motivo"),
  description: z.string().min(20, "Descrivi il problema in almeno 20 caratteri").max(1000),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

const disputeReasons = [
  { value: "quality", label: "Qualità del servizio non soddisfacente" },
  { value: "no_show", label: "Il professionista non si è presentato" },
  { value: "late", label: "Ritardo eccessivo" },
  { value: "behavior", label: "Comportamento inappropriato" },
  { value: "damage", label: "Danni causati durante il servizio" },
  { value: "price", label: "Problemi con il prezzo/pagamento" },
  { value: "other", label: "Altro" },
];

interface UploadedFile {
  file: File;
  preview: string;
}

export default function ClientDispute() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: "",
      description: "",
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: "Troppi file",
        description: `Puoi caricare massimo ${MAX_FILES} file.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File troppo grande",
          description: `${file.name} supera il limite di 5MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const onSubmit = async (data: DisputeFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In production, upload files and create dispute
      console.log("Dispute data:", data);
      console.log("Files:", files);

      toast({
        title: "Segnalazione inviata",
        description: "La tua segnalazione è stata registrata. Ti contatteremo presto.",
      });
      
      navigate("/client/bookings");
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile inviare la segnalazione. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <AppHeader title="Apri segnalazione" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Info Banner */}
        <TrustIndicator
          type="protected"
          title="Le tue segnalazioni sono protette"
          description="Tutte le informazioni sono riservate e verranno esaminate dal nostro team"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo della segnalazione</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleziona un motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {disputeReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione del problema</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descrivi nel dettaglio cosa è successo..."
                      rows={5}
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormDescription>
                    Fornisci tutti i dettagli utili per capire il problema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-3">
              <FormLabel>Prove e allegati (opzionale)</FormLabel>
              <FormDescription>
                Carica screenshot, foto o altri documenti che supportano la tua segnalazione.
              </FormDescription>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl bg-muted overflow-hidden"
                    >
                      {file.file.type.startsWith("image/") ? (
                        <img
                          src={file.preview}
                          alt={`Allegato ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length < MAX_FILES && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 rounded-xl border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Carica immagini o PDF (max {MAX_FILES} file)
                    </span>
                  </div>
                </Button>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Attenzione</p>
                <p className="mt-1 text-warning/80">
                  Le segnalazioni false o fraudolente possono comportare la sospensione del tuo account.
                </p>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Invio in corso..." : "Invia segnalazione"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
