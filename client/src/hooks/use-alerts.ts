import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AlertWithPatient } from "@shared/schema";

export function useAlerts() {
  return useQuery<AlertWithPatient[]>({
    queryKey: ["/api/alerts"],
  });
}

export function useUnreadAlerts() {
  return useQuery<AlertWithPatient[]>({
    queryKey: ["/api/alerts/unread"],
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PATCH", `/api/alerts/${alertId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Alerte marquée comme lue",
        description: "L'alerte a été marquée comme lue.",
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
