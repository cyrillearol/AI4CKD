import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertPatientSchema, type InsertPatient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { z } from "zod";

const patientFormSchema = insertPatientSchema.extend({
  dateOfBirth: z.string().min(1, "Date de naissance requise"),
  medicalHistoryText: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PatientForm({ onSuccess, onCancel }: PatientFormProps) {
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState("");
  const { toast } = useToast();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
      ckdStage: 1,
      medicalHistoryText: "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const { medicalHistoryText, ...patientData } = data;
      const response = await apiRequest("POST", "/api/patients", {
        ...patientData,
        medicalHistory: medicalConditions,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Patient créé avec succès",
        description: "Le nouveau patient a été ajouté au système.",
      });
      form.reset();
      setMedicalConditions([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Impossible de créer le patient.",
        variant: "destructive",
      });
    },
  });

  const addMedicalCondition = () => {
    if (newCondition.trim() && !medicalConditions.includes(newCondition.trim())) {
      setMedicalConditions([...medicalConditions, newCondition.trim()]);
      setNewCondition("");
    }
  };

  const removeMedicalCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== condition));
  };

  const onSubmit = (data: PatientFormData) => {
    createPatientMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nouveau Patient</CardTitle>
        <CardDescription>
          Ajoutez un nouveau patient au système de gestion MRC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Marie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kouadio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Masculin">Masculin</SelectItem>
                        <SelectItem value="Féminin">Féminin</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informations de contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+225 07 12 34 56 78" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="marie.kouadio@email.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Abidjan, Cocody..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact d'urgence</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Kouadio - 07 23 45 67 89" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informations médicales */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ckdStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stade MRC *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le stade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Stade 1 - Léger</SelectItem>
                        <SelectItem value="2">Stade 2 - Modéré</SelectItem>
                        <SelectItem value="3">Stade 3 - Modéré à sévère</SelectItem>
                        <SelectItem value="4">Stade 4 - Sévère</SelectItem>
                        <SelectItem value="5">Stade 5 - Insuffisance terminale</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Historique médical */}
              <div className="space-y-3">
                <Label>Historique médical</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une condition médicale..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMedicalCondition();
                      }
                    }}
                  />
                  <Button type="button" onClick={addMedicalCondition} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {medicalConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {condition}
                        <button
                          type="button"
                          onClick={() => removeMedicalCondition(condition)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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
                disabled={createPatientMutation.isPending}
                className="bg-medical-blue hover:bg-blue-700"
              >
                {createPatientMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le patient"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}