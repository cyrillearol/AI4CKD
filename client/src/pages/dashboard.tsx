import { useQuery } from "@tanstack/react-query";
import AlertCard from "@/components/alerts/alert-card";
import PatientCard from "@/components/patients/patient-card";
import ConsultationForm from "@/components/consultations/consultation-form";
import ClinicalChart from "@/components/charts/clinical-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Settings } from "lucide-react";
import { useState } from "react";
import ThresholdModal from "@/components/modals/threshold-modal";
import type { AlertWithPatient, Patient } from "@shared/schema";

export default function Dashboard() {
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<AlertWithPatient[]>({
    queryKey: ["/api/alerts/unread"]
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"]
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"]
  });

  const recentPatients = patients.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Critical Alerts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <span className="w-3 h-3 bg-alert-red rounded-full animate-pulse mr-2"></span>
            Alertes Critiques
          </CardTitle>
          <Button variant="link" className="text-medical-blue">
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune alerte critique en cours
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Management Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Patients Récents</CardTitle>
            <Button className="bg-medical-blue hover:bg-blue-700">
              <span className="mr-2">+</span>
              Nouveau Patient
            </Button>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun patient enregistré
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map(patient => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Consultation Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nouvelle Consultation</CardTitle>
            <FileText className="h-5 w-5 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <ConsultationForm />
          </CardContent>
        </Card>
      </div>

      {/* Clinical Data Visualization & PDF Export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Données Cliniques & Export</CardTitle>
          <div className="flex space-x-3">
            <Button className="bg-medical-green hover:bg-green-700">
              <FileText className="mr-2 h-4 w-4" />
              Générer PDF
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsThresholdModalOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Seuils
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <ClinicalChart
              title="Créatinine (mg/dL)"
              icon="chart-line"
              currentValue="2.8"
              unit="mg/dL"
              status="critical"
              threshold="2.0"
            />
            <ClinicalChart
              title="Tension Artérielle"
              icon="heartbeat"
              currentValue="180/110"
              unit="mmHg"
              status="high"
              threshold="160/100"
            />
            <ClinicalChart
              title="Poids"
              icon="weight"
              currentValue="65.2"
              unit="kg"
              status="warning"
              threshold="-5kg"
            />
          </div>

          {/* PDF Preview Section */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Aperçu Export PDF</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Contenu Inclus:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Identité patient
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Antécédents médicaux
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Historique consultations
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Données cliniques clés
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Alertes & Seuils:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Résumé des alertes
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Seuils personnalisés
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Graphiques d'évolution
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-medical-green rounded-full mr-2"></span>
                    Recommandations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ThresholdModal 
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
      />
    </div>
  );
}
