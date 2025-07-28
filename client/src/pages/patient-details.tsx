import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle,
  FileText,
  Download,
  Activity,
  ArrowLeft,
  Edit,
  Trash2
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PatientEditForm from "@/components/patients/patient-edit-form";
import ConsultationEditForm from "@/components/consultations/consultation-edit-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { PatientWithRelations, Consultation, Alert } from "@shared/schema";

export default function PatientDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: patient, isLoading } = useQuery<PatientWithRelations>({
    queryKey: ["/api/patients", id],
    enabled: !!id,
  });

  const { data: consultations = [] } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations", "patient", id],
    queryFn: async () => {
      if (!id) return [];
      const response = await fetch(`/api/patients/${id}/consultations`);
      if (!response.ok) throw new Error('Failed to fetch consultations');
      return response.json();
    },
    enabled: !!id,
  });

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", "patient", id],
    queryFn: async () => {
      if (!id) return [];
      const response = await fetch(`/api/patients/${id}/alerts`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/patients/${patient?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient supprimé",
        description: "Le patient a été supprimé avec succès.",
      });
      setLocation("/patients");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le patient. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const deleteConsultationMutation = useMutation({
    mutationFn: async (consultationId: string) => {
      await apiRequest("DELETE", `/api/consultations/${consultationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations", "patient", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", id] });
      toast({
        title: "Consultation supprimée",
        description: "La consultation a été supprimée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la consultation. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = () => {
    if (patient) {
      window.open(`/api/patients/${patient.id}/pdf`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Patient non trouvé</h3>
        <Link href="/patients">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux patients
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-500">Dossier médical complet</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowEditForm(true)}
            variant="outline"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le patient {patient.firstName} {patient.lastName} ? 
                  Cette action est irréversible et supprimera également toutes les consultations et alertes associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleDownloadPDF} className="bg-medical-blue hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-medical-blue" />
                Informations Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Date de naissance</p>
                    <p className="text-sm text-gray-600">
                      {new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Genre</p>
                    <p className="text-sm text-gray-600">{patient.gender}</p>
                  </div>
                </div>

                {patient.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Téléphone</p>
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                    </div>
                  </div>
                )}

                {patient.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Adresse</p>
                      <p className="text-sm text-gray-600">{patient.address}</p>
                    </div>
                  </div>
                )}

                {patient.ckdStage && (
                  <div>
                    <p className="text-sm font-medium mb-1">Stade MRC</p>
                    <Badge variant="outline" className="bg-medical-green text-green-800">
                      Stade {patient.ckdStage}
                    </Badge>
                  </div>
                )}

                {patient.emergencyContact && (
                  <div>
                    <p className="text-sm font-medium">Contact d'urgence</p>
                    <p className="text-sm text-gray-600">{patient.emergencyContact}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations and Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                  Alertes Actives ({alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {alert.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                          <p className="text-xs text-gray-500">
                            Valeur: {alert.value} | Seuil: {alert.threshold}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(alert.createdAt.toString())}
                        </span>
                      </div>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <Link href="/alerts">
                      <Button variant="outline" size="sm" className="w-full">
                        Voir toutes les alertes ({alerts.length})
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultations History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-medical-blue" />
                Historique des Consultations ({consultations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consultations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">Aucune consultation enregistrée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Consultation du {formatDate(consultation.date.toString())}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Médecin: {consultation.doctorName}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingConsultation(consultation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteConsultationMutation.mutate(consultation.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Créatinine</p>
                          <p className="font-medium">{consultation.creatinine} mg/dL</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Poids</p>
                          <p className="font-medium">{consultation.weight} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tension</p>
                          <p className="font-medium">
                            {consultation.systolicBP}/{consultation.diastolicBP} mmHg
                          </p>
                        </div>
                      </div>

                      {consultation.notes && (
                        <>
                          <Separator className="my-3" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{consultation.notes}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Forms Dialog */}
      {patient && (
        <PatientEditForm 
          patient={patient}
          open={showEditForm}
          onOpenChange={setShowEditForm}
        />
      )}
      
      {editingConsultation && (
        <ConsultationEditForm 
          consultation={editingConsultation}
          open={!!editingConsultation}
          onOpenChange={(open) => !open && setEditingConsultation(null)}
        />
      )}
    </div>
  );
}