import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PatientCard from "@/components/patients/patient-card";
import PatientForm from "@/components/patients/patient-form";
import PatientEditForm from "@/components/patients/patient-edit-form";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import type { Patient } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/patients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient supprimé",
        description: "Le patient a été supprimé avec succès."
      });
      setDeletingPatient(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le patient.",
        variant: "destructive"
      });
    }
  });

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <div className="space-y-6">
        <PatientForm 
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Patients</h1>
        <Button 
          className="bg-medical-blue hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher un Patient</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {searchTerm ? "Aucun patient trouvé pour cette recherche" : "Aucun patient enregistré"}
              </div>
              {!searchTerm && (
                <Button 
                  className="bg-medical-blue hover:bg-blue-700"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter le premier patient
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              {filteredPatients.map(patient => (
                <div key={patient.id} className="w-full">
                  <PatientCard 
                    patient={patient} 
                    showDetails
                    onEdit={setEditingPatient}
                    onDelete={setDeletingPatient}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal édition patient */}
      {editingPatient && (
        <PatientEditForm 
          patient={editingPatient}
          open={!!editingPatient}
          onOpenChange={(open) => !open && setEditingPatient(null)}
        />
      )}

      {/* Modal suppression patient */}
      {deletingPatient && (
        <AlertDialog open={!!deletingPatient} onOpenChange={(open) => !open && setDeletingPatient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le patient {deletingPatient.firstName} {deletingPatient.lastName} ?
                Cette action est irréversible et supprimera également toutes les consultations et alertes associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deletingPatient.id)}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
