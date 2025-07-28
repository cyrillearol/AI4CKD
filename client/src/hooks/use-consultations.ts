import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Consultation, InsertConsultation } from "@shared/schema";

export function useConsultations() {
  return useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
  });
}

export function useRecentConsultations(limit?: number) {
  return useQuery<Consultation[]>({
    queryKey: ["/api/consultations/recent", limit],
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (consultation: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", consultation);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Consultation enregistrée",
        description: "La consultation a été enregistrée et les alertes ont été vérifiées.",
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
