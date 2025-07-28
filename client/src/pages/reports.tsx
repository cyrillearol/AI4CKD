import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  Activity,
  AlertTriangle,
  Loader2 
} from "lucide-react";
import { Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePDF = async (patient: Patient) => {
    try {
      setGeneratingPdf(patient.id);
      
      const response = await apiRequest("GET", `/api/patients/${patient.id}/pdf`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${patient.firstName}-${patient.lastName}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Rapport PDF généré",
        description: `Le rapport médical de ${patient.firstName} ${patient.lastName} a été téléchargé.`,
      });
    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le rapport PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const getCkdStageColor = (stage: number) => {
    switch (stage) {
      case 1:
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 5:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Rapports PDF</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Rapports PDF</h1>
          <p className="text-gray-600">Générez des rapports médicaux complets de vos patients</p>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-medical-blue" />
          <Badge variant="outline" className="text-sm">
            {patients.length} patients
          </Badge>
        </div>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rechercher un Patient</CardTitle>
          <CardDescription>
            Trouvez un patient pour générer son rapport médical
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom ou prénom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des patients */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Aucun patient trouvé" : "Aucun patient"}
              </h3>
              <p className="text-gray-600 text-center">
                {searchTerm 
                  ? "Aucun patient ne correspond à votre recherche."
                  : "Ajoutez des patients pour générer des rapports PDF."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-medical-blue" />
                      <CardTitle className="text-lg">
                        {patient.firstName} {patient.lastName}
                      </CardTitle>
                      <Badge className={getCkdStageColor(patient.ckdStage)}>
                        Stade {patient.ckdStage}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')} 
                          ({Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans)
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{patient.gender}</span>
                      {patient.phone && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{patient.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => generatePDF(patient)}
                    disabled={generatingPdf === patient.id}
                    className="flex items-center space-x-2"
                  >
                    {generatingPdf === patient.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {generatingPdf === patient.id ? "Génération..." : "Télécharger PDF"}
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Historique médical */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Historique Médical
                    </Label>
                    <div className="space-y-1">
                      {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                        patient.medicalHistory.slice(0, 3).map((condition, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Aucun antécédent</span>
                      )}
                      {patient.medicalHistory && patient.medicalHistory.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{patient.medicalHistory.length - 3} autres
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact d'urgence */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Contact d'Urgence
                    </Label>
                    <p className="text-sm text-gray-600">
                      {patient.emergencyContact || "Non renseigné"}
                    </p>
                  </div>

                  {/* Dernière mise à jour */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Dernière Mise à Jour
                    </Label>
                    <p className="text-sm text-gray-600">
                      {new Date(patient.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Contenu du rapport PDF:</p>
                      <p className="text-blue-600">
                        Informations patient, historique médical, consultations récentes, 
                        alertes actives, évolution des paramètres vitaux
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}