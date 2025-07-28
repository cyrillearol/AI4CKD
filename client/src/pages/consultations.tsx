import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, FileText, User } from "lucide-react";
import ConsultationForm from "@/components/consultations/consultation-form";
import type { Consultation } from "@shared/schema";

export default function Consultations() {
  const [showForm, setShowForm] = useState(false);
  
  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"]
  });

  if (showForm) {
    return (
      <div className="space-y-6">
        <ConsultationForm 
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
        <Button 
          className="bg-medical-blue hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Consultation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-medical-blue" />
            Historique des Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Aucune consultation enregistrée</div>
              <Button 
                className="bg-medical-blue hover:bg-blue-700"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer la première consultation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map(consultation => (
                <div key={consultation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-medical-blue text-white rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Patient ID: {consultation.patientId.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(consultation.date.toString())}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Dr. {consultation.doctorName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    {consultation.creatinine && (
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm text-gray-600">Créatinine</div>
                        <div className="font-semibold text-medical-blue">
                          {consultation.creatinine} mg/dL
                        </div>
                      </div>
                    )}
                    {consultation.weight && (
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm text-gray-600">Poids</div>
                        <div className="font-semibold text-medical-green">
                          {consultation.weight} kg
                        </div>
                      </div>
                    )}
                    {consultation.systolicBP && consultation.diastolicBP && (
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-sm text-gray-600">Tension</div>
                        <div className="font-semibold text-red-600">
                          {consultation.systolicBP}/{consultation.diastolicBP}
                        </div>
                      </div>
                    )}
                  </div>

                  {consultation.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600 mb-1">Notes:</div>
                      <div className="text-sm text-gray-800">{consultation.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
