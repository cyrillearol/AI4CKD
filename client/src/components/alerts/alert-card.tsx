import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { AlertWithPatient } from "@shared/schema";
import { useLocation } from "wouter";

interface AlertCardProps {
  alert: AlertWithPatient;
}

const severityConfig = {
  critical: {
    bgColor: "bg-red-50 border-red-200",
    badgeColor: "bg-alert-red",
    dotColor: "bg-alert-red",
  },
  high: {
    bgColor: "bg-orange-50 border-orange-200",
    badgeColor: "bg-alert-orange",
    dotColor: "bg-alert-orange",
  },
  warning: {
    bgColor: "bg-yellow-50 border-yellow-200",
    badgeColor: "bg-alert-yellow",
    dotColor: "bg-alert-yellow",
  },
};

export default function AlertCard({ alert }: AlertCardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const config = severityConfig[alert.severity as keyof typeof severityConfig];

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/alerts/${alert.id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minutes`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border rounded-lg",
      config.bgColor
    )}>
      <div className="flex items-center space-x-4">
        <div className={cn(
          "w-3 h-3 rounded-full",
          config.dotColor,
          alert.severity === "critical" && "animate-pulse"
        )} />
        <div>
          <p className="font-medium text-gray-900">
            {alert.patient.firstName} {alert.patient.lastName}
          </p>
          <p className="text-sm text-gray-600">{alert.message}</p>
          <p className="text-xs text-gray-500">
            {formatTimeAgo(alert.createdAt.toString())}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge 
          className={cn(
            "text-white text-xs",
            config.badgeColor
          )}
        >
          {alert.severity.toUpperCase()}
        </Badge>
        <Button
          size="sm"
          onClick={() => setLocation(`/patients/${alert.patient.id}`)}
        >
          Voir Patient
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAsReadMutation.mutate()}
          disabled={markAsReadMutation.isPending}
        >
          {markAsReadMutation.isPending ? "..." : "Marquer Lu"}
        </Button>
      </div>
    </div>
  );
}
