import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertConsultationSchema, type InsertConsultation, type Patient } from "@shared/schema";
import { Save } from "lucide-react";

export default function ConsultationForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"]
  });

  const form = useForm<InsertConsultation>({
    resolver: zodResolver(insertConsultationSchema),
    defaultValues: {
      patientId: "",
      doctorName: "Dr. Kouakou",
      notes: "",
    },
  });

  const createConsultationMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      toast({
        title: "Consultation enregistrée",
        description: "La consultation a été enregistrée avec succès. Les alertes ont été vérifiées.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertConsultation) => {
    createConsultationMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Patient</Label>
        <Select onValueChange={(value) => form.setValue("patientId", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.patientId && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.patientId.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Créatinine (mg/dL)
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="1.2"
            {...form.register("creatinine")}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Poids (kg)
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="70.5"
            {...form.register("weight")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Tension Systolique
          </Label>
          <Input
            type="number"
            placeholder="120"
            {...form.register("systolicBP", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Tension Diastolique
          </Label>
          <Input
            type="number"
            placeholder="80"
            {...form.register("diastolicBP", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Notes</Label>
        <Textarea
          rows={3}
          placeholder="Observations médicales..."
          {...form.register("notes")}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-medical-blue hover:bg-blue-700"
        disabled={createConsultationMutation.isPending}
      >
        <Save className="mr-2 h-4 w-4" />
        {createConsultationMutation.isPending ? "Enregistrement..." : "Enregistrer Consultation"}
      </Button>
    </form>
  );
}
