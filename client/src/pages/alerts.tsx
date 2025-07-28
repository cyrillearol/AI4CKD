import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, User, Calendar } from "lucide-react";
import { Alert, AlertWithPatient } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery<AlertWithPatient[]>({
    queryKey: ["/api/alerts"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PUT", `/api/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Alerte marquée comme lue",
        description: "L'alerte a été mise à jour avec succès.",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const readAlerts = alerts.filter(alert => alert.isRead);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Système d'Alertes</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Système d'Alertes</h1>
          <p className="text-gray-600">Surveillez les valeurs critiques de vos patients</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {unreadAlerts.length} non lues
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {alerts.length} total
          </Badge>
        </div>
      </div>

      {/* Alertes non lues */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Alertes Non Lues ({unreadAlerts.length})</span>
          </h2>
          <div className="grid gap-4">
            {unreadAlerts.map((alert) => (
              <Card key={alert.id} className={cn("border-l-4", {
                "border-l-red-500": alert.severity === "critical",
                "border-l-orange-500": alert.severity === "high",
                "border-l-yellow-500": alert.severity === "warning",
              })}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity === "critical" ? "Critique" : 
                           alert.severity === "high" ? "Élevé" : "Attention"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.type === "creatinine" ? "Créatinine" :
                           alert.type === "blood_pressure" ? "Tension" : 
                           alert.type === "weight_loss" ? "Poids" : alert.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{alert.message}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{alert.patient.firstName} {alert.patient.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(alert.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => markAsReadMutation.mutate(alert.id)}
                      disabled={markAsReadMutation.isPending}
                      size="sm"
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Marquer comme lue
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Valeur mesurée:</span>
                        <div className="font-mono text-lg">{alert.value}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Seuil dépassé:</span>
                        <div className="font-mono text-lg">{alert.threshold}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alertes lues */}
      {readAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Alertes Lues ({readAlerts.length})</span>
          </h2>
          <div className="grid gap-4">
            {readAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-60 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge variant="secondary" className="text-xs">
                          {alert.type === "creatinine" ? "Créatinine" :
                           alert.type === "blood_pressure" ? "Tension" : 
                           alert.type === "weight_loss" ? "Poids" : alert.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-gray-700">{alert.message}</CardTitle>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{alert.patient.firstName} {alert.patient.lastName}</span>
                        <span>{new Date(alert.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte</h3>
            <p className="text-gray-600 text-center">
              Toutes les valeurs de vos patients sont dans les normes acceptables.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}