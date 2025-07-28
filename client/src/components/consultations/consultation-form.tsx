import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertConsultationSchema, type InsertConsultation, type Patient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { z } from "zod";

const consultationFormSchema = insertConsultationSchema.extend({
  creatinine: z.string().min(1, "Créatinine requise"),
  weight: z.string().min(1, "Poids requis"),
});

type ConsultationFormData = z.infer<typeof consultationFormSchema>;

interface ConsultationFormProps {
  selectedPatientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ConsultationForm({ 
  selectedPatientId, 
  onSuccess, 
  onCancel 
}: ConsultationFormProps) {
  const { toast } = useToast();

  const { data: patients = [], isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      patientId: selectedPatientId || "",
      creatinine: "",
      weight: "",
      systolicBP: 120,
      diastolicBP: 80,
      notes: "",
      doctorName: "",
    },
  });

  useEffect(() => {
    if (selectedPatientId) {
      form.setValue("patientId", selectedPatientId);
    }
  }, [selectedPatientId, form]);

  const createConsultationMutation = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      const response = await apiRequest("POST", "/api/consultations", {
        ...data,
        creatinine: parseFloat(data.creatinine),
        weight: parseFloat(data.weight),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Consultation créée avec succès",
        description: "La nouvelle consultation a été ajoutée au dossier patient.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Impossible de créer la consultation.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConsultationFormData) => {
    createConsultationMutation.mutate(data);
  };

  const selectedPatient = patients.find(p => p.id === form.watch("patientId"));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nouvelle Consultation</CardTitle>
        <CardDescription>
          Enregistrer une nouvelle consultation médicale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sélection du patient */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!selectedPatientId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{patient.firstName} {patient.lastName}</span>
                            <Badge variant="outline" className="text-xs">
                              Stade {patient.ckdStage}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informations patient sélectionné */}
            {selectedPatient && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-800">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-blue-600">
                      <span>Stade MRC: {selectedPatient.ckdStage}</span>
                      <span>
                        Âge: {Math.floor((Date.now() - new Date(selectedPatient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans
                      </span>
                      <span>{selectedPatient.gender}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mesures cliniques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creatinine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Créatinine (mg/dL) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="1.2"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="70.5"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tension artérielle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="systolicBP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tension systolique (mmHg) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="120"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolicBP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tension diastolique (mmHg) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="80"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Médecin et notes */}
            <FormField
              control={form.control}
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médecin *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Kouakou" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes médicales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observations cliniques, traitement prescrit, recommandations..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alert info */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Système d'alertes automatique:</strong> Des alertes seront générées automatiquement
                si les valeurs saisies dépassent les seuils critiques définis (créatinine élevée, 
                tension artérielle dangereuse, perte de poids importante).
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                disabled={createConsultationMutation.isPending || loadingPatients}
                className="bg-medical-blue hover:bg-blue-700"
              >
                {createConsultationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer la consultation"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}