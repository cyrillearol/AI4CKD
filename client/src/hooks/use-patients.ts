import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, InsertPatient, PatientWithRelations } from "@shared/schema";

export function usePatients() {
  return useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
}

export function usePatient(id: string) {
  return useQuery<PatientWithRelations>({
    queryKey: ["/api/patients", id],
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (patient: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", patient);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Patient créé",
        description: "Le nouveau patient a été ajouté avec succès.",
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
}
