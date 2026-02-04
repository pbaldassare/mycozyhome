import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Loader2 } from "lucide-react";
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

const ticketSchema = z.object({
  category: z.enum(["technical", "billing", "service", "report", "other"]),
  subject: z.string().min(5, "Oggetto troppo breve").max(100, "Oggetto troppo lungo"),
  description: z.string().min(20, "Descrizione troppo breve").max(2000, "Descrizione troppo lunga"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface SupportTicketFormProps {
  userId: string;
  userType: "professional" | "client";
  onSuccess?: () => void;
}

const categoryLabels = {
  technical: "Problema tecnico",
  billing: "Pagamenti e fatturazione",
  service: "Problemi con un servizio",
  report: "Segnalazione utente",
  other: "Altro",
};

const priorityLabels = {
  low: "Bassa",
  normal: "Normale",
  high: "Alta",
  urgent: "Urgente",
};

export function SupportTicketForm({ userId, userType, onSuccess }: SupportTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: "other",
      subject: "",
      description: "",
      priority: "normal",
    },
  });

  async function onSubmit(data: TicketFormData) {
    setIsSubmitting(true);

    const { error } = await supabase.from("support_tickets").insert({
      user_id: userId,
      user_type: userType,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
    });

    if (error) {
      toast({
        title: "Errore",
        description: "Non è stato possibile inviare la richiesta",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Richiesta inviata",
        description: "Ti risponderemo il prima possibile",
      });
      form.reset();
      onSuccess?.();
    }

    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priorità</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona priorità" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
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
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Oggetto</FormLabel>
              <FormControl>
                <Input placeholder="Breve descrizione del problema" {...field} />
              </FormControl>
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
                  placeholder="Descrivi il problema nel dettaglio..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Invia richiesta
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
